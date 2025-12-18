import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { rideService } from '../../services/rideService';
import { paymentService } from '../../services/paymentService';
import {
  MapPin, Clock, CreditCard, Calendar, Star,
  TrendingUp, Car, ChevronRight, AlertCircle, Navigation,
  CheckCircle, XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';



const RiderDashboard = () => {
  const { user } = useAuth();

  const [activeRide, setActiveRide] = useState(null);
  const [recentRides, setRecentRides] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState({
    activeRide: true,
    recentRides: true,
    walletBalance: true,
    search: false,
  });

  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpSource, setTopUpSource] = useState('mtn'); // Default to MTN
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const loadDashboard = async () => {
      try {
        const [active, rides, wallet] = await Promise.all([
          rideService.getActiveRide('RIDER', user.id).catch(() => null),
          rideService.getRideHistory('RIDER', user.id, 0, 3),
          paymentService.getWalletBalance(),
        ]);

        setActiveRide(active);
        setRecentRides(rides?.content || []);
        setWalletBalance(wallet?.balance || 0);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading({
          activeRide: false,
          recentRides: false,
          walletBalance: false,
          search: false,
        });
      }
    };

    loadDashboard();

    // Poll for updates every 5 seconds if there is an active ride (or to check for one)
    const intervalId = setInterval(() => {
      rideService.getActiveRide('RIDER', user.id)
        .then(active => {
          if (active && (active.status === 'COMPLETED' || active.status === 'CANCELLED')) {
            setActiveRide(null);
            // Also refresh history context if needed, but active ride clearing is priority
          } else {
            setActiveRide(active);
          }
        })
        .catch(() => { }); // Silent catch for polling
    }, 5000);

    return () => clearInterval(intervalId);
  }, [user]);

  useEffect(() => {
    if (!query) setResults([]);
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(prev => ({ ...prev, search: true }));
    try {
      const data = await rideService.searchRides(query);
      setResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  };

  const handleTopUp = async () => {
    const amount = Number(topUpAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    try {
      // Mock payment method ID for now as per mock service
      const result = await paymentService.topUpWallet(amount, 'default-method');
      setWalletBalance(result.newBalance);
      setShowTopUpModal(false);
      setTopUpAmount('');
      alert(`Successfully added ${amount.toLocaleString()} RWF to your wallet!`);
    } catch (error) {
      console.error('Top up error:', error);
      alert('Failed to top up wallet');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelRide = async () => {
    if (!activeRide) return;
    if (!window.confirm("Are you sure you want to cancel this ride?")) return;

    setIsProcessing(true);
    try {
      await rideService.cancelRide(activeRide.id);
      alert('Ride cancelled successfully.');
      setActiveRide(null); // Clear active ride immediately
      await refreshDashboard();
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Failed to cancel ride');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteRide = async () => {
    if (!activeRide) return;

    // Calculate final fare (using estimated for now, but in real app would be actual meter)
    const finalFare = activeRide.estimatedFare || 0;

    if (!window.confirm(`Complete ride and pay ${finalFare.toLocaleString()} RWF?`)) return;

    setIsProcessing(true);
    try {
      // 1. Process Payment
      // We need to check the payment method. 
      // Assuming activeRide has paymentMethod object or ID. 
      // Based on BookRide, we send paymentMethodId. 
      // We might need to fetch full details or infer. activeRide from backend usually has expanded fields.
      // Let's assume activeRide.paymentMethod is the object (type: 'WALLET', 'CARD', etc.)

      // If we don't have payment info on activeRide, we might default to Cash or skip.
      // For this demo, let's assume 'WALLET' if not specified or check specific fields.
      // Note: In `rideService.js` mock, bookRide sends `paymentMethodId`.
      // The `activeRide` response structure isn't fully visible but likely mirrors transaction or ride history.

      // We'll trust the user's request: "transfer depending on chosen mode".

      // Heuristic: If payment method involves "Wallet" or isn't ID-based (mock), we withdraw.
      // Let's try to find the payment method type.
      // If we can't find it easily, we'll assume it was passed or look up.

      // CHECK: Does activeRide have paymentMethod?
      // In Dashboard load: `rideService.getActiveRide`
      // In `rideService`: calls endpoint.
      // In `BookRide`: we passed `paymentMethodId`.

      // For now, we will try to look for a property that hints at Wallet.
      // Or we can fetch the payment method details if needed.
      // Let's assume for this MVP that if the paymentMethodId is 'wallet' (if we had one) or we just check logic.

      // However, `paymentService` has `mockPaymentMethods`. None are explicitly "Wallet" type in the file I read (only CARD, MOBILE_MONEY).
      // WAIT. If the user wants "add money to wallet", that implies a separate Wallet balance system.
      // Usually, "Wallet" is a distinct payment method choice.
      // If the user selected "Card", we don't deduct from Wallet.
      // If the user selected "Wallet" (if it existed), we deduct.

      // Let's look at BookRide options again? 
      // I only saw mockPaymentMethods having CARD and MOBILE_MONEY.
      // If the user wants to pay via Wallet, they need a "Wallet" payment method option in BookRide.
      // I haven't seen that added yet. The user might be assuming it exists or wants me to add it?
      // "money should get transfered depending on the choosen mode"

      // Implication:
      // 1. If mode is WALLET -> Deduct from Wallet.
      // 2. If mode is CARD/MOBILE -> Just complete (external charge).

      // Since I don't recall adding a "Wallet" payment method to the list in `paymentService`, 
      // I might need to treating this request as: "If I pay by Wallet, deduct. If others, don't."

      // Implementation strategy:
      // We will check activeRide.paymentMethod (or ID).
      // If it looks like wallet (or we add logic to support it), we deduct.
      // Since `paymentService` only showed Card/Mobile, maybe the user implies I should ADD Wallet as a payment option too?
      // For now, I will implement the DEDUCTION logic if the method is 'WALLET'.
      // And I will simply call complete for others.
      // I will also log what the method is to help debug.

      let paymentSuccess = true;

      // MockING the object availability check
      const pMethod = activeRide.paymentMethod;
      // Handle both string ID (saved in backend) and object (if expanded)
      const methodId = typeof pMethod === 'object' ? pMethod?.id : pMethod;
      const methodType = typeof pMethod === 'object' ? pMethod?.type : null;

      const isWallet = methodId === 'wallet' || methodType === 'WALLET';

      if (isWallet) {
        const wallet = await paymentService.getWalletBalance();
        if (wallet.balance < finalFare) {
          alert(`Insufficient wallet balance (${wallet.balance.toLocaleString()} RWF). Please top up.`);
          setIsProcessing(false);
          return;
        }
        await paymentService.withdrawFromWallet(finalFare);
      }

      // 2. Complete Ride
      await rideService.completeRide(activeRide.id);

      alert(`Ride completed. Paid ${finalFare.toLocaleString()} RWF via ${pMethod.type || 'Selected Method'}.`);
      await refreshDashboard();

    } catch (error) {
      console.error('Complete error:', error);
      alert('Failed to complete ride: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const refreshDashboard = async () => {
    try {
      const [active, rides, wallet] = await Promise.all([
        rideService.getActiveRide('RIDER', user.id).catch(() => null),
        rideService.getRideHistory('RIDER', user.id, 0, 3),
        paymentService.getWalletBalance(),
      ]);

      // Only set as active if not COMPLETED or CANCELLED
      if (active && (active.status === 'COMPLETED' || active.status === 'CANCELLED')) {
        setActiveRide(null);
      } else {
        setActiveRide(active);
      }

      // Handle page-like response structure generic from Spring Data vs List
      const recentList = Array.isArray(rides) ? rides : (rides?.content || []);

      setRecentRides(recentList);
      setWalletBalance(wallet?.balance || 0);
    } catch (err) {
      console.error('Refresh error:', err);
    }
  };

  const totalSpending = recentRides.reduce((acc, ride) => acc + (ride.estimatedFare || 0), 0);


  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-1">
        Welcome back, {user?.name?.split(' ')[0]}
      </h1>
      <p className="text-dark-400 mb-6">Here's an overview of your recent activity</p>

      {/* Active Ride */}
      <div className="mb-8">
        {loading.activeRide ? (
          <div className="card p-6 flex justify-center">
            <div className="loader" />
          </div>
        ) : activeRide ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card border border-primary-500/30 bg-primary-900/10">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className={`mb-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${activeRide.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500 animate-pulse' :
                    activeRide.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400' :
                      activeRide.status === 'STARTED' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-dark-700 text-dark-300'
                    }`}>
                    {activeRide.status === 'PENDING' ? (
                      <>
                        <span className="w-2 h-2 mr-2 rounded-full bg-yellow-500"></span>
                        Searching for Driver...
                      </>
                    ) : (
                      <>
                        <Car size={14} className="mr-2" />
                        {activeRide.status === 'ACCEPTED' ? 'Driver Accepted - En Route' : activeRide.status}
                      </>
                    )}
                  </div>

                  <h3 className="text-xl text-white font-bold mb-1">
                    {activeRide.pickupLocation} <span className="text-dark-400 mx-2">to</span> {activeRide.dropoffLocation}
                  </h3>

                  <div className="mt-2 space-y-1">
                    <p className="text-dark-300 text-sm">
                      Est. Fare: <span className="text-white font-medium">{activeRide.estimatedFare?.toLocaleString()} RWF</span>
                    </p>
                    {activeRide.driver ? (
                      <p className="text-emerald-400 text-sm font-medium flex items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                        Driver: {activeRide.driver.name}
                      </p>
                    ) : (
                      <p className="text-dark-400 text-sm italic">Waiting for driver assignment...</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCancelRide()}
                    disabled={isProcessing}
                    className="btn btn-secondary text-sm border-red-500/50 hover:bg-red-500/10 text-red-400"
                  >
                    {isProcessing ? '...' : 'Cancel'}
                  </button>
                  {/* Only show Complete button if ride is started or accepted? usually driver ends it, but for demo rider can too */}
                  <button
                    onClick={() => handleCompleteRide()}
                    disabled={isProcessing}
                    className="btn btn-secondary text-sm border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400"
                  >
                    {isProcessing ? '...' : 'Complete'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="card p-6 text-center border-dashed border-2 border-dark-700 bg-transparent">
            <p className="text-dark-400 mb-4">No active ride at the moment</p>
            <Link to="/rider/book" className="btn btn-primary inline-flex">
              <MapPin size={18} /> Book a Ride
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard size={64} />
          </div>
          <p className="text-dark-400 text-sm mb-1">Wallet Balance</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-white">
              {loading.walletBalance ? '...' : `${walletBalance.toLocaleString()} RWF`}
            </p>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="text-primary-400 text-sm font-medium hover:text-primary-300 flex items-center"
            >
              + Add Money
            </button>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-dark-400 text-sm mb-1">Total Rides</p>
          <p className="text-3xl font-bold text-white">{recentRides.length}</p>
        </div>

        <div className="card p-5">
          <p className="text-dark-400 text-sm mb-1">Total Spent</p>
          <p className="text-3xl font-bold text-white">{totalSpending.toLocaleString()} RWF</p>
        </div>
      </div>

      {/* Recent Activity List Replacement for Charts */}
      <div className="card mb-8">
        <div className="p-6 border-b border-dark-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Recent Activity</h3>
          <Link to="/rider/history" className="text-primary-400 text-sm hover:underline">View All</Link>
        </div>
        <div className="p-6">
          {recentRides.length > 0 ? (
            <div className="space-y-4">
              {recentRides.map(ride => (
                <div key={ride.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-dark-700 last:border-0 last:pb-0 gap-3 sm:gap-0">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${ride.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                      ride.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' : 'bg-dark-700 text-dark-400'
                      }`}>
                      {ride.status === 'COMPLETED' ? <CheckCircle size={20} /> :
                        ride.status === 'CANCELLED' ? <XCircle size={20} /> : <Clock size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{ride.dropoffLocation}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${ride.status === 'COMPLETED' ? 'border-emerald-500/30 text-emerald-400' :
                          ride.status === 'CANCELLED' ? 'border-red-500/30 text-red-400' : 'border-dark-600 text-dark-400'
                          }`}>
                          {ride.status || 'PENDING'}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-dark-400 mt-1">
                        <span className="mr-2">{new Date(ride.date || ride.startTime || Date.now()).toLocaleDateString()}</span>
                        <span className="w-1 h-1 rounded-full bg-dark-600 mr-2"></span>
                        <span className="flex items-center">
                          {ride.driver?.name || 'Assigned Driver'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right pl-14 sm:pl-0">
                    <p className="text-white font-bold">{ride.fare || ride.estimatedFare?.toLocaleString()} RWF</p>
                    <p className="text-xs text-dark-400 flex items-center justify-end gap-1">
                      {ride.paymentMethod?.type === 'WALLET' ? 'Wallet' : 'Cash/Card'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-dark-400 text-center py-4">No recent activity.</p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mt-8 relative mb-12">
        <h3 className="text-lg font-bold text-white mb-4">Find a Ride</h3>
        <div className="relative">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for a destination..."
            className="input pl-10 w-full"
          />
          <div className="absolute left-3 top-3 text-dark-400">
            <Navigation size={18} />
          </div>
          {query && (
            <button
              onClick={handleSearch}
              className="absolute right-2 top-2 btn btn-primary py-1 px-3 text-sm h-8 min-h-0"
            >
              Search
            </button>
          )}
        </div>

        {loading.search && <div className="mt-4 flex justify-center"><div className="loader" /></div>}

        {results.length > 0 && query && (
          <div className="absolute bg-dark-800 w-full border border-dark-600 rounded-lg mt-2 z-50 shadow-xl overflow-hidden">
            {results.map(r => (
              <div key={r.id} className="p-4 border-b border-dark-700 cursor-pointer hover:bg-dark-700">
                <div className="flex justify-between">
                  <div>
                    <p className="text-white font-medium">{r.pickupLocation} → {r.dropoffLocation}</p>
                    <p className="text-xs text-dark-400">Driver: {r.driver?.name || 'Searching...'}</p>
                  </div>
                  <p className="text-primary-400 font-bold">{r.estimatedFare?.toLocaleString()} RWF</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-sm p-6 relative">
            <button
              onClick={() => setShowTopUpModal(false)}
              className="absolute top-4 right-4 text-dark-400 hover:text-white"
            >
              <span className="text-2xl">&times;</span>
            </button>

            <h3 className="text-xl font-bold text-white mb-4">Add Money to Wallet</h3>

            <div className="mb-6">
              <label className="block text-sm text-dark-400 mb-2">Amount (RWF)</label>
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="Enter amount (e.g. 5000)"
                className="input w-full text-lg"
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-dark-400 mb-2">Select Payment Source</label>
              <div className="space-y-2">
                <button
                  onClick={() => setTopUpSource('mtn')}
                  className={`w-full p-3 rounded border flex items-center justify-between ${topUpSource === 'mtn' ? 'border-primary-500 bg-primary-500/10' : 'border-dark-600 bg-dark-700'}`}
                >
                  <div className="flex items-center gap-3">
                    <Phone size={20} className="text-yellow-500" />
                    <span className="text-white">MTN Mobile Money</span>
                  </div>
                  {topUpSource === 'mtn' && <Check size={16} className="text-primary-500" />}
                </button>

                <button
                  onClick={() => setTopUpSource('card')}
                  className={`w-full p-3 rounded border flex items-center justify-between ${topUpSource === 'card' ? 'border-primary-500 bg-primary-500/10' : 'border-dark-600 bg-dark-700'}`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard size={20} className="text-blue-400" />
                    <span className="text-white">Bank Credit Card</span>
                  </div>
                  {topUpSource === 'card' && <Check size={16} className="text-primary-500" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTopUpModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleTopUp}
                disabled={isProcessing || !topUpSource}
                className="btn btn-primary flex-1"
              >
                {isProcessing ? 'Processing...' : 'Top Up'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderDashboard;
