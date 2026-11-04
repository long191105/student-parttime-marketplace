package com.example.demo.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public HealthResponse health() {
        Integer databaseCheck = jdbcTemplate.queryForObject("select 1", Integer.class);
        return new HealthResponse("UP", databaseCheck != null && databaseCheck == 1 ? "UP" : "DOWN");
    }

    public record HealthResponse(String status, String database) {
    }
}
