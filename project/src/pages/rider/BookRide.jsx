import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../contexts/AuthContext';
import { rideService } from '../../services/rideService';
import { paymentService } from '../../services/paymentService';
import { motion } from 'framer-motion';
import {
  Map as MapIcon, Search, MapPin, Navigation, Car, Clock, CreditCard,
  ChevronDown, ChevronsUpDown, Check, X, ArrowRight, User, Users, Phone, ChevronRight
} from 'lucide-react';

// Common SVG Icons as Leaflet DivIcons
const getMarkerIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const pickupIcon = getMarkerIcon('#8b5cf6'); // Violet
const dropoffIcon = getMarkerIcon('#10b981'); // Emerald

// Default map center (Kigali, Rwanda)
const DEFAULT_CENTER = [-1.9441, 30.0619];

// Component to handle map bounds
const MapBoundsHandler = ({ pickup, dropoff }) => {
  const map = useMap();

  useEffect(() => {
    if (pickup && dropoff) {
      const bounds = L.latLngBounds([pickup, dropoff]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (pickup) {
      map.flyTo(pickup, 14);
    } else if (dropoff) {
      map.flyTo(dropoff, 14);
    }
  }, [pickup, dropoff, map]);

  return null;
};

// Popular locations in Kigali
const popularLocations = [
  { name: "Kigali Convention Center", lat: -1.9536, lng: 30.0634 },
  { name: "Kigali International Airport", lat: -1.9631, lng: 30.1347 },
  { name: "Kigali Heights", lat: -1.9534, lng: 30.0616 },
  { name: "Nyabugogo Bus Station", lat: -1.9335, lng: 30.0464 },
  { name: "Kimironko Market", lat: -1.9340, lng: 30.1130 },
  { name: "Downtown Kigali", lat: -1.9474, lng: 30.0618 },
  { name: "Gikondo", lat: -1.9722, lng: 30.0797 },
  { name: "Remera", lat: -1.9557, lng: 30.1121 },
  { name: "Nyamirambo", lat: -1.9779, lng: 30.0381 },
  { name: "Kacyiru", lat: -1.9390, lng: 30.0763 },
];

// Ride types
const rideTypes = [
  { id: "basic", name: "RwandaRide Basic", icon: <Car size={20} />, multiplier: 1.0, desc: "Affordable rides for everyday" },
  { id: "pool", name: "RwandaRide Pool", icon: <Users size={20} />, multiplier: 0.75, desc: "Share & save with other riders" },
  { id: "premium", name: "RwandaRide Premium", icon: <User size={20} />, multiplier: 1.5, desc: "Premium cars with top drivers" },
];

const BookRide = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null); // [lat, lng]
  const [dropoffCoords, setDropoffCoords] = useState(null); // [lat, lng]
  const [routePositions, setRoutePositions] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedRideType, setSelectedRideType] = useState(rideTypes[0]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);
  const [walletBalance, setWalletBalance] = useState(0);

  // Fetch payment methods on component mount
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const methods = await paymentService.getPaymentMethods();
        setPaymentMethods(methods);
        setSelectedPaymentMethod(methods.find(m => m.isDefault) || methods[0]);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      }
    };

    fetchPaymentMethods();
  }, []);

  // Optionally, fetch wallet balance on component mount
  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const { balance } = await paymentService.getWalletBalance();
        setWalletBalance(balance);
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
      }
    };

    fetchWalletBalance();
  }, []);

  // Filter locations based on search term
  const filterLocations = (searchTerm) => {
    if (!searchTerm) return [];
    return popularLocations.filter(location =>
      location.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Handle location selection
  const handleSelectLocation = (location, type) => {
    if (type === 'pickup') {
      setPickupLocation(location.name);
      setPickupCoords([location.lat, location.lng]);
      setShowPickupSuggestions(false);
    } else {
      setDropoffLocation(location.name);
      setDropoffCoords([location.lat, location.lng]);
      setShowDropoffSuggestions(false);
    }
  };

  // Calculate Route using OSRM
  useEffect(() => {
    if (pickupCoords && dropoffCoords) {
      const fetchRoute = async () => {
        try {
          // OSRM expects [lng, lat]
          const start = `${pickupCoords[1]},${pickupCoords[0]}`;
          const end = `${dropoffCoords[1]},${dropoffCoords[0]}`;
          const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`);
          const data = await response.json();

          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            // Decode geometry (geojson is [lng, lat], Leaflet needs [lat, lng])
            const positions = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            setRoutePositions(positions);

            setDistance(route.distance / 1000); // meters to km
            setDuration(Math.ceil(route.duration / 60)); // seconds to minutes

            const baseFare = 1000;
            const distanceFare = (route.distance / 1000) * 500;
            const timeFare = (route.duration / 60) * 100;
            const fareBeforeMultiplier = baseFare + distanceFare + timeFare;
            const finalFare = Math.round(fareBeforeMultiplier * selectedRideType.multiplier);
            setEstimatedFare(finalFare);
          }
        } catch (error) {
          console.error("Error fetching route:", error);
          // Fallback to straight line if OSRM fails
          setRoutePositions([pickupCoords, dropoffCoords]);
        }
      };

      fetchRoute();
    } else {
      setRoutePositions([]);
      setDistance(null);
      setDuration(null);
      setEstimatedFare(null);
    }
  }, [pickupCoords, dropoffCoords, selectedRideType.multiplier]);


  // Proceed to confirmation step
  const proceedToConfirmation = () => {
    if (!pickupCoords || !dropoffCoords) {
      alert('Please select both pickup and dropoff locations');
      return;
    }
    setBookingStep(2);
  };

  // Handle booking confirmation
  const confirmBooking = async () => {
    if (!selectedPaymentMethod || isBooking) return;

    setIsBooking(true);

    try {
      const response = await rideService.bookRide({
        riderId: user?.id,
        pickupLocation,
        dropoffLocation,
        pickupLatitude: pickupCoords[0],
        pickupLongitude: pickupCoords[1],
        dropoffLatitude: dropoffCoords[0],
        dropoffLongitude: dropoffCoords[1],
        rideTypeId: selectedRideType.id,
        rideTypeId: selectedRideType.id,
        paymentMethod: selectedPaymentMethod.id, // Changed from paymentMethodId to match Backend Entity
        estimatedFare: estimatedFare,
        estimatedFare: estimatedFare,
        distance,
        duration
      });
      setBookingDetails(response);
      setBookingComplete(true);
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('Could not confirm booking. Try again.');
    } finally {
      setIsBooking(false);
    }
  };


  // Handle booking completion
  const handleBookingComplete = () => {
    navigate('/rider/dashboard');
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row">
      {/* Map Area */}
      <div className="h-1/2 md:h-full md:w-2/3 relative z-0">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBoundsHandler pickup={pickupCoords} dropoff={dropoffCoords} />

          {/* Pickup Marker */}
          {pickupCoords && (
            <Marker position={pickupCoords} icon={pickupIcon}>
              <Popup>{pickupLocation || "Pickup Location"}</Popup>
            </Marker>
          )}

          {/* Dropoff Marker */}
          {dropoffCoords && (
            <Marker position={dropoffCoords} icon={dropoffIcon}>
              <Popup>{dropoffLocation || "Dropoff Location"}</Popup>
            </Marker>
          )}

          {/* Route Polyline */}
          {routePositions.length > 0 && (
            <Polyline
              positions={routePositions}
              pathOptions={{ color: '#8b5cf6', weight: 5, opacity: 0.7 }}
            />
          )}
        </MapContainer>

        {/* Map Control Button - Recentering */}
        <button
          className="absolute bottom-4 right-4 bg-dark-800 p-3 rounded-full shadow-lg z-[400] text-white"
          onClick={() => {
            // Note: In React Leaflet, accessing map instance imperatively for this button 
            // typically requires a child component or useMap ref pattern.
            // For simplicity, we rely on MapBoundsHandler to refit when coords change.
            // Typically, we'd emit an event or update a state that MapBoundsHandler listens to force re-center.
            // For this MVP, we can skip manual re-center on click or implement later.
            alert("Auto-centering is active when locations change.");
          }}
        >
          <Navigation size={20} />
        </button>
      </div>

      {/* Booking Panel */}
      <div className="h-1/2 md:h-full md:w-1/3 bg-dark-900/95 backdrop-blur-xl overflow-y-auto border-l border-white/5 relative z-10">
        <div className="p-4 md:p-6">
          <div className="flex items-center mb-6">
            <MapIcon className="text-primary-500 mr-2" size={24} />
            <h2 className="text-xl font-bold text-white">Book a Ride</h2>
          </div>

          {bookingComplete ? (
            /* Booking Confirmation */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-success" size={36} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ride Booked Successfully!</h3>
              <p className="text-dark-400 mb-6">We're searching for drivers near you</p>

              <div className="card glass-panel p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-white font-medium">Estimated arrival</div>
                  <div className="text-accent-500 font-bold">{bookingDetails?.estimatedArrival || "5 min"}</div>
                </div>

                <div className="flex flex-col space-y-4 mb-4">
                  <div className="flex items-start">
                    <div className="mt-1 mr-3">
                      <div className="w-3 h-3 rounded-full bg-primary-500 ring-4 ring-primary-500/20"></div>
                    </div>
                    <div>
                      <p className="text-dark-400 text-sm">Pickup Location</p>
                      <p className="text-white">{pickupLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="mt-1 mr-3">
                      <div className="w-3 h-3 rounded-full bg-accent-500 ring-4 ring-accent-500/20"></div>
                    </div>
                    <div>
                      <p className="text-dark-400 text-sm">Dropoff Location</p>
                      <p className="text-white">{dropoffLocation}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-dark-700 pt-4">
                  <div className="flex justify-between text-dark-400 text-sm">
                    <span>Ride ID</span>
                    <span>{bookingDetails?.id || "#12345"}</span>
                  </div>
                  <div className="flex justify-between text-dark-400 text-sm mt-1">
                    <span>Estimated fare</span>
                    <span className="text-white font-medium">{bookingDetails?.estimatedFare?.toLocaleString() || estimatedFare?.toLocaleString()} RWF</span>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary w-full"
                onClick={handleBookingComplete}
              >
                Go to Dashboard
              </button>
            </motion.div>
          ) : bookingStep === 1 ? (
            /* Step 1: Location Selection */
            <div>
              <div className="mb-6">
                {/* Pickup Location */}
                <div className="relative mb-4">
                  <label className="block text-sm font-medium text-dark-400 mb-1">
                    Pickup Location
                  </label>
                  <div className="relative">
                    <input
                      ref={pickupInputRef}
                      type="text"
                      className="input-glass pl-10"
                      placeholder="Enter pickup location"
                      value={pickupLocation}
                      onChange={(e) => {
                        setPickupLocation(e.target.value);
                        setPickupCoords(null);
                        setShowPickupSuggestions(true);
                      }}
                      onFocus={() => setShowPickupSuggestions(true)}
                    />
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500" size={18} />
                    {pickupLocation && (
                      <button
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400"
                        onClick={() => {
                          setPickupLocation('');
                          setPickupCoords(null);
                        }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Pickup Suggestions */}
                  {showPickupSuggestions && pickupLocation && (
                    <div className="absolute z-50 mt-1 w-full bg-dark-800 border border-dark-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filterLocations(pickupLocation).map((location) => (
                        <button
                          key={location.name}
                          className="w-full text-left px-4 py-2 hover:bg-dark-700 text-white"
                          onClick={() => handleSelectLocation(location, 'pickup')}
                        >
                          {location.name}
                        </button>
                      ))}
                      {filterLocations(pickupLocation).length === 0 && (
                        <div className="px-4 py-2 text-dark-400">
                          No locations found. Try a different search.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dropoff Location */}
                <div className="relative">
                  <label className="block text-sm font-medium text-dark-400 mb-1">
                    Dropoff Location
                  </label>
                  <div className="relative">
                    <input
                      ref={dropoffInputRef}
                      type="text"
                      className="input-glass pl-10"
                      placeholder="Enter dropoff location"
                      value={dropoffLocation}
                      onChange={(e) => {
                        setDropoffLocation(e.target.value);
                        setDropoffCoords(null);
                        setShowDropoffSuggestions(true);
                      }}
                      onFocus={() => setShowDropoffSuggestions(true)}
                    />
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent-500" size={18} />
                    {dropoffLocation && (
                      <button
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400"
                        onClick={() => {
                          setDropoffLocation('');
                          setDropoffCoords(null);
                        }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Dropoff Suggestions */}
                  {showDropoffSuggestions && dropoffLocation && (
                    <div className="absolute z-50 mt-1 w-full bg-dark-800 border border-dark-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filterLocations(dropoffLocation).map((location) => (
                        <button
                          key={location.name}
                          className="w-full text-left px-4 py-2 hover:bg-dark-700 text-white"
                          onClick={() => handleSelectLocation(location, 'dropoff')}
                        >
                          {location.name}
                        </button>
                      ))}
                      {filterLocations(dropoffLocation).length === 0 && (
                        <div className="px-4 py-2 text-dark-400">
                          No locations found. Try a different search.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Popular Locations */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-dark-400 mb-2">Popular Locations</h4>
                <div className="flex flex-wrap gap-2">
                  {popularLocations.slice(0, 5).map((location) => (
                    <button
                      key={location.name}
                      className="bg-dark-800 text-white text-sm py-1 px-3 rounded-full hover:bg-dark-700"
                      onClick={() => {
                        if (!pickupCoords) {
                          handleSelectLocation(location, 'pickup');
                        } else if (!dropoffCoords) {
                          handleSelectLocation(location, 'dropoff');
                        }
                      }}
                    >
                      {location.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ride Information */}
              {distance && duration && (
                <div className="mb-6">
                  <div className="card glass-panel p-4">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div>
                        <p className="text-dark-400 text-xs">Distance</p>
                        <p className="text-white font-medium">{distance.toFixed(1)} km</p>
                      </div>
                      <div>
                        <p className="text-dark-400 text-xs">Duration</p>
                        <p className="text-white font-medium">{duration} min</p>
                      </div>
                      <div>
                        <p className="text-dark-400 text-xs">Fare</p>
                        <p className="text-white font-medium">{estimatedFare.toLocaleString()} RWF</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ride Type Selection */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-dark-400 mb-2">Select Ride Type</h4>
                <div className="space-y-2">
                  {rideTypes.map((type) => (
                    <button
                      key={type.id}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border ${selectedRideType.id === type.id
                        ? 'border-primary-500 bg-primary-600/10'
                        : 'border-dark-700 bg-dark-800 hover:bg-dark-750'
                        }`}
                      onClick={() => setSelectedRideType(type)}
                    >
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg ${selectedRideType.id === type.id ? 'bg-primary-600/20 text-primary-500' : 'bg-dark-700 text-dark-400'
                          }`}>
                          {type.icon}
                        </div>
                        <div className="ml-3 text-left">
                          <div className="font-medium text-white">{type.name}</div>
                          <div className="text-xs text-dark-400">{type.desc}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {estimatedFare && (
                          <div className="font-medium text-white">
                            {Math.round(estimatedFare * type.multiplier).toLocaleString()} RWF
                          </div>
                        )}
                        {selectedRideType.id === type.id && (
                          <div className="text-primary-500 text-sm">
                            Selected
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Continue Button */}
              <button
                className="btn btn-primary w-full"
                disabled={!pickupCoords || !dropoffCoords || !distance}
                onClick={proceedToConfirmation}
              >
                {!pickupCoords || !dropoffCoords ? 'Select Locations' : 'Continue to Payment'}
              </button>
            </div>
          ) : (
            /* Step 2: Payment Confirmation */
            <div>
              <button
                className="flex items-center text-primary-500 mb-6"
                onClick={() => setBookingStep(1)}
              >
                <ArrowRight className="transform rotate-180 mr-1" size={16} />
                <span>Back to locations</span>
              </button>

              <div className="card glass-panel p-4 mb-6">
                <h3 className="font-medium text-white mb-4">Ride Summary</h3>

                <div className="flex flex-col space-y-4 mb-4">
                  <div className="flex items-start">
                    <div className="mt-1 mr-3">
                      <div className="w-3 h-3 rounded-full bg-primary-500 ring-4 ring-primary-500/20"></div>
                    </div>
                    <div>
                      <p className="text-dark-400 text-sm">Pickup Location</p>
                      <p className="text-white">{pickupLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="mt-1 mr-3">
                      <div className="w-3 h-3 rounded-full bg-accent-500 ring-4 ring-accent-500/20"></div>
                    </div>
                    <div>
                      <p className="text-dark-400 text-sm">Dropoff Location</p>
                      <p className="text-white">{dropoffLocation}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-dark-700 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {selectedRideType.icon}
                      <span className="text-white ml-2">{selectedRideType.name}</span>
                    </div>
                    <span className="text-dark-400">{distance.toFixed(1)} km • {duration} min</span>
                  </div>

                  <div className="space-y-1 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-dark-400">Base fare</span>
                      <span>1,000 RWF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Distance ({distance.toFixed(1)} km × 500 RWF)</span>
                      <span>{Math.round(distance * 500).toLocaleString()} RWF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Time ({duration} min × 100 RWF)</span>
                      <span>{Math.round(duration * 100).toLocaleString()} RWF</span>
                    </div>
                    {selectedRideType.multiplier !== 1 && (
                      <div className="flex justify-between">
                        <span className="text-dark-400">
                          {selectedRideType.multiplier < 1 ? 'Discount' : 'Premium'} ({selectedRideType.multiplier < 1 ? '-' : '+'}
                          {Math.abs((1 - selectedRideType.multiplier) * 100)}%)
                        </span>
                        <span className={selectedRideType.multiplier < 1 ? 'text-success' : 'text-warning'}>
                          {selectedRideType.multiplier < 1 ? '-' : '+'}
                          {Math.abs(Math.round((1 - selectedRideType.multiplier) * estimatedFare)).toLocaleString()} RWF
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between font-medium border-t border-dark-700 pt-3">
                    <span>Total fare</span>
                    <span className="text-white text-lg">
                      {Math.round(estimatedFare * selectedRideType.multiplier).toLocaleString()} RWF
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-dark-400 mb-2">Payment Method</h4>

                <div className="space-y-2">
                  {paymentMethods.filter(m => m.type !== 'WALLET').map((method) => (
                    <button
                      key={method.id}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border ${selectedPaymentMethod?.id === method.id
                        ? 'border-primary-500 bg-primary-600/10'
                        : 'border-dark-700 bg-dark-800 hover:bg-dark-750'
                        }`}
                      onClick={() => setSelectedPaymentMethod(method)}
                    >
                      <div className="flex items-center">
                        {method.type === 'CARD' ? (
                          <div className={`p-2 rounded-lg ${selectedPaymentMethod?.id === method.id ? 'bg-primary-600/20 text-primary-500' : 'bg-dark-700 text-dark-400'
                            }`}>
                            <CreditCard size={20} />
                          </div>
                        ) : (
                          <div className={`p-2 rounded-lg ${selectedPaymentMethod?.id === method.id ? 'bg-primary-600/20 text-primary-500' : 'bg-dark-700 text-dark-400'
                            }`}>
                            <Phone size={20} />
                          </div>
                        )}
                        <div className="ml-3 text-left">
                          {method.type === 'CARD' ? (
                            <>
                              <div className="font-medium text-white">{method.brand}</div>
                              <div className="text-xs text-dark-400">**** {method.last4}</div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium text-white">{method.provider} Mobile Money</div>
                              <div className="text-xs text-dark-400">{method.phoneNumber}</div>
                            </>
                          )}
                        </div>
                      </div>

                      {selectedPaymentMethod?.id === method.id && (
                        <div className="text-primary-500">
                          <Check size={18} />
                        </div>
                      )}
                    </button>
                  ))}

                  <button
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-dashed border-dark-700 hover:border-dark-600 bg-dark-800 hover:bg-dark-750"
                    onClick={() => navigate('/rider/payment')}
                  >
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-dark-700 text-dark-400">
                        <CreditCard size={20} />
                      </div>
                      <div className="ml-3 text-left">
                        <div className="font-medium text-white">Add Payment Method</div>
                      </div>
                    </div>
                    <ChevronRight className="text-dark-400" size={18} />
                  </button>
                </div>

                <div className="flex items-center mt-4">
                  <div className="flex-1 h-px bg-dark-700"></div>
                  <span className="px-4 text-dark-400 text-sm">Or pay with</span>
                  <div className="flex-1 h-px bg-dark-700"></div>
                </div>

                <button
                  className={`w-full mt-4 p-3 rounded-lg border flex items-center justify-center ${selectedPaymentMethod?.id === 'wallet'
                    ? 'border-primary-500 bg-primary-600/10'
                    : 'border-dark-700 bg-dark-800 hover:bg-dark-750' // Fixed syntax error here
                    }`}
                  onClick={() => setSelectedPaymentMethod({ id: 'wallet', type: 'WALLET', name: 'Wallet Balance' })}
                >
                  <span className="text-white font-medium">Pay with Wallet Balance ({walletBalance.toLocaleString()} RWF)</span>
                  {selectedPaymentMethod?.id === 'wallet' && <Check className="ml-2 text-primary-500" size={18} />}
                </button>
              </div>

              {/* Book Ride Button */}
              <button
                className="btn btn-primary w-full btn-glow"
                disabled={isBooking || !selectedPaymentMethod}
                onClick={confirmBooking}
              >
                {isBooking ? (
                  <>
                    <div className="loader border-t-white"></div>
                    <span>Booking Ride...</span>
                  </>
                ) : (
                  'Book Ride Now'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookRide;