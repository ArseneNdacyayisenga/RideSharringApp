import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rideService } from '../../services/rideService';
import ReactPaginate from 'react-paginate';
import { 
  Car, Clock, MapPin, CreditCard, Phone, Filter, Search,
  ChevronLeft, ChevronRight, AlertCircle, Star, MoreHorizontal,
  Calendar, ArrowUpDown, Download, X
} from 'lucide-react';

const DriverHistory = () => {
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
    const fetchRides = async () => {
      setIsLoading(true);
      try {
        const response = await rideService.getRideHistory('DRIVER', currentPage, 10);
        
        // Apply filters (this would normally be handled on the server)
        let filteredRides = response.content;
        
        if (searchTerm) {
          filteredRides = filteredRides.filter(ride => 
            ride.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ride.dropoffLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ride.rider && ride.rider.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
      } catch (error) {
        console.error('Error fetching ride history:', error);
      } finally {
        setIsLoading(false);
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
          <h1 className="text-2xl md:text-3xl font-bold text-white">Driver Ride History</h1>
          <p className="text-dark-400">View and manage your past rides</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Link to="/driver/rides" className="btn btn-primary">
            <Car size={18} />
            <span>View Rides</span>
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
                placeholder="Search by location or rider"
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
            </div>
          )}
        </div>
      </div>

      {/* Ride List */}
      <div className="card bg-dark-800">
        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-dark-400">Date</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-dark-400">Pickup</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-dark-400">Dropoff</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-dark-400">Rider</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-dark-400">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-dark-400">Payment</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-dark-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <div className="loader"></div>
                  </td>
                </tr>
              ) : (
                rides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-dark-700">
                    <td className="px-4 py-2 text-sm text-dark-300">{new Date(ride.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-sm text-dark-300">{ride.pickupLocation}</td>
                    <td className="px-4 py-2 text-sm text-dark-300">{ride.dropoffLocation}</td>
                    <td className="px-4 py-2 text-sm text-dark-300">{ride.rider.name}</td>
                    <td className="px-4 py-2 text-sm text-dark-300">{renderStatusBadge(ride.status)}</td>
                    <td className="px-4 py-2 text-sm text-dark-300">{renderPaymentMethodIcon(ride.paymentMethod)}</td>
                    <td className="px-4 py-2 text-sm text-dark-300">
                      <button 
                        className="text-primary-500 hover:text-primary-400"
                        onClick={() => handleRideSelect(ride)}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4">
          <ReactPaginate
            previousLabel={<ChevronLeft size={16} />}
            nextLabel={<ChevronRight size={16} />}
            breakLabel={'...'}
            breakClassName={'break-me'}
            pageCount={totalPages}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={handlePageChange}
            containerClassName={'pagination'}
            activeClassName={'active'}
          />
        </div>
      </div>

      {/* Ride Detail Modal */}
      {showDetailModal && selectedRide && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="text-xl font-semibold">Ride Details</h2>
              <button className="close" onClick={() => setShowDetailModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p><strong>Date:</strong> {new Date(selectedRide.date).toLocaleDateString()}</p>
              <p><strong>Pickup:</strong> {selectedRide.pickupLocation}</p>
              <p><strong>Dropoff:</strong> {selectedRide.dropoffLocation}</p>
              <p><strong>Rider:</strong> {selectedRide.rider.name}</p>
              <p><strong>Status:</strong> {renderStatusBadge(selectedRide.status)}</p>
              <p><strong>Payment:</strong> {renderPaymentMethodIcon(selectedRide.paymentMethod)}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverHistory; 