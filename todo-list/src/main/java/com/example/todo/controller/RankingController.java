package com.example.todo.controller;

import com.example.todo.model.ScoreEvent;
import com.example.todo.model.User;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rankings")
@CrossOrigin(origins = "*")
public class RankingController {

    // In-memory storage for score events
    public static final List<ScoreEvent> scoreEvents = new ArrayList<>();
    private static final AtomicLong counter = new AtomicLong();

    // Helper to add event
    public static void addEvent(Long userId, Long habitId, int points, boolean isReset) {
        if (isReset) {
            // Invalidate all previous events for this habit if streak is broken
            scoreEvents.stream()
                    .filter(e -> e.getHabitId().equals(habitId) && e.getUserId().equals(userId))
                    .forEach(e -> e.setValid(false));
        }

        ScoreEvent event = new ScoreEvent(counter.incrementAndGet(), userId, habitId, points);
        scoreEvents.add(event);
    }

    @GetMapping("/habit/{habitName}")
    public List<UserRank> getHabitRankings(@PathVariable String habitName,
            @RequestParam(defaultValue = "all") String timeframe) {
        List<Long> targetHabitIds = HabitController.getHabitIdsByName(habitName);
        LocalDate now = LocalDate.now();

        // Filter events for this habit name
        List<ScoreEvent> validEvents = scoreEvents.stream()
                .filter(ScoreEvent::isValid)
                .filter(e -> targetHabitIds.contains(e.getHabitId()))
                .filter(e -> {
                    LocalDate eventDate = e.getTimestamp().toLocalDate();
                    switch (timeframe.toLowerCase()) {
                        case "day":
                            return eventDate.isEqual(now);
                        case "week":
                            return eventDate.isAfter(now.minusDays(7));
                        case "month":
                            return eventDate.isAfter(now.minusDays(30));
                        default:
                            return true;
                    }
                })
                .toList();

        // Group by User and Sum Points
        Map<Long, Integer> userScores = validEvents.stream()
                .collect(Collectors.groupingBy(ScoreEvent::getUserId, Collectors.summingInt(ScoreEvent::getPoints)));

        return userScores.entrySet().stream()
                .map(entry -> {
                    User user = UserController.getUserById(entry.getKey());
                    String username = (user != null) ? user.getUsername() : "Unknown";
                    return new UserRank(username, entry.getValue());
                })
                .sorted((a, b) -> b.getScore() - a.getScore())
                .collect(Collectors.toList());
    }

    @GetMapping("/{timeframe}")
    public List<UserRank> getRankings(@PathVariable String timeframe) {
        LocalDate now = LocalDate.now();

        // Filter valid events based on timeframe
        List<ScoreEvent> validEvents = scoreEvents.stream()
                .filter(ScoreEvent::isValid)
                .filter(e -> {
                    LocalDate eventDate = e.getTimestamp().toLocalDate();
                    switch (timeframe.toLowerCase()) {
                        case "day":
                            return eventDate.isEqual(now);
                        case "week":
                            return eventDate.isAfter(now.minusDays(7));
                        case "month":
                            return eventDate.isAfter(now.minusDays(30));
                        case "all":
                            return true;
                        default:
                            return true;
                    }
                })
                .toList();

        // Group by User and Sum Points
        Map<Long, Integer> userScores = validEvents.stream()
                .collect(Collectors.groupingBy(ScoreEvent::getUserId, Collectors.summingInt(ScoreEvent::getPoints)));

        // Map to UserRank objects
        return userScores.entrySet().stream()
                .map(entry -> {
                    User user = UserController.getUserById(entry.getKey());
                    String username = (user != null) ? user.getUsername() : "Unknown";
                    return new UserRank(username, entry.getValue());
                })
                .sorted((a, b) -> b.getScore() - a.getScore()) // Descending sort
                .collect(Collectors.toList());
    }

    // DTO for Ranking
    public static class UserRank {
        private String username;
        private int score;

        public UserRank(String username, int score) {
            this.username = username;
            this.score = score;
        }

        public String getUsername() {
            return username;
        }

        public int getScore() {
            return score;
        }
    }
}
