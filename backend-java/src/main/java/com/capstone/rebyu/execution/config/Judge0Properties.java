package com.capstone.rebyu.execution.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "judge0")
public class Judge0Properties {

    private boolean enabled = true;

    private String baseUrl = "https://ce.judge0.com";

    private String apiKey = "";

    private String apiKeyHeader = "X-RapidAPI-Key";

    private int connectTimeoutMs = 5000;

    private int readTimeoutMs = 20000;

    private int cpuTimeLimitSeconds = 5;

    private int memoryLimitKb = 128000;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getApiKeyHeader() {
        return apiKeyHeader;
    }

    public void setApiKeyHeader(String apiKeyHeader) {
        this.apiKeyHeader = apiKeyHeader;
    }

    public int getConnectTimeoutMs() {
        return connectTimeoutMs;
    }

    public void setConnectTimeoutMs(int connectTimeoutMs) {
        this.connectTimeoutMs = connectTimeoutMs;
    }

    public int getReadTimeoutMs() {
        return readTimeoutMs;
    }

    public void setReadTimeoutMs(int readTimeoutMs) {
        this.readTimeoutMs = readTimeoutMs;
    }

    public int getCpuTimeLimitSeconds() {
        return cpuTimeLimitSeconds;
    }

    public void setCpuTimeLimitSeconds(int cpuTimeLimitSeconds) {
        this.cpuTimeLimitSeconds = cpuTimeLimitSeconds;
    }

    public int getMemoryLimitKb() {
        return memoryLimitKb;
    }

    public void setMemoryLimitKb(int memoryLimitKb) {
        this.memoryLimitKb = memoryLimitKb;
    }
}
