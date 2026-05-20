package com.autotest.autotest_backend.model;

import lombok.Data;
import java.util.List;

@Data
public class TestRequest {
    private String url;
    private String userId;
    private String username;        // ← login credential
    private String password;        // ← login credential
    private List<String> categories; // ← selected test categories
    private String testMode;         // ← "quick" or "custom"
    private String customInstruction; // ← plain English test description
}