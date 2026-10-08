package com.capstone.rebyu.bkt.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "bkt")
public class BktProperties {

    private boolean enabled = true;

    private String serviceUrl = "http://localhost:8000/api/v1/bkt";

    private String apiKey = "";

    private int connectTimeoutMs = 2000;
    private int readTimeoutMs = 5000;

    private int dispatchBatchSize = 100;

    private int maxRetries = 8;

    private int retryInitialDelaySeconds = 15;
    private int retryMaxDelaySeconds = 3600;

    private int reconciliationBatchSize = 200;

    private double partialCreditCorrectThreshold = 0.60;

    private String fallbackAssessmentType = "LESSON_QUIZ";

    private String fallbackDifficulty = "AVERAGE";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getServiceUrl() {
        return serviceUrl;
    }

    public void setServiceUrl(String serviceUrl) {
        this.serviceUrl = serviceUrl;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
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

    public int getDispatchBatchSize() {
        return dispatchBatchSize;
    }

    public void setDispatchBatchSize(int dispatchBatchSize) {
        this.dispatchBatchSize = dispatchBatchSize;
    }

    public int getMaxRetries() {
        return maxRetries;
    }

    public void setMaxRetries(int maxRetries) {
        this.maxRetries = maxRetries;
    }

    public int getRetryInitialDelaySeconds() {
        return retryInitialDelaySeconds;
    }

    public void setRetryInitialDelaySeconds(int retryInitialDelaySeconds) {
        this.retryInitialDelaySeconds = retryInitialDelaySeconds;
    }

    public int getRetryMaxDelaySeconds() {
        return retryMaxDelaySeconds;
    }

    public void setRetryMaxDelaySeconds(int retryMaxDelaySeconds) {
        this.retryMaxDelaySeconds = retryMaxDelaySeconds;
    }

    public int getReconciliationBatchSize() {
        return reconciliationBatchSize;
    }

    public void setReconciliationBatchSize(int reconciliationBatchSize) {
        this.reconciliationBatchSize = reconciliationBatchSize;
    }

    public double getPartialCreditCorrectThreshold() {
        return partialCreditCorrectThreshold;
    }

    public void setPartialCreditCorrectThreshold(double partialCreditCorrectThreshold) {
        this.partialCreditCorrectThreshold = partialCreditCorrectThreshold;
    }

    public String getFallbackAssessmentType() {
        return fallbackAssessmentType;
    }

    public void setFallbackAssessmentType(String fallbackAssessmentType) {
        this.fallbackAssessmentType = fallbackAssessmentType;
    }

    public String getFallbackDifficulty() {
        return fallbackDifficulty;
    }

    public void setFallbackDifficulty(String fallbackDifficulty) {
        this.fallbackDifficulty = fallbackDifficulty;
    }
}
