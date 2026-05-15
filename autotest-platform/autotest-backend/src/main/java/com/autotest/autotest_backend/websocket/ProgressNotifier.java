package com.autotest.autotest_backend.websocket;

import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ProgressNotifier {

    private final SimpMessagingTemplate messagingTemplate;

    // Sends a progress message to Angular — Angular listens on /topic/progress/{jobId}
    public void sendProgress(String jobId, String message) {
        messagingTemplate.convertAndSend(
            "/topic/progress/" + jobId,
            Map.of("jobId", jobId, "message", message, "time", System.currentTimeMillis())
        );
    }

    // Sends the final completed report to Angular
    public void sendCompleted(String jobId, Object report) {
        messagingTemplate.convertAndSend(
            "/topic/completed/" + jobId,
            Map.of("jobId", jobId, "report", report)
        );
    }
}
