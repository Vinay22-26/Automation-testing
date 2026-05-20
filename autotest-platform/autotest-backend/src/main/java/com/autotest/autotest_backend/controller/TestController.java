package com.autotest.autotest_backend.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin; // Added
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.autotest.autotest_backend.model.TestRequest;
import com.autotest.autotest_backend.service.TestOrchestrationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200") // Required for Angular communication
public class TestController {

    private final TestOrchestrationService orchestrationService;

    @PostMapping("/test")
    public ResponseEntity<?> startTest(@RequestBody TestRequest request) {
        // Validation (Optional but recommended)
        if (request.getUrl() == null || request.getUrl().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "URL is required"));
        }

        String jobId = UUID.randomUUID().toString();
        
        // Start the async process
        orchestrationService.startTest(
            jobId,
            request.getUrl(),
            request.getUserId(),
            request.getUsername(),
            request.getPassword(),
            request.getCategories(),
            request.getCustomInstruction()
        );

        return ResponseEntity.ok(Map.of(
            "jobId", jobId,
            "status", "started",
            "message", "Test started. Connect to WebSocket for live updates."
        ));
    }
}