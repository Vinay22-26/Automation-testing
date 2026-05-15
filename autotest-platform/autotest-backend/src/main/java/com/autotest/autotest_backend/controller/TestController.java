package com.autotest.autotest_backend.controller;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
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
public class TestController {

    private final TestOrchestrationService orchestrationService;

    @PostMapping("/test")
    public ResponseEntity<?> startTest(@RequestBody TestRequest request) {
        String jobId = UUID.randomUUID().toString();

        // Fire and forget — runs in background, streams via WebSocket
        orchestrationService.startTest(jobId, request.getUrl(), request.getUserId());

        return ResponseEntity.ok(Map.of(
            "jobId", jobId,
            "status", "started",
            "message", "Test started. Connect to WebSocket for live updates."
        ));
    }
}
