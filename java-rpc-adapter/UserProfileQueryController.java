package com.kuaishou.demo.profile;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// TODO: 按 ad-industry-ai-studio-center-client 真实生成包名替换这些 import。
// import com.kuaishou.ad.industry.ai.studio.center.client.KrpcAdAiStudioUserProfileServiceGrpc;
// import com.kuaishou.ad.industry.ai.studio.center.client.QueryUserProfileRequest;
// import com.kuaishou.ad.industry.ai.studio.center.client.QueryUserProfileResponse;
// import com.kuaishou.ad.industry.ai.studio.center.client.ServiceContext;

@RestController
@RequestMapping("/api")
public class UserProfileQueryController {

    // TODO: 按公司 KRPC 注入方式替换注解，例如 @Autowired、@KrpcReference 等。
    // private KrpcAdAiStudioUserProfileServiceGrpc.IAdAiStudioUserProfileService userProfileService;

    @PostMapping("/queryUserProfile")
    public Map<String, Object> queryUserProfile(@RequestBody QueryUserProfileHttpRequest req) {
        // ServiceContext context = ServiceContext.newBuilder()
        //         .setBizCode(req.context == null ? "business_platform" : req.context.getOrDefault("biz_code", "business_platform"))
        //         .build();
        //
        // QueryUserProfileRequest request = QueryUserProfileRequest.newBuilder()
        //         .setContext(context)
        //         .setUserRole(req.user_role)
        //         .setUserId(req.user_id)
        //         .build();
        //
        // QueryUserProfileResponse response = userProfileService.queryUserProfile(request);
        //
        // Map<String, Object> result = new HashMap<>();
        // result.put("ok", true);
        // result.put("data", response);
        // return result;

        throw new UnsupportedOperationException("请按真实 KRPC 生成类补齐 import、注入方式和 builder 方法名。");
    }

    public static class QueryUserProfileHttpRequest {
        public Map<String, String> context;
        public Integer user_role;
        public String user_id;
    }
}
