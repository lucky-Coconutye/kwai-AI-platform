package com.example.profile.adapter.client;

import com.example.profile.adapter.dto.QueryUserProfileHttpRequest;
import java.util.Map;

public interface UserProfileClient {

    Map<String, Object> query(QueryUserProfileHttpRequest request);

    String source();
}
