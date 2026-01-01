package com.example.todo.controller;

import com.example.todo.model.Todo;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/todos")
@CrossOrigin(origins = "*") // Allow frontend to access
public class TodoController {

    private final List<Todo> todos = new ArrayList<>();
    private final AtomicLong counter = new AtomicLong();

    @GetMapping
    public List<Todo> getAllTodos(@RequestParam(required = false) Long userId) {
        if (userId != null) {
            return todos.stream().filter(t -> userId.equals(t.getUserId())).toList();
        }
        return todos;
    }

    @PostMapping
    public Todo createTodo(@RequestBody Todo todo) {
        todo.setId(counter.incrementAndGet());
        todos.add(todo);
        return todo;
    }

    @DeleteMapping("/{id}")
    public void deleteTodo(@PathVariable Long id) {
        todos.removeIf(todo -> todo.getId().equals(id));
    }

    @PutMapping("/{id}")
    public Todo updateTodo(@PathVariable Long id, @RequestBody Todo updatedTodo) {
        Todo todo = todos.stream()
                .filter(t -> t.getId().equals(id))
                .findFirst()
                .orElse(null);

        if (todo != null) {
            todo.setCompleted(updatedTodo.isCompleted());
            todo.setTask(updatedTodo.getTask());
            todo.setPriority(updatedTodo.getPriority());
            todo.setDueDate(updatedTodo.getDueDate());
            todo.setDescription(updatedTodo.getDescription());
            todo.setTaskListId(updatedTodo.getTaskListId());
            todo.setTimeSpent(updatedTodo.getTimeSpent());
        }
        return todo;
    }
}
