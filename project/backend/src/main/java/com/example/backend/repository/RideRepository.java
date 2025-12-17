package com.example.backend.repository;

import com.example.backend.model.Ride;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RideRepository extends JpaRepository<Ride, Long> {

    // Ride history for rider
    List<Ride> findByRiderId(Long riderId);

    // Ride history for driver
    List<Ride> findByDriverId(Long driverId);

    // Active ride for rider
    Optional<Ride> findFirstByRiderIdAndStatusIn(Long riderId, List<String> statuses);

    // Active ride for driver
    Optional<Ride> findFirstByDriverIdAndStatusIn(Long driverId, List<String> statuses);

    // List of available (pending) rides for driver to pick
    List<Ride> findByStatus(String status);

    List<Ride> findByPickupLocationContainingIgnoreCaseOrDropoffLocationContainingIgnoreCase(String pickupLocation, String dropoffLocation);

    // Additional query methods can be defined here
}
