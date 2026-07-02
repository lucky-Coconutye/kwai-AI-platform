package com.kuaishou.demo.profile.adapter.controller;

import com.kuaishou.demo.profile.adapter.client.UserProfileClient;
import com.kuaishou.demo.profile.adapter.dto.QueryUserProfileHttpRequest;
import com.kuaishou.demo.profile.adapter.dto.QueryUserProfileHttpResponse;
import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class UserProfileQueryController {

    private final UserProfileClient userProfileClient;
    private final String defaultBizCode;

    public UserProfileQueryController(
            UserProfileClient userProfileClient,
            @Value("${profile.adapter.biz-code:business_platform}") String defaultBizCode
    ) {
        this.userProfileClient = userProfileClient;
        this.defaultBizCode = defaultBizCode;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("ok", true);
        result.put("service", "profile-rpc-adapter");
        result.put("source", userProfileClient.source());
        return result;
    }

    @PostMapping("/queryUserProfile")
    public ResponseEntity<QueryUserProfileHttpResponse> queryUserProfile(
            @Valid @RequestBody QueryUserProfileHttpRequest request
    ) {
        if (request.getUserRole() != 1 && request.getUserRole() != 2) {
            return ResponseEntity.badRequest().body(QueryUserProfileHttpResponse.failure("user_role 只能是商家或普通用户。"));
        }

        Map<String, Object> requestForLog = normalizeRequest(request);
        Map<String, Object> data = userProfileClient.query(request);
        return ResponseEntity.ok(QueryUserProfileHttpResponse.success(userProfileClient.source(), requestForLog, data));
    }

    private Map<String, Object> normalizeRequest(QueryUserProfileHttpRequest request) {
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("session_id", "");
        context.put("user_id", "0");
        context.put("account_id", "0");
        context.put("merchant_id", "0");
        context.put("username", "");
        context.put("request_id", "");
        context.put("agent_name", "");
        context.put("scene_id", 0);
        context.put("scene_type", 0);
        context.put("scene_name", "");
        context.put("token", "");
        context.put("ability_name", "");
        context.put("invoker", "");
        context.putAll(request.getContext());
        context.putIfAbsent("biz_code", defaultBizCode);

        Map<String, Object> normalized = new LinkedHashMap<>();
        normalized.put("user_role", request.getUserRole());
        normalized.put("user_id", request.getUserId());
        normalized.put("context", context);
        return normalized;
    }
}
