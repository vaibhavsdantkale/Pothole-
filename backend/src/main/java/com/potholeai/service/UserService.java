package com.potholeai.service;

import com.potholeai.dto.AuthResponse;
import com.potholeai.dto.LoginRequest;
import com.potholeai.dto.RegisterRequest;
import com.potholeai.entity.Role;
import com.potholeai.entity.User;
import com.potholeai.repository.UserRepository;
import com.potholeai.util.JwtUtil;
import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostConstruct
    public void seedInitialUsers() {
        // Create Default Admin if not exists
        if (!userRepository.existsByEmail("admin@potholeai.com")) {
            User admin = new User(
                    "System Administrator",
                    "admin@potholeai.com",
                    passwordEncoder.encode("admin123"),
                    Role.ROLE_ADMIN
            );
            userRepository.save(admin);
            System.out.println("[UserService] Seeded default admin account: admin@potholeai.com / admin123");
        }

        // Create Default Citizen User if not exists
        if (!userRepository.existsByEmail("user@potholeai.com")) {
            User citizen = new User(
                    "Citizen User",
                    "user@potholeai.com",
                    passwordEncoder.encode("user123"),
                    Role.ROLE_USER
            );
            userRepository.save(citizen);
            System.out.println("[UserService] Seeded default citizen account: user@potholeai.com / user123");
        }
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() != null ? request.getRole() : Role.ROLE_USER);

        User savedUser = userRepository.save(user);

        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole(), savedUser.getName());

        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole(),
                "Registration successful."
        );
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isEmpty() || !passwordEncoder.matches(request.getPassword(), optionalUser.get().getPassword())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        User user = optionalUser.get();
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole(), user.getName());

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                "Login successful."
        );
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
