package com.example.backend.controller;

import com.example.backend.model.Driver;
import com.example.backend.model.Ride;
import com.example.backend.repository.DriverRepository;
import com.example.backend.service.RideService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/rides")
public class RideController {

    @Autowired
    private RideService rideService;

    @Autowired
    private DriverRepository driverRepository;

    // =========================
    // BOOK & LIFECYCLE
    // =========================

    @PostMapping("/book")
    public ResponseEntity<Ride> bookRide(@RequestBody Ride ride) {
        return ResponseEntity.ok(rideService.bookRide(ride));
    }

    @PostMapping("/cancel/{rideId}")
    public ResponseEntity<Ride> cancelRide(@PathVariable Long rideId) {
        return ResponseEntity.ok(rideService.cancelRide(rideId));
    }

    @PostMapping("/accept")
    public ResponseEntity<Ride> acceptRide(@RequestBody Map<String, Long> request) {
        Long rideId = request.get("rideId");
        Long driverId = request.get("driverId");
        return ResponseEntity.ok(rideService.acceptRide(rideId, driverId));
    }

    @PostMapping("/start/{rideId}")
    public ResponseEntity<Ride> startRide(@PathVariable Long rideId) {
        return ResponseEntity.ok(rideService.startRide(rideId));
    }

    @PostMapping("/complete/{rideId}")
    public ResponseEntity<Ride> completeRide(@PathVariable Long rideId) {
        return ResponseEntity.ok(rideService.completeRide(rideId));
    }

    // =========================
    // RATING
    // =========================

    @PostMapping("/rate")
    public ResponseEntity<Ride> rateRide(@RequestBody Map<String, Object> request) {
        Long rideId = Long.parseLong(request.get("rideId").toString());
        int rating = Integer.parseInt(request.get("rating").toString());
        String comment = (String) request.get("comment");

        return ResponseEntity.ok(rideService.rateRide(rideId, rating, comment));
    }

    // =========================
    // FETCHING RIDES
    // =========================

    @GetMapping("/{rideId}")
    public ResponseEntity<Ride> getRideDetails(@PathVariable Long rideId) {
        Optional<Ride> ride = rideService.getRideById(rideId);
        return ride.map(ResponseEntity::ok)
                   .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/history")
    public ResponseEntity<List<Ride>> getRideHistory(@RequestParam String role,
                                                     @RequestParam Long userId) {
        return ResponseEntity.ok(rideService.getRideHistory(role, userId));
    }

    @GetMapping("/active")
    public ResponseEntity<Ride> getActiveRide(@RequestParam String role,
                                              @RequestParam Long userId) {
        return ResponseEntity.ok(rideService.getActiveRide(role, userId));
    }

    @GetMapping("/available")
    public ResponseEntity<List<Ride>> getAvailableRides() {
        return ResponseEntity.ok(rideService.getAvailableRides());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Ride>> searchRides(@RequestParam String query) {
        return ResponseEntity.ok(rideService.searchRides(query));
    }

    // =========================
    // DRIVER AVAILABILITY
    // =========================

    @PostMapping("/drivers/{driverId}/availability")
    public ResponseEntity<Void> setDriverAvailability(@PathVariable Long driverId,
                                                      @RequestParam boolean available) {
        rideService.setDriverAvailability(driverId, available);
        return ResponseEntity.ok().build();
    }

   @GetMapping("/drivers/{driverId}")
public ResponseEntity<?> getDriver(@PathVariable Long driverId) {
    Optional<Driver> driverOpt = driverRepository.findById(driverId);
    if (driverOpt.isPresent()) {
        return ResponseEntity.ok(driverOpt.get());
    } else {
        return ResponseEntity.status(404).body(Map.of("message", "Driver not found"));
    }
}



    // ADMIN / DEBUG


    @GetMapping
    public ResponseEntity<List<Ride>> getAllRides() {
        return ResponseEntity.ok(rideService.getAllRides());
    }

    @PostMapping
    public ResponseEntity<Ride> createRide(@RequestBody Ride ride) {
        return ResponseEntity.ok(rideService.saveRide(ride));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRide(@PathVariable Long id) {
        rideService.deleteRide(id);
        return ResponseEntity.noContent().build();
    }
}
