package com.example.todo.model;

import java.time.LocalDateTime;

public class ScoreEvent {
    private Long id;
    private Long userId;
    private Long habitId;
    private int points; // Points earned in this event
    private LocalDateTime timestamp;
    private boolean valid; // For high-stakes reset logic

    public ScoreEvent() {
    }

    public ScoreEvent(Long id, Long userId, Long habitId, int points) {
        this.id = id;
        this.userId = userId;
        this.habitId = habitId;
        this.points = points;
        this.timestamp = LocalDateTime.now();
        this.valid = true;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getHabitId() {
        return habitId;
    }

    public void setHabitId(Long habitId) {
        this.habitId = habitId;
    }

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }
}
