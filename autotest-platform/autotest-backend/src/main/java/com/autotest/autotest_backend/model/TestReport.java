package com.autotest.autotest_backend.model;

import java.util.List;
import java.util.Map;

import lombok.Data;

@Data
public class TestReport {
    private String jobId;
    private String status;        // queued / running / completed / failed
    private List<ProgressLog> progress;
    private ReportResult result;

    @Data
    public static class ProgressLog {
        private String time;
        private String message;
    }

    @Data
    public static class ReportResult {
        private Map<String, Object> meta;
        private Map<String, Object> summary;
        private List<Map<String, Object>> keyFindings;
        private List<Map<String, Object>> allResults;
    }
}