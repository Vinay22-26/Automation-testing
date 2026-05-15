package com.autotest.autotest_backend.model;

import lombok.Data;

@Data
public class TestRequest {
    private String url;
    private String userId; // Firebase user ID (for saving history)
}
