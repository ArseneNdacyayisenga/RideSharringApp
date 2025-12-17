import React, { useEffect, useState } from 'react';
import { rideService } from '../../services/rideService';
import { useAuth } from '../../contexts/AuthContext';
import { MapPin, Navigation, Clock, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';

function DriverRides() {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const availableRides = await rideService.getAvailableRides();
      setRides(availableRides || []);
    } catch (error) {
      console.error('Failed to fetch rides:', error);
      toast.error('Could not load available rides');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRide = async (rideId) => {
    if (!user?.driver?.id) {
      toast.error('Driver profile not found');
      return;
    }

    setAccepting(rideId);
    try {
      await rideService.acceptRide(rideId, user.driver.id);
      toast.success('Ride accepted successfully!');
      // Remove the accepted ride from the list
      setRides(prev => prev.filter(r => r.id !== rideId));
    } catch (error) {
      console.error('Failed to accept ride:', error);
      toast.error('Failed to accept ride. It might be already taken.');
    } finally {
      setAccepting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Available Rides</h1>
        <button
          onClick={fetchRides}
          className="btn btn-secondary text-sm"
        >
          Refresh List
        </button>
      </div>

      {rides.length === 0 ? (
        <div className="card glass-panel p-8 text-center">
          <div className="bg-dark-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Navigation className="text-dark-400" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No rides available</h3>
          <p className="text-dark-400">Wait for new requests to appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rides.map((ride) => (
            <div key={ride.id} className="card glass-panel card-hover relative">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="badge badge-primary">New Request</span>
                  <span className="text-success font-bold flex items-center">
                    <DollarSign size={16} />
                    {ride.estimatedFare?.toLocaleString()} RWF
                  </span>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start">
                    <MapPin className="text-primary-400 mt-1 mr-3 flex-shrink-0" size={18} />
                    <div>
                      <p className="text-xs text-dark-400 uppercase tracking-wider">Pickup</p>
                      <p className="text-white font-medium">{ride.pickupLocation}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Navigation className="text-accent-400 mt-1 mr-3 flex-shrink-0" size={18} />
                    <div>
                      <p className="text-xs text-dark-400 uppercase tracking-wider">Dropoff</p>
                      <p className="text-white font-medium">{ride.dropoffLocation}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-dark-300 pt-2 border-t border-white/5">
                    <Clock size={16} className="mr-2" />
                    <span>{ride.distance?.toFixed(1)} km • ~{ride.duration} min</span>
                  </div>
                </div>

                <button
                  onClick={() => handleAcceptRide(ride.id)}
                  disabled={accepting === ride.id}
                  className="btn btn-primary w-full btn-glow"
                >
                  {accepting === ride.id ? 'Accepting...' : 'Accept Ride'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DriverRides;