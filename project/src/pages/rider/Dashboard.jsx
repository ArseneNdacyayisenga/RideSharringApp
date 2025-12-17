import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { rideService } from '../../services/rideService';
import { paymentService } from '../../services/paymentService';
import {
  MapPin, Clock, CreditCard, Calendar, Star,
  TrendingUp, Car, ChevronRight, AlertCircle, Navigation
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
            <div className="p-4">
              <p className="text-primary-400 font-medium mb-2 flex items-center">
                <Car size={18} className="mr-2" /> Active Ride
              </p>
              <p className="text-white font-medium">
                {activeRide.pickupLocation} → {activeRide.dropoffLocation}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="card p-6 text-center">
            <p className="text-dark-400 mb-3">No active ride</p>
            <Link to="/rider/book" className="btn btn-primary inline-flex">
              <MapPin size={18} /> Book a Ride
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-dark-400 text-sm">Wallet Balance</p>
          <p className="text-2xl font-bold text-white">
            {loading.walletBalance ? '...' : `${walletBalance.toLocaleString()} RWF`}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-dark-400 text-sm">Total Rides</p>
          <p className="text-2xl font-bold text-white">{recentRides.length}</p>
        </div>

        <div className="card p-4">
          <p className="text-dark-400 text-sm">This Week</p>
          <p className="text-2xl font-bold text-white">{totalSpending.toLocaleString()} RWF</p>
        </div>
      </div>

      {/* Charts (Removed as backend does not strictly support analytics yet) */}
      {/* 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card p-4 h-64">
           Placeholder for Monthly Rides 
        </div>
        <div className="card p-4 h-64">
           Placeholder for Weekly Spending 
        </div>
      </div>
      */}

      {/* Recent Activity List Replacement for Charts */}
      <div className="card mb-8 p-6">
        <h3 className="text-xl font-semibold mb-4 text-white">Recent Activity</h3>
        {recentRides.length > 0 ? (
          <div className="space-y-4">
            {recentRides.map(ride => (
              <div key={ride.id} className="flex justify-between items-center border-b border-gray-700 pb-2">
                <div>
                  <p className="text-white">{ride.pickupLocation} → {ride.dropoffLocation}</p>
                  <p className="text-sm text-gray-400">{new Date(ride.bookedAt).toLocaleDateString()}</p>
                </div>
                <span className="text-primary-400 font-bold">{ride.estimatedFare} RWF</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No recent activity.</p>
        )}
      </div>

      {/* Search */}
      <div className="mt-8 relative">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search rides..."
          className="search-input w-full"
        />
        <button onClick={handleSearch} className="search-button mt-2">
          Search
        </button>

        {loading.search && <p className="text-sm text-dark-400 mt-2">Searching...</p>}

        {results.length > 0 && (
          <div className="absolute bg-white w-full border rounded mt-2 z-50">
            {results.map(r => (
              <div key={r.id} className="p-3 border-b cursor-pointer hover:bg-gray-100">
                <p><strong>{r.pickupLocation}</strong> → {r.dropoffLocation}</p>
                <p className="text-sm">{r.estimatedFare?.toLocaleString()} RWF</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderDashboard;
