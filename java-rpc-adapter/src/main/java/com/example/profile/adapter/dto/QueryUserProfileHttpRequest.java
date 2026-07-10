package com.example.profile.adapter.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.LinkedHashMap;
import java.util.Map;

public class QueryUserProfileHttpRequest {

    @NotNull
    @JsonProperty("user_role")
    private Integer userRole;

    @NotBlank
    @JsonProperty("user_id")
    private String userId;

    private Map<String, Object> context = new LinkedHashMap<>();

    public Integer getUserRole() {
        return userRole;
    }

    public void setUserRole(Integer userRole) {
        this.userRole = userRole;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Map<String, Object> getContext() {
        return context;
    }

    public void setContext(Map<String, Object> context) {
        this.context = context == null ? new LinkedHashMap<>() : context;
    }
}
