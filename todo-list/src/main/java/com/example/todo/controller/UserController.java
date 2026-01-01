package com.example.todo.controller;

import com.example.todo.model.User;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private static final List<User> users = new ArrayList<>();
    private final AtomicLong counter = new AtomicLong();

    @PostMapping("/register")
    public User register(@RequestBody User user) {
        // Simple check if user exists
        boolean exists = users.stream().anyMatch(u -> u.getUsername().equalsIgnoreCase(user.getUsername()));
        if (exists) {
            throw new RuntimeException("User already exists");
        }

        user.setId(counter.incrementAndGet());
        user.setTotalScore(0);
        users.add(user);
        return user;
    }

    @PostMapping("/login")
    public User login(@RequestBody User loginRequest) {
        return users.stream()
                .filter(u -> u.getUsername().equals(loginRequest.getUsername()) &&
                        u.getPassword().equals(loginRequest.getPassword()))
                .findFirst()
                .orElse(null);
    }

    @GetMapping("/verify/{id}")
    public boolean verifySession(@PathVariable Long id) {
        return users.stream().anyMatch(u -> u.getId().equals(id));
    }

    // Helper to get user by ID (for other controllers)
    public static User getUserById(Long id) {
        return users.stream().filter(u -> u.getId().equals(id)).findFirst().orElse(null);
    }

    // Helper to get all users (for leaderboards)
    public static List<User> getAllUsers() {
        return new ArrayList<>(users);
    }
}
