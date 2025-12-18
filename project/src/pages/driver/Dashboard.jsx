import React, { useEffect, useState } from 'react';
import { rideService } from '../../services/rideService';

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-primary-600">{value}</p>
    </div>
  );
}

function DriverDashboard({ driverId }) {
  const [stats, setStats] = useState({ earnings: 'RWF 0', completedRides: 0, rating: 0 });
  const [activities, setActivities] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [available, setAvailable] = useState(null); // null = loading
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch ride history
        const history = await rideService.getRideHistory('DRIVER', driverId, 0, 10);
        const completedRides = history.filter(r => r.status === 'COMPLETED');
        const totalEarnings = completedRides.reduce((sum, r) => sum + (r.estimatedFare || 0), 0);
        const avgRating = completedRides.length
          ? completedRides.reduce((sum, r) => sum + (r.rating || 0), 0) / completedRides.length
          : 0;

        setStats({
          earnings: `RWF ${totalEarnings}`,
          completedRides: completedRides.length,
          rating: avgRating.toFixed(1),
        });

        setActivities(history.slice(0, 5));

        // Fetch active ride
        const active = await rideService.getActiveRide('DRIVER', driverId);
        setActiveRide(active);

        // Fetch driver availability
        const driver = await rideService.getDriver(driverId);
        setAvailable(driver.available);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        if (available === null) setAvailable(false); // fallback offline
      }
    };

    fetchDashboardData();
  }, [driverId]);

  const toggleAvailability = async () => {
    if (available === null) return;
    const newStatus = !available;
    setAvailable(newStatus); // optimistic update
    setLoading(true);

    try {
      await rideService.setDriverAvailability(driverId, newStatus);
    } catch (error) {
      console.error('Failed to toggle availability:', error);
      setAvailable(!newStatus); // revert on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Available</span>
          <button
            onClick={toggleAvailability}
            disabled={loading || available === null}
            className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${available ? 'bg-green-500' : 'bg-gray-300'
              }`}
          >
            <div
              className={`bg-white w-5 h-5 rounded-full shadow transform transition-transform duration-300 ${available ? 'translate-x-7' : 'translate-x-0'
                }`}
            ></div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Today's Earnings" value={stats.earnings} />
        <StatCard title="Completed Rides" value={stats.completedRides} />
        <StatCard title="Rating" value={stats.rating} />
      </div>

      {activeRide && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Ride</h2>
          <p className="font-medium text-gray-800">{activeRide.description}</p>
          <p className="text-sm text-gray-500">{activeRide.pickupLocation} → {activeRide.dropoffLocation}</p>
          <p className="text-sm text-gray-500">Fare: RWF {activeRide.estimatedFare}</p>
        </div>
      )}

      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((ride) => (
                <div key={ride.id} className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-800">{ride.pickupLocation} → {ride.dropoffLocation}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(ride.bookedAt).toLocaleDateString()} • {ride.rider ? `Passenger: ${ride.rider.name}` : 'Unknown Rider'} • RWF {ride.estimatedFare}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${ride.status === 'COMPLETED'
                      ? 'text-green-700 bg-green-100'
                      : 'text-yellow-700 bg-yellow-100'
                      }`}
                  >
                    {ride.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverDashboard;
