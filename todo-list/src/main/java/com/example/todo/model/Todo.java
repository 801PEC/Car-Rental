package com.example.todo.model;

public class Todo {
    private Long id;
    private String task;
    private boolean completed;
    private Priority priority;
    private String dueDate; // Stores YYYY-MM-DD
    private Long taskListId;
    private String description;
    private Long userId;
    private long timeSpent; // in seconds

    public Todo() {
    }

    public Todo(Long id, String task, Priority priority, String dueDate, Long taskListId, String description,
            Long userId, long timeSpent) {
        this.id = id;
        this.task = task;
        this.priority = priority;
        this.dueDate = dueDate;
        this.taskListId = taskListId;
        this.description = description;
        this.userId = userId;
        this.timeSpent = timeSpent;
    }

    public Todo(Long id, String task) {
        this.id = id;
        this.task = task;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTask() {
        return task;
    }

    public void setTask(String task) {
        this.task = task;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public Long getTaskListId() {
        return taskListId;
    }

    public void setTaskListId(Long taskListId) {
        this.taskListId = taskListId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public long getTimeSpent() {
        return timeSpent;
    }

    public void setTimeSpent(long timeSpent) {
        this.timeSpent = timeSpent;
    }
}
