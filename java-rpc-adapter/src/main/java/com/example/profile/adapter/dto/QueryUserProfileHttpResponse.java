package com.example.profile.adapter.dto;

import java.util.LinkedHashMap;
import java.util.Map;

public class QueryUserProfileHttpResponse {

    private boolean ok;
    private String source;
    private Map<String, Object> request;
    private Map<String, Object> data;
    private String message;

    public static QueryUserProfileHttpResponse success(
            String source,
            Map<String, Object> request,
            Map<String, Object> data
    ) {
        QueryUserProfileHttpResponse response = new QueryUserProfileHttpResponse();
        response.ok = true;
        response.source = source;
        response.request = request;
        response.data = data;
        return response;
    }

    public static QueryUserProfileHttpResponse failure(String message) {
        QueryUserProfileHttpResponse response = new QueryUserProfileHttpResponse();
        response.ok = false;
        response.message = message;
        response.data = new LinkedHashMap<>();
        return response;
    }

    public boolean isOk() {
        return ok;
    }

    public void setOk(boolean ok) {
        this.ok = ok;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public Map<String, Object> getRequest() {
        return request;
    }

    public void setRequest(Map<String, Object> request) {
        this.request = request;
    }

    public Map<String, Object> getData() {
        return data;
    }

    public void setData(Map<String, Object> data) {
        this.data = data;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
