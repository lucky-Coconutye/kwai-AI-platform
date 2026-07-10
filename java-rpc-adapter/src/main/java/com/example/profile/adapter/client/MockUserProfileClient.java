package com.example.profile.adapter.client;

import com.example.profile.adapter.dto.QueryUserProfileHttpRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class MockUserProfileClient implements UserProfileClient {

    @Override
    public Map<String, Object> query(QueryUserProfileHttpRequest request) {
        Map<String, Object> baseResponse = new LinkedHashMap<>();
        baseResponse.put("code", 0);
        baseResponse.put("message", "mock adapter response");

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("base_response", baseResponse);
        if (request.getUserRole() == 1) {
            data.put("merchant_profile", merchantProfile(request.getUserId()));
        } else {
            data.put("user_profile", userProfile(request.getUserId()));
        }
        return data;
    }

    @Override
    public String source() {
        return "java-adapter-mock";
    }

    private Map<String, Object> userProfile(String userId) {
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("user_id", userId);
        profile.put("基础画像", Map.of(
                "年龄段", "18-23岁",
                "常驻地域", "二线城市",
                "消费水平", "中低消费",
                "价格敏感度", "高"
        ));
        profile.put("视频兴趣与内容偏好", Map.of(
                "核心兴趣", "美食、校园生活、社会百态",
                "广告偏好", "短视频种草、生活服务"
        ));
        return profile;
    }

    private Map<String, Object> merchantProfile(String merchantId) {
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("merchant_id", merchantId);
        profile.put("主营商品/服务", "课程培训");
        profile.put("经营业务范围", "课程咨询、预约咨询、线索留资");
        profile.put("目标用户值", "学生、家长、转行人群、高意向咨询用户");
        profile.put("接待注意事项", "先确认用户需求，再引导留资或预约咨询。");
        return profile;
    }
}
