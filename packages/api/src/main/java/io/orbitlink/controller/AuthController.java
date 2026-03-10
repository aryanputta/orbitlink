package io.orbitlink.controller;

import io.orbitlink.model.User;
import io.orbitlink.repository.UserRepository;
import io.orbitlink.security.JwtProvider;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    public AuthController(UserRepository userRepo, PasswordEncoder passwordEncoder,
            JwtProvider jwtProvider) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
    }

    record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8) String password,
            String role) {
    }

    record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepo.existsByEmail(req.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email already registered"));
        }

        User user = new User();
        user.setEmail(req.email());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setRole(req.role() != null ? User.Role.valueOf(req.role().toUpperCase()) : User.Role.OPERATOR);
        userRepo.save(user);

        String token = jwtProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "user", Map.of("id", user.getId(), "email", user.getEmail(), "role", user.getRole()),
                "token", token));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        return userRepo.findByEmail(req.email())
                .filter(user -> passwordEncoder.matches(req.password(), user.getPasswordHash()))
                .map(user -> {
                    String token = jwtProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());
                    return ResponseEntity.ok(Map.of(
                            "user", Map.of("id", user.getId(), "email", user.getEmail(), "role", user.getRole()),
                            "token", token));
                })
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid credentials")));
    }
}
