import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Car, User, CreditCard, MapPin, History, LogOut, 
  Menu, X, Home, ChevronDown, Search, Bell, DollarSign 
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isRider = user?.role === 'RIDER';
  
  // Navigation items based on user role
  const navItems = isRider
    ? [
        { to: '/rider/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
        { to: '/rider/book', icon: <MapPin size={20} />, label: 'Book Ride' },
        { to: '/rider/history', icon: <History size={20} />, label: 'Ride History' },
        { to: '/rider/payment', icon: <CreditCard size={20} />, label: 'Payment' },
        { to: '/rider/profile', icon: <User size={20} />, label: 'Profile' },
      ]
    : [
        { to: '/driver/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
        { to: '/driver/rides', icon: <Car size={20} />, label: 'Available Rides' },
        { to: '/driver/history', icon: <History size={20} />, label: 'Ride History' },
        { to: '/driver/earnings', icon: <DollarSign size={20} />, label: 'Earnings' },
        { to: '/driver/profile', icon: <User size={20} />, label: 'Profile' },
      ];

  // Mock notifications
  const notifications = [
    { id: 1, message: 'Your ride was completed successfully', time: '5 minutes ago', isRead: false },
    { id: 2, message: 'Payment of 3,500 RWF received', time: '2 hours ago', isRead: false },
    { id: 3, message: 'New promotional offer available', time: '1 day ago', isRead: true },
  ];

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Global search handler
  const handleSearch = (e) => {
    e.preventDefault();
    // In a real app, this would search through rides, transactions, etc.
    alert(`Searching for: ${searchQuery}`);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-dark-800 border-b border-dark-700 sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Logo & Mobile Menu Button */}
          <div className="flex items-center">
            <button 
              className="md:hidden mr-3 text-dark-300 hover:text-white"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <NavLink to={isRider ? '/rider/dashboard' : '/driver/dashboard'} className="flex items-center">
              <Car className="h-8 w-8 text-primary-500 mr-2" />
              <span className="text-xl font-bold text-white hidden sm:block">RwandaRide</span>
            </NavLink>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex relative mx-4 flex-1 max-w-md">
            <input 
              type="text" 
              placeholder="Search rides, payments, etc." 
              className="input pl-10 bg-dark-700 border-dark-600 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={18} />
          </form>
          
          {/* User Menu & Notifications */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <div className="relative">
              <button 
                className="btn-icon relative"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <Bell size={20} className="text-dark-300 hover:text-white" />
                {notifications.some(n => !n.isRead) && (
                  <span className="absolute -top-1 -right-1 bg-error w-2.5 h-2.5 rounded-full"></span>
                )}
              </button>
              
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 card p-0 shadow-lg z-50">
                  <div className="p-3 border-b border-dark-700 font-medium text-white flex justify-between items-center">
                    <span>Notifications</span>
                    <button className="text-primary-500 text-sm">Mark all as read</button>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-3 border-b border-dark-700 hover:bg-dark-700 ${!notification.isRead ? 'bg-dark-750' : ''}`}
                      >
                        <div className="flex items-start">
                          {!notification.isRead && (
                            <span className="w-2 h-2 rounded-full bg-primary-500 mt-2 mr-2"></span>
                          )}
                          <div className="flex-1">
                            <p className="text-white text-sm">{notification.message}</p>
                            <p className="text-dark-400 text-xs mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-dark-700 text-center">
                    <button className="text-primary-500 text-sm">View all notifications</button>
                  </div>
                </div>
              )}
            </div>
            
            {/* User Profile */}
            <div className="relative">
              <button 
                className="flex items-center space-x-2"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                <img 
                  src={user?.profileImage || 'https://via.placeholder.com/40'}
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover border border-dark-600"
                />
                <span className="hidden md:block text-white">{user?.name}</span>
                <ChevronDown size={16} className="hidden md:block text-dark-400" />
              </button>
              
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 card shadow-lg z-50">
                  <div className="p-3 border-b border-dark-700">
                    <div className="font-medium text-white">{user?.name}</div>
                    <div className="text-dark-400 text-sm">{user?.email}</div>
                  </div>
                  <div className="p-2">
                    <NavLink 
                      to={isRider ? '/rider/profile' : '/driver/profile'} 
                      className="flex items-center p-2 hover:bg-dark-700 rounded-md"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <User size={16} className="mr-2 text-dark-400" />
                      <span className="text-white">Profile</span>
                    </NavLink>
                    <button 
                      className="w-full flex items-center p-2 hover:bg-dark-700 rounded-md text-error"
                      onClick={logout}
                    >
                      <LogOut size={16} className="mr-2" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              className="input pl-10 bg-dark-700 border-dark-600 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" size={18} />
          </form>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside 
          className={`
            fixed md:static md:flex inset-0 z-40 flex-col w-64 h-screen bg-dark-800 border-r border-dark-700 transition-transform duration-300
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `
                    flex items-center px-4 py-3 rounded-lg text-base font-medium transition-colors
                    ${isActive 
                      ? 'bg-primary-600/20 text-primary-400' 
                      : 'text-dark-300 hover:bg-dark-700 hover:text-white'}
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                  
                  {/* Highlight current page with a dot indicator */}
                  {location.pathname === item.to && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-primary-500"></span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
          
          <div className="p-4 border-t border-dark-700">
            <button 
              className="flex items-center w-full px-4 py-2 text-error hover:bg-dark-700 rounded-lg transition-colors"
              onClick={logout}
            >
              <LogOut size={20} className="mr-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;