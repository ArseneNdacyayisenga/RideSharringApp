import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Car } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col md:flex-row">
      {/* Left Section - Branding & Info */}
      <div className="md:w-1/2 bg-gradient-to-br from-primary-950 to-dark-950 p-8 flex flex-col justify-center items-center text-center md:text-left">
        <div className="mb-8 fade-in">
          <div className="flex items-center justify-center md:justify-start mb-4">
            <Car className="h-10 w-10 text-primary-500 mr-2" />
            <span className="text-3xl font-bold text-white">RwandaRide</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Premium Ride Sharing in Kigali
          </h1>
          <p className="text-dark-300 text-lg mb-8 max-w-md mx-auto md:mx-0">
            Convenient, safe, and affordable rides around Kigali. Join thousands of satisfied customers today.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="card p-4 bg-dark-800/30 backdrop-blur-sm">
              <div className="font-bold text-accent-400 text-xl">5000+</div>
              <div className="text-dark-300">Happy Customers</div>
            </div>
            <div className="card p-4 bg-dark-800/30 backdrop-blur-sm">
              <div className="font-bold text-accent-400 text-xl">300+</div>
              <div className="text-dark-300">Qualified Drivers</div>
            </div>
            <div className="card p-4 bg-dark-800/30 backdrop-blur-sm">
              <div className="font-bold text-accent-400 text-xl">4.8</div>
              <div className="text-dark-300">Average Rating</div>
            </div>
          </div>
        </div>
        
        <div className="hidden md:block text-dark-400 text-sm mt-12">
          © 2023 RwandaRide. All rights reserved.
        </div>
      </div>
      
      {/* Right Section - Auth Forms */}
      <div className="md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;