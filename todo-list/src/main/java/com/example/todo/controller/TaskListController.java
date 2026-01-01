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
        // Default lists
        taskLists.add(new TaskList(counter.incrementAndGet(), "Inbox", "#6c5ce7"));
        taskLists.add(new TaskList(counter.incrementAndGet(), "Work", "#0984e3"));
        taskLists.add(new TaskList(counter.incrementAndGet(), "Personal", "#00b894"));
    }

    @GetMapping
    public List<TaskList> getAllLists() {
        return taskLists;
    }

    @PostMapping
    public TaskList createList(@RequestBody TaskList list) {
        list.setId(counter.incrementAndGet());
        if (list.getColor() == null)
            list.setColor("#b2bec3");
        taskLists.add(list);
        return list;
    }

    @DeleteMapping("/{id}")
    public void deleteList(@PathVariable Long id) {
        // Prevent deleting default lists if needed, but keeping simple for now
        taskLists.removeIf(l -> l.getId().equals(id));
    }
}
