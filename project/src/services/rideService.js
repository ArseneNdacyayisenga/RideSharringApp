const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/rides`;

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = 'Request failed';
    try {
      errorMessage = await response.text();
    } catch (_) {}
    throw new Error(errorMessage);
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const rideService = {
  // Rider actions
  bookRide: (rideDetails) =>
    request(`${API_BASE_URL}/book`, {
      method: 'POST',
      body: JSON.stringify(rideDetails),
    }),

  cancelRide: (rideId) =>
    request(`${API_BASE_URL}/cancel/${rideId}`, {
      method: 'POST',
    }),

  rateRide: (rideId, rating, comment) =>
    request(`${API_BASE_URL}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rideId, rating, comment }),
    }),

  // Shared (Rider & Driver)
  getRideDetails: (rideId) =>
    request(`${API_BASE_URL}/${rideId}`),

  getActiveRide: (userRole, userId) =>
    request(`${API_BASE_URL}/active?role=${userRole}&userId=${userId}`),

  getRideHistory: (userRole, userId, page = 0, size = 10) =>
    request(`${API_BASE_URL}/history?role=${userRole}&userId=${userId}&page=${page}&size=${size}`),

  // Driver actions
  getAvailableRides: () =>
    request(`${API_BASE_URL}/available`),

  acceptRide: (rideId, driverId) =>
    request(`${API_BASE_URL}/accept`, {
      method: 'POST',
      body: JSON.stringify({ rideId, driverId }),
    }),

  startRide: (rideId) =>
    request(`${API_BASE_URL}/start/${rideId}`, { method: 'POST' }),

  completeRide: (rideId) =>
    request(`${API_BASE_URL}/complete/${rideId}`, { method: 'POST' }),

  // Driver availability
  getDriver: (driverId) =>
    request(`${API_BASE_URL}/drivers/${driverId}`),

  setDriverAvailability: (driverId, available) =>
    request(`${API_BASE_URL}/drivers/${driverId}/availability?available=${available}`, { method: 'POST' }),

  // Search / Dashboard
  searchRides: (query) =>
    request(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`),
};
