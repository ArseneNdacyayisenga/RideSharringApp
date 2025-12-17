import React from 'react';

function DriverRides() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Available Rides</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">No rides available at the moment.</p>
      </div>
    </div>
  );
}

export default DriverRides;