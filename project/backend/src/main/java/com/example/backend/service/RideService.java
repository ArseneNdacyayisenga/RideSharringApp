package com.example.backend.service;

import com.example.backend.model.Driver;
import com.example.backend.model.Ride;
import com.example.backend.repository.DriverRepository;
import com.example.backend.repository.RideRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class RideService {

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private com.example.backend.repository.UserRepository userRepository;

    // RIDE LIFECYCLE

    public Ride bookRide(Ride ride) {
        if (ride.getRiderId() == null)
            throw new IllegalArgumentException("Rider ID is required");
        if (ride.getStatus() == null)
            ride.setStatus("PENDING");
        if (ride.getBookedAt() == null)
            ride.setBookedAt(LocalDateTime.now());
        if (ride.getEstimatedFare() == null)
            throw new IllegalArgumentException("Estimated fare is required");
        if (ride.getDistance() == null)
            throw new IllegalArgumentException("Distance is required");
        if (ride.getDuration() == null)
            throw new IllegalArgumentException("Duration is required");
        return rideRepository.save(ride);
    }

    public Ride cancelRide(Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        ride.setStatus("CANCELLED");
        return rideRepository.save(ride);
    }

    public Ride acceptRide(Long rideId, Long driverId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        ride.setDriverId(driverId);
        ride.setStatus("ACCEPTED");
        return rideRepository.save(ride);
    }

    public Ride startRide(Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        ride.setStatus("STARTED");
        ride.setStartedAt(LocalDateTime.now());
        return rideRepository.save(ride);
    }

    public Ride completeRide(Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        ride.setStatus("COMPLETED");
        ride.setCompletedAt(LocalDateTime.now());
        return rideRepository.save(ride);
    }

    public Ride rateRide(Long rideId, int rating, String comment) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        ride.setRating(rating);
        ride.setComment(comment);
        return rideRepository.save(ride);
    }

    // RIDE FETCHING

    public List<Ride> getRideHistory(String role, Long userId) {
        List<Ride> rides;
        if ("rider".equalsIgnoreCase(role))
            rides = rideRepository.findByRiderId(userId);
        else if ("driver".equalsIgnoreCase(role))
            rides = rideRepository.findByDriverId(userId);
        else
            throw new RuntimeException("Invalid role");

        rides.forEach(this::populateRideDetails);
        // Sort by BookedAt Descending (Most Recent First)
        rides.sort((r1, r2) -> {
            if (r1.getBookedAt() == null)
                return 1;
            if (r2.getBookedAt() == null)
                return -1;
            return r2.getBookedAt().compareTo(r1.getBookedAt());
        });

        return rides;
    }

    public Ride getActiveRide(String role, Long userId) {
        Ride ride = null;
        if ("rider".equalsIgnoreCase(role)) {
            ride = rideRepository.findFirstByRiderIdAndStatusIn(userId, List.of("PENDING", "ACCEPTED", "STARTED"))
                    .orElse(null);
        } else if ("driver".equalsIgnoreCase(role)) {
            ride = rideRepository.findFirstByDriverIdAndStatusIn(userId, List.of("ACCEPTED", "STARTED"))
                    .orElse(null);
        } else {
            throw new RuntimeException("Invalid role");
        }

        if (ride != null)
            populateRideDetails(ride);
        return ride;
    }

    // Helper to populate transient fields
    private void populateRideDetails(Ride ride) {
        if (ride.getDriverId() != null) {
            driverRepository.findById(ride.getDriverId()).ifPresent(ride::setDriver);
        }
        if (ride.getRiderId() != null) {
            userRepository.findById(ride.getRiderId()).ifPresent(ride::setRider);
        }
    }

    public List<Ride> getAvailableRides() {
        List<Ride> rides = rideRepository.findByStatus("PENDING");
        rides.forEach(this::populateRideDetails);
        return rides;
    }

    public List<Ride> searchRides(String query) {
        return rideRepository.findByPickupLocationContainingIgnoreCaseOrDropoffLocationContainingIgnoreCase(query,
                query);
    }

    public List<Ride> getAllRides() {
        return rideRepository.findAll();
    }

    public Optional<Ride> getRideById(Long id) {
        return rideRepository.findById(id);
    }

    public Ride saveRide(Ride ride) {
        return rideRepository.save(ride);
    }

    public void deleteRide(Long id) {
        rideRepository.deleteById(id);
    }

    // DRIVER AVAILABILITY

    public void setDriverAvailability(Long driverId, boolean available) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
        driver.setAvailable(available); // toggle on/off
        driverRepository.save(driver);
    }
}
