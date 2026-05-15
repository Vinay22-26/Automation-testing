package com.autotest.autotest_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class AutotestBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(AutotestBackendApplication.class, args);
    }
}