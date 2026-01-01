package com.example.todo.controller;

import com.example.todo.model.Habit;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/habits")
@CrossOrigin(origins = "*")
public class HabitController {

    private static final List<Habit> habits = new ArrayList<>();
    private static final AtomicLong counter = new AtomicLong();

    public static List<Long> getHabitIdsByName(String name) {
        return habits.stream()
                .filter(h -> h.getName().equalsIgnoreCase(name))
                .map(Habit::getId)
                .toList();
    }

    public HabitController() {
        // No global seeding here. We seed per user in getAllHabits.
    }

    @GetMapping
    public List<Habit> getAllHabits(@RequestParam(required = false) Long userId) {
        if (userId != null) {
            List<Habit> userHabits = habits.stream()
                    .filter(h -> userId.equals(h.getUserId()))
                    .toList();

            // Lazy Seeding: If user has NO habits, give them the defaults
            if (userHabits.isEmpty()) {
                seedHabitsForUser(userId);
                // Re-fetch
                return habits.stream()
                        .filter(h -> userId.equals(h.getUserId()))
                        .toList();
            }
            return userHabits;
        }
        return habits;
    }

    private void seedHabitsForUser(Long userId) {
        habits.add(new Habit(counter.incrementAndGet(), "Drink Water 💧", 0, userId, true));
        habits.add(new Habit(counter.incrementAndGet(), "Read 30 mins 📖", 0, userId, true));
        habits.add(new Habit(counter.incrementAndGet(), "Exercise 🏋️", 0, userId, true));
    }

    @PostMapping
    public Habit createHabit(@RequestBody Habit habit) {
        habit.setId(counter.incrementAndGet());
        // Default custom habits to NOT common
        habit.setCommon(false);
        if (habit.getStreak() < 0)
            habit.setStreak(0);
        habits.add(habit);
        return habit;
    }

    @PutMapping("/{id}/increment")
    public Habit incrementStreak(@PathVariable Long id, @RequestParam(required = false) boolean debug) {
        Habit habit = habits.stream()
                .filter(h -> h.getId().equals(id))
                .findFirst()
                .orElse(null);

        if (habit != null) {
            String today = java.time.LocalDate.now().toString();
            String lastDate = habit.getLastCompletedDate();

            if (!debug && lastDate != null && lastDate.equals(today)) {
                // Already completed today, do nothing
                return habit;
            }

            // Streak Logic
            boolean isStreakContinued = false;
            if (lastDate != null) {
                java.time.LocalDate last = java.time.LocalDate.parse(lastDate);
                java.time.LocalDate current = java.time.LocalDate.now();
                if (last.plusDays(1).isEqual(current) || (debug && last.isEqual(current))) {
                    isStreakContinued = true;
                }
            }

            // Update Streak
            if (isStreakContinued) {
                habit.incrementStreak();
            } else {
                habit.setStreak(1);
                // Only reset if it was a common habit (though reset logic is for score
                // integrity,
                // if it's not common, score doesn't matter much contextually, but streak does).
                // Actually, let's keep streak logic generic, but SCORING specific.
            }

            habit.setLastCompletedDate(today);

            // SCORING: Only for Common Habits
            if (habit.isCommon()) {
                int points = isStreakContinued ? 11 : 10;
                boolean isReset = !isStreakContinued;
                // Only "reset" the score history if the streak broke

                RankingController.addEvent(habit.getUserId(), habit.getId(), points, isReset);
            }
        }
        return habit;
    }

    @DeleteMapping("/{id}")
    public void deleteHabit(@PathVariable Long id) {
        habits.removeIf(h -> h.getId().equals(id));
    }
}
