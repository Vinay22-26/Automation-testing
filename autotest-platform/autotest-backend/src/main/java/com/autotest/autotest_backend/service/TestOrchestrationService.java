package com.autotest.autotest_backend.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.autotest.autotest_backend.websocket.ProgressNotifier;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class TestOrchestrationService {

    private final ProgressNotifier progressNotifier;
    private final FirebaseService firebaseService;

    // Playwright microservice base URL
    private final WebClient playwrightClient = WebClient.create("http://localhost:4000");

    // Runs in background thread — doesn't block Spring
   @Async
public void startTest(String jobId, String url, String userId,
                      String username, String password,
                      List<String> categories, String customInstruction) {
    try {
        progressNotifier.sendProgress(jobId, "Sending URL to testing engine...");

        Map<String, Object> payload = new HashMap<>();
        payload.put("url", url);
        if (username != null && !username.isEmpty()) payload.put("username", username);
        if (password != null && !password.isEmpty()) payload.put("password", password);
        if (categories != null) payload.put("categories", categories);
        if (customInstruction != null) payload.put("customInstruction", customInstruction);

        Map response = playwrightClient.post()
            .uri("/test")
            .bodyValue(payload)
            .retrieve()
            .bodyToMono(Map.class)
            .block();

        String playwrightJobId = (String) response.get("jobId");
        progressNotifier.sendProgress(jobId, "Engine started. Job ID: " + playwrightJobId);
        pollForResults(jobId, playwrightJobId, url, userId);

    } catch (Exception e) {
        progressNotifier.sendProgress(jobId, "ERROR: " + e.getMessage());
    }
}

    private void pollForResults(String jobId, String playwrightJobId, String url, String userId) throws InterruptedException {
        int maxAttempts = 60; // max 3 minutes (60 x 3s)
        int attempt = 0;
        int lastProgressSize = 0;

        while (attempt < maxAttempts) {
            Thread.sleep(3000); // Wait 3 seconds between polls

            Map result = playwrightClient.get()
                .uri("/test/" + playwrightJobId)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            String status = (String) result.get("status");

            // Forward new progress messages to Angular
            var progressList = (java.util.List) result.get("progress");
            if (progressList != null && progressList.size() > lastProgressSize) {
                for (int i = lastProgressSize; i < progressList.size(); i++) {
                    var logEntry = (Map) progressList.get(i);
                    progressNotifier.sendProgress(jobId, (String) logEntry.get("message"));
                }
                lastProgressSize = progressList.size();
            }

            if ("completed".equals(status)) {
                Object finalResult = result.get("result");
                // Save to Firebase
                firebaseService.saveReport(jobId, url, userId, finalResult);
                // Send completed report to Angular
                progressNotifier.sendCompleted(jobId, finalResult);
                return;
            }

            if ("failed".equals(status)) {
                progressNotifier.sendProgress(jobId, "Testing engine reported a failure.");
                return;
            }

            attempt++;
        }

        progressNotifier.sendProgress(jobId, "Test timed out after 3 minutes.");
    }
}
