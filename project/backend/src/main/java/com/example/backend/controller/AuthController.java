package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.model.Driver;
import com.example.backend.model.PasswordResetToken;
import com.example.backend.model.OtpToken;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.DriverRepository;
import com.example.backend.repository.PasswordResetTokenRepository;
import com.example.backend.repository.OtpTokenRepository;
import com.example.backend.service.OtpService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private OtpTokenRepository otpTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private OtpService otpService;

    // Simple in-memory token storage for demo purposes
    private static final Map<String, String> tokenStore = new java.util.concurrent.ConcurrentHashMap<>();

    // ================= LOGIN =================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Optional<User> userOptional = userRepository.findByEmail(loginRequest.getEmail());

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        User user = userOptional.get();

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        String otp = otpService.generateOtp();
        otpService.sendOtp(user.getEmail(), otp);

        Optional<OtpToken> existingOtp = otpTokenRepository.findByUserEmail(user.getEmail());
        OtpToken otpToken = existingOtp.orElse(
                new OtpToken(user, otp, LocalDateTime.now().plusMinutes(5))
        );

        otpToken.setOtp(otp);
        otpToken.setExpiryDate(LocalDateTime.now().plusMinutes(5));
        otpTokenRepository.save(otpToken);

        return ResponseEntity.ok(Map.of("requiresTwoFactor", true));
    }

    static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    // ================= 2FA VERIFY =================
    @PostMapping("/2fa/verify")
    public ResponseEntity<?> verifyTwoFactor(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("code");

        Optional<OtpToken> otpTokenOpt = otpTokenRepository.findByUserEmail(email);
        if (otpTokenOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("OTP not found");
        }

        OtpToken otpToken = otpTokenOpt.get();
        if (!otpToken.getOtp().equals(otp) || otpToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired OTP");
        }

        User user = otpToken.getUser();
        String token = generateTokenForUser(user);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", user);

        // 🔥 CRITICAL FIX: attach DRIVER info
        if (user.getRole() == User.Role.DRIVER) {
            driverRepository.findByPhone(user.getPhone())
                    .ifPresent(driver -> response.put("driver", driver));
        }

        return ResponseEntity.ok(response);
    }

    private String generateTokenForUser(User user) {
        String token = UUID.randomUUID().toString();
        tokenStore.put(token, user.getEmail());
        return token;
    }

    // ================= DRIVER PROFILE =================
    @GetMapping("/driver-profile/{email}")
    public ResponseEntity<?> getDriverProfile(@PathVariable String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        if (user.getRole() != User.Role.DRIVER) {
            return ResponseEntity.badRequest().body("User is not a driver");
        }

        return driverRepository.findByPhone(user.getPhone())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ================= ME =================
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid token");
        }
        
        String token = authHeader.substring(7);
        String email = tokenStore.get(token);
        
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
        }

        User user = userOpt.get();
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("phone", user.getPhone());
        
        if (user.getRole() == User.Role.DRIVER) {
            driverRepository.findByPhone(user.getPhone())
                    .ifPresent(driver -> response.put("driver", driver));
        }
        
        return ResponseEntity.ok(response);
    }

    // ================= RESET PASSWORD =================
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        
        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findByToken(token);
        
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid token");
        }
        
        PasswordResetToken resetToken = tokenOpt.get();
        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Token expired");
        }
        
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        // Clean up token
        passwordResetTokenRepository.delete(resetToken);
        
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    // ================= REGISTER =================
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String name = request.get("name");
        String phone = request.get("phone");
        String role = request.get("role");

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("User already exists");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setName(name);
        user.setPhone(phone);
        user.setRole(User.Role.valueOf(role));
        userRepository.save(user);

        if ("DRIVER".equalsIgnoreCase(role)) {
            Driver driver = new Driver();
            driver.setName(name);
            driver.setPhone(phone);
            driver.setAvailable(false);
            driverRepository.save(driver);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "user", user,
                    "driver", driver
            ));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    // ================= PASSWORD RESET =================
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        User user = userOpt.get();
        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByUserId(user.getId())
                .orElse(new PasswordResetToken());

        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(LocalDateTime.now().plusHours(1));
        passwordResetTokenRepository.save(resetToken);

        sendResetEmail(email, token);
        return ResponseEntity.ok("Password reset email sent");
    }

    private void sendResetEmail(String email, String token) {
        String resetLink = "http://localhost:3000/reset-password?token=" + token;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Password Reset");
        message.setText(resetLink);
        mailSender.send(message);
    }
}
