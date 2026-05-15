package com.autotest.autotest_backend.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class FirebaseService {

    public void saveReport(String jobId, String url, String userId, Object result) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            Map<String, Object> report = new HashMap<>();
            report.put("jobId", jobId);
            report.put("url", url);
            report.put("userId", userId != null ? userId : "anonymous");
            report.put("result", result);
            report.put("createdAt", System.currentTimeMillis());

            db.collection("test-reports").document(jobId).set(report);
            log.info("Report saved to Firebase: {}", jobId);
        } catch (Exception e) {
            log.error("Failed to save report to Firebase: {}", e.getMessage());
        }
    }
}
