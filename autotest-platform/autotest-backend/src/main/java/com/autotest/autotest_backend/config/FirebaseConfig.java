package com.autotest.autotest_backend.config;

import java.io.InputStream;

import org.springframework.context.annotation.Configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initFirebase() {
        try {
            // Load the key file from resources folder
            InputStream serviceAccount =
                getClass().getClassLoader()
                    .getResourceAsStream("serviceAccountKey.json");

            if (serviceAccount == null) {
                log.error("serviceAccountKey.json not found in resources!");
                return;
            }

            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

            // Only initialize once
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                log.info("Firebase initialized successfully");
            }

        } catch (Exception e) {
            log.error("Firebase initialization failed: {}", e.getMessage());
        }
    }
}
