package com.example.todo.model;

public class Habit {
    private Long id;
    private String name;
    private int streak;
    private Long userId;
    private String lastCompletedDate; // YYYY-MM-DD
    private boolean isCommon;

    public Habit() {
        this.streak = 0;
        this.isCommon = false;
    }

    public Habit(Long id, String name, int streak, Long userId, boolean isCommon) {
        this.id = id;
        this.name = name;
        this.streak = streak;
        this.userId = userId;
        this.isCommon = isCommon;
    }

    // Existing getters/setters...

    public boolean isCommon() {
        return isCommon;
    }

    public void setCommon(boolean common) {
        isCommon = common;
    }

    public Long getId() {
        return id;
    }
    // ... rest of getters/setters

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getStreak() {
        return streak;
    }

    public void setStreak(int streak) {
        this.streak = streak;
    }

    public void incrementStreak() {
        this.streak++;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getLastCompletedDate() {
        return lastCompletedDate;
    }

    public void setLastCompletedDate(String lastCompletedDate) {
        this.lastCompletedDate = lastCompletedDate;
    }
}
