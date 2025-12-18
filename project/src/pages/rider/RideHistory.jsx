import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rideService } from '../../services/rideService';
import ReactPaginate from 'react-paginate';
import {
  Car, Clock, MapPin, CreditCard, Phone, Filter, Search,
  ChevronLeft, ChevronRight, AlertCircle, Star, MoreHorizontal,
  Calendar, ArrowUpDown, Download, X, ArrowRight
} from 'lucide-react';

const RideHistory = () => {
  const [rides, setRides] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch rides on component mount and when filters change
  useEffect(() => {
    console.log("RideHistory mounted/updated. Filters:", { currentPage, searchTerm, statusFilter, dateFilter });
    const fetchRides = async () => {
      setIsLoading(true);
      console.log("Fetching rides...");
      try {
        const response = await rideService.getRideHistory('RIDER', currentPage, 10);
        console.log("Ride history response:", response);

        if (!response || !response.content) {
          console.warn("Invalid response structure:", response);
          setRides([]);
          setTotalPages(0);
          return;
        }

        // Apply filters (this would normally be handled on the server)
        let filteredRides = response.content;

        if (searchTerm) {
          filteredRides = filteredRides.filter(ride =>
            ride.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ride.dropoffLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ride.driver && ride.driver.name.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }

        if (statusFilter !== 'ALL') {
          filteredRides = filteredRides.filter(ride => ride.status === statusFilter);
        }

        if (dateFilter !== 'ALL') {
          const now = new Date();
          const filterDate = new Date();

          switch (dateFilter) {
            case 'TODAY':
              filterDate.setHours(0, 0, 0, 0);
              filteredRides = filteredRides.filter(ride => new Date(ride.date) >= filterDate);
              break;
            case 'THIS_WEEK':
              filterDate.setDate(now.getDate() - now.getDay());
              filterDate.setHours(0, 0, 0, 0);
              filteredRides = filteredRides.filter(ride => new Date(ride.date) >= filterDate);
              break;
            case 'THIS_MONTH':
              filterDate.setDate(1);
              filterDate.setHours(0, 0, 0, 0);
              filteredRides = filteredRides.filter(ride => new Date(ride.date) >= filterDate);
              break;
            default:
              break;
          }
        }

        setRides(filteredRides);
        setTotalPages(Math.ceil(filteredRides.length / 10));
        console.log("Rides state updated:", filteredRides);
      } catch (error) {
        console.error('Error fetching ride history:', error);
      } finally {
        setIsLoading(false);
        console.log("Loading set to false");
      }
    };

    fetchRides();
  }, [currentPage, searchTerm, statusFilter, dateFilter]);

  // Handle page change
  const handlePageChange = (selectedItem) => {
    setCurrentPage(selectedItem.selected);
  };

  // Handle ride selection for detail view
  const handleRideSelect = (ride) => {
    setSelectedRide(ride);
    setShowDetailModal(true);
  };

  // Handle clearing all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setDateFilter('ALL');
    setIsFilterOpen(false);
  };

  // Render status badge based on ride status
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-success">Completed</span>;
      case 'CANCELLED':
        return <span className="badge badge-error">Cancelled</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-primary">In Progress</span>;
      case 'PENDING':
        return <span className="badge badge-warning">Pending</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  // Render payment method icon
  const renderPaymentMethodIcon = (method) => {
    if (!method) return null;

    switch (method) {
      case 'CARD':
        return <CreditCard size={16} className="text-dark-400" />;
      case 'MOBILE_MONEY':
        return <Phone size={16} className="text-dark-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Ride History</h1>
          <p className="text-dark-400">View and manage your past rides</p>
        </div>

        <div className="mt-4 md:mt-0">
          <Link to="/rider/book" className="btn btn-primary">
            <Car size={18} />
            <span>Book a Ride</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card bg-dark-800 mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                className="input pl-10 w-full"
                placeholder="Search by location or driver"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={18} />
              {searchTerm && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-300"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Filter Button (Mobile) */}
            <div className="md:hidden">
              <button
                className="btn btn-secondary w-full"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter size={18} />
                <span>Filters</span>
                {(statusFilter !== 'ALL' || dateFilter !== 'ALL') && (
                  <span className="ml-2 w-5 h-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">
                    {(statusFilter !== 'ALL' ? 1 : 0) + (dateFilter !== 'ALL' ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Desktop Filters */}
            <div className="hidden md:flex gap-4">
              <div className="w-48">
                <select
                  className="input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
              <div className="w-48">
                <select
                  className="input"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="THIS_WEEK">This Week</option>
                  <option value="THIS_MONTH">This Month</option>
                </select>
              </div>
              {(statusFilter !== 'ALL' || dateFilter !== 'ALL') && (
                <button
                  className="text-primary-500 hover:text-primary-400 flex items-center"
                  onClick={clearFilters}
                >
                  <X size={16} className="mr-1" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Filters */}
          {isFilterOpen && (
            <div className="mt-4 md:hidden border-t border-dark-700 pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-1">
                  Status
                </label>
                <select
                  className="input w-full"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-1">
                  Date Range
                </label>
                <select
                  className="input w-full"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="THIS_WEEK">This Week</option>
                  <option value="THIS_MONTH">This Month</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-secondary flex-1"
                  onClick={() => setIsFilterOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary flex-1"
                  onClick={() => setIsFilterOpen(false)}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rides Table */}
      <div className="card bg-dark-800 overflow-hidden mb-6">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="loader"></div>
            <span className="ml-3 text-dark-400">Loading ride history...</span>
          </div>
        ) : rides.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="text-dark-400" size={32} />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No rides found</h3>
            <p className="text-dark-400 mb-4">
              {searchTerm || statusFilter !== 'ALL' || dateFilter !== 'ALL'
                ? "Try changing your search or filters"
                : "You haven't taken any rides yet"}
            </p>
            {searchTerm || statusFilter !== 'ALL' || dateFilter !== 'ALL' ? (
              <button
                className="btn btn-primary inline-flex"
                onClick={clearFilters}
              >
                <X size={18} />
                <span>Clear Filters</span>
              </button>
            ) : (
              <Link to="/rider/book" className="btn btn-primary inline-flex">
                <Car size={18} />
                <span>Book Your First Ride</span>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Table Headers */}
            <div className="hidden md:grid grid-cols-5 gap-4 p-4 border-b border-dark-700 text-dark-400 font-medium">
              <div className="flex items-center">
                <span>Date & Time</span>
                <button className="ml-1 text-dark-500 hover:text-dark-400">
                  <ArrowUpDown size={14} />
                </button>
              </div>
              <div>Route</div>
              <div className="flex items-center">
                <span>Status</span>
                <button className="ml-1 text-dark-500 hover:text-dark-400">
                  <ArrowUpDown size={14} />
                </button>
              </div>
              <div className="flex items-center">
                <span>Fare</span>
                <button className="ml-1 text-dark-500 hover:text-dark-400">
                  <ArrowUpDown size={14} />
                </button>
              </div>
              <div className="text-center">Actions</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-dark-700">
              {rides.map((ride) => (
                <div
                  key={ride.id}
                  className="grid md:grid-cols-5 gap-4 p-4 hover:bg-dark-750 transition-colors"
                >
                  {/* Mobile View */}
                  <div className="md:hidden">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center text-dark-400 text-sm">
                        <Clock size={14} className="mr-1" />
                        <span>
                          {new Date(ride.date).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div>
                        {renderStatusBadge(ride.status)}
                      </div>
                    </div>

                    <div className="flex items-start mb-3">
                      <MapPin size={16} className="text-primary-500 mr-2 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-white font-medium">{ride.pickupLocation}</p>
                        <div className="h-6 border-l border-dashed border-dark-600 ml-1"></div>
                        <p className="text-white font-medium">{ride.dropoffLocation}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        {ride.status === 'COMPLETED' ? (
                          <div className="flex items-center">
                            <p className="text-white font-medium">{ride.fare.toLocaleString()} RWF</p>
                            {ride.paymentMethod && (
                              <div className="ml-2">
                                {renderPaymentMethodIcon(ride.paymentMethod)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-dark-400">-</p>
                        )}
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleRideSelect(ride)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:flex items-center text-white">
                    <Clock size={16} className="text-dark-400 mr-2" />
                    <div>
                      {new Date(ride.date).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      <div className="text-dark-400 text-sm">
                        {new Date(ride.date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center">
                    <div>
                      <p className="text-white">{ride.pickupLocation}</p>
                      <p className="text-dark-400 text-sm flex items-center mt-1">
                        <ArrowRight size={14} className="mr-1" />
                        {ride.dropoffLocation}
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center">
                    {renderStatusBadge(ride.status)}
                  </div>

                  <div className="hidden md:block">
                    {ride.status === 'COMPLETED' ? (
                      <div className="flex items-center">
                        <p className="text-white font-medium">{ride.fare.toLocaleString()} RWF</p>
                        {ride.paymentMethod && (
                          <div className="ml-2">
                            {renderPaymentMethodIcon(ride.paymentMethod)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-dark-400">-</p>
                    )}
                  </div>

                  <div className="hidden md:flex items-center justify-center">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRideSelect(ride)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && rides.length > 0 && totalPages > 1 && (
        <div className="flex justify-center">
          <ReactPaginate
            previousLabel={<ChevronLeft size={18} />}
            nextLabel={<ChevronRight size={18} />}
            breakLabel="..."
            pageCount={totalPages}
            marginPagesDisplayed={1}
            pageRangeDisplayed={2}
            onPageChange={handlePageChange}
            containerClassName="flex items-center space-x-1"
            pageClassName="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-dark-700 text-dark-300"
            pageLinkClassName="w-full h-full flex items-center justify-center"
            previousClassName="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-dark-700 text-dark-300"
            nextClassName="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-dark-700 text-dark-300"
            breakClassName="w-10 h-10 flex items-center justify-center text-dark-400"
            activeClassName="!bg-primary-600 !text-white"
          />
        </div>
      )}

      {/* Ride Detail Modal */}
      {showDetailModal && selectedRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card bg-dark-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-dark-800 border-b border-dark-700">
              <h3 className="text-lg font-medium text-white">Ride Details</h3>
              <button
                className="text-dark-400 hover:text-white"
                onClick={() => setShowDetailModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Calendar size={16} className="text-dark-400 mr-2" />
                  <span className="text-white">
                    {new Date(selectedRide.date).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div>
                  {renderStatusBadge(selectedRide.status)}
                </div>
              </div>

              <div className="card bg-dark-700 p-4 mb-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start">
                    <div className="mt-1 mr-3">
                      <div className="w-3 h-3 rounded-full bg-primary-500 ring-4 ring-primary-500/20"></div>
                    </div>
                    <div>
                      <p className="text-dark-400 text-sm">Pickup Location</p>
                      <p className="text-white">{selectedRide.pickupLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="mt-1 mr-3">
                      <div className="w-3 h-3 rounded-full bg-accent-500 ring-4 ring-accent-500/20"></div>
                    </div>
                    <div>
                      <p className="text-dark-400 text-sm">Dropoff Location</p>
                      <p className="text-white">{selectedRide.dropoffLocation}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedRide.status === 'COMPLETED' && (
                <>
                  {/* Driver and Vehicle Info */}
                  {selectedRide.driver && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="card bg-dark-700 p-4">
                        <h4 className="text-sm font-medium text-dark-400 mb-3">Driver</h4>
                        <div className="flex items-center">
                          <img
                            src={selectedRide.driver.profileImage}
                            alt={selectedRide.driver.name}
                            className="w-12 h-12 rounded-full object-cover mr-3"
                          />
                          <div>
                            <p className="text-white font-medium">{selectedRide.driver.name}</p>
                            <div className="flex items-center text-dark-400 text-sm">
                              <Star className="text-warning" size={14} fill="#f59e0b" />
                              <span className="ml-1">{selectedRide.driver.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedRide.vehicle && (
                        <div className="card bg-dark-700 p-4">
                          <h4 className="text-sm font-medium text-dark-400 mb-3">Vehicle</h4>
                          <p className="text-white font-medium">
                            {selectedRide.vehicle.color} {selectedRide.vehicle.make} {selectedRide.vehicle.model}
                          </p>
                          <p className="text-primary-400 mt-1">{selectedRide.vehicle.licensePlate}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ride Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="card bg-dark-700 p-3">
                      <p className="text-dark-400 text-xs">Distance</p>
                      <p className="text-white font-medium">{selectedRide.distance} km</p>
                    </div>
                    <div className="card bg-dark-700 p-3">
                      <p className="text-dark-400 text-xs">Duration</p>
                      <p className="text-white font-medium">{selectedRide.duration} min</p>
                    </div>
                    <div className="card bg-dark-700 p-3">
                      <p className="text-dark-400 text-xs">Fare</p>
                      <p className="text-white font-medium">{selectedRide.fare.toLocaleString()} RWF</p>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="card bg-dark-700 p-4 mb-6">
                    <h4 className="text-sm font-medium text-dark-400 mb-3">Payment Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-dark-400">Payment Method</span>
                        <span className="text-white">
                          {selectedRide.paymentMethod === 'CARD' ? 'Credit Card' : 'Mobile Money'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-400">Base Fare</span>
                        <span className="text-white">1,000 RWF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-400">Distance Charge</span>
                        <span className="text-white">
                          {Math.round(selectedRide.distance * 500).toLocaleString()} RWF
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-400">Time Charge</span>
                        <span className="text-white">
                          {Math.round(selectedRide.duration * 100).toLocaleString()} RWF
                        </span>
                      </div>
                      <div className="pt-2 border-t border-dark-600 flex justify-between font-medium">
                        <span>Total</span>
                        <span className="text-white">{selectedRide.fare.toLocaleString()} RWF</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  {selectedRide.rating && (
                    <div className="card bg-dark-700 p-4 mb-6">
                      <h4 className="text-sm font-medium text-dark-400 mb-3">Your Rating</h4>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={24}
                            className={i < selectedRide.rating ? 'text-warning' : 'text-dark-500'}
                            fill={i < selectedRide.rating ? '#f59e0b' : 'none'}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Cancelled or Pending Ride */}
              {selectedRide.status === 'CANCELLED' && (
                <div className="card bg-dark-700 p-4 mb-6">
                  <div className="flex items-center">
                    <AlertCircle className="text-error mr-2" size={20} />
                    <h4 className="text-white font-medium">Ride was cancelled</h4>
                  </div>
                  <p className="text-dark-400 mt-2">
                    This ride was cancelled and no payment was processed.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 justify-end">
                {selectedRide.status === 'COMPLETED' && (
                  <button className="btn btn-secondary">
                    <Download size={18} />
                    <span>Receipt</span>
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RideHistory;