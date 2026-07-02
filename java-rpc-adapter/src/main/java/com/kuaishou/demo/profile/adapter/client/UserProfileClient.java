package com.kuaishou.demo.profile.adapter.client;

import com.kuaishou.demo.profile.adapter.dto.QueryUserProfileHttpRequest;
import java.util.Map;

public interface UserProfileClient {

    Map<String, Object> query(QueryUserProfileHttpRequest request);

    String source();
}
