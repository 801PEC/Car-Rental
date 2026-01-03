package com.example.todo.controller;

import com.example.todo.model.TaskList;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/lists")
@CrossOrigin(origins = "*")
public class TaskListController {

    private final List<TaskList> taskLists = new ArrayList<>();
    private final AtomicLong counter = new AtomicLong();

    public TaskListController() {
        // No global seeding anymore
    }

    @GetMapping
    public List<TaskList> getAllLists(@RequestParam(required = false) Long userId) {
        if (userId == null)
            return new ArrayList<>();

        List<TaskList> userLists = taskLists.stream()
                .filter(l -> userId.equals(l.getUserId()))
                .toList();

        if (userLists.isEmpty()) {
            seedListsForUser(userId);
            return taskLists.stream()
                    .filter(l -> userId.equals(l.getUserId()))
                    .toList();
        }
        return userLists;
    }

    private void seedListsForUser(Long userId) {
        taskLists.add(new TaskList(counter.incrementAndGet(), "Inbox", "#6c5ce7", userId));
        taskLists.add(new TaskList(counter.incrementAndGet(), "Work", "#0984e3", userId));
        taskLists.add(new TaskList(counter.incrementAndGet(), "Personal", "#00b894", userId));
    }

    @PostMapping
    public TaskList createList(@RequestBody TaskList list) {
        list.setId(counter.incrementAndGet());
        if (list.getColor() == null)
            list.setColor("#b2bec3");
        // UserId should be passed in request body
        taskLists.add(list);
        return list;
    }

    @DeleteMapping("/{id}")
    public void deleteList(@PathVariable Long id) {
        taskLists.removeIf(l -> l.getId().equals(id));
    }
}
