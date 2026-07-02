package com.kuaishou.demo.profile.adapter.client;

import com.kuaishou.ad.industry.ai.studio.center.protobuf.BaseResponseInfo;
import com.kuaishou.ad.industry.ai.studio.center.protobuf.KrpcAdAiStudioUserProfileServiceGrpc;
import com.kuaishou.ad.industry.ai.studio.center.protobuf.MerchantProfileInfo;
import com.kuaishou.ad.industry.ai.studio.center.protobuf.QueryUserProfileRequest;
import com.kuaishou.ad.industry.ai.studio.center.protobuf.QueryUserProfileResponse;
import com.kuaishou.ad.industry.ai.studio.center.protobuf.UserProfileInfo;
import com.kuaishou.ad.industry.ai.studio.protobuf.ServiceContext;
import com.kuaishou.demo.profile.adapter.dto.QueryUserProfileHttpRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("krpc")
public class KrpcUserProfileClient implements UserProfileClient {

    private final ObjectProvider<KrpcAdAiStudioUserProfileServiceGrpc.IAdAiStudioUserProfileService> serviceProvider;
    private final String defaultBizCode;

    public KrpcUserProfileClient(
            ObjectProvider<KrpcAdAiStudioUserProfileServiceGrpc.IAdAiStudioUserProfileService> serviceProvider,
            @Value("${profile.adapter.biz-code:business_platform}") String defaultBizCode
    ) {
        this.serviceProvider = serviceProvider;
        this.defaultBizCode = defaultBizCode;
    }

    @Override
    public Map<String, Object> query(QueryUserProfileHttpRequest request) {
        KrpcAdAiStudioUserProfileServiceGrpc.IAdAiStudioUserProfileService userProfileService =
                serviceProvider.getIfAvailable();
        if (userProfileService == null) {
            return missingServiceBeanResponse(request);
        }

        QueryUserProfileRequest rpcRequest = QueryUserProfileRequest.newBuilder()
                .setContext(buildContext(request.getContext()))
                .setUserRole(request.getUserRole())
                .setUserId(request.getUserId())
                .build();

        try {
            QueryUserProfileResponse rpcResponse = userProfileService.queryUserProfile(rpcRequest);
            return toResponseMap(rpcResponse);
        } catch (Exception error) {
            return rpcCallFailedResponse(request, error);
        }
    }

    @Override
    public String source() {
        return "java-adapter-krpc";
    }

    private ServiceContext buildContext(Map<String, Object> context) {
        Map<String, Object> safeContext = context == null ? new LinkedHashMap<>() : context;
        return ServiceContext.newBuilder()
                .setBizCode(stringValue(safeContext, "biz_code", defaultBizCode))
                .setSessionId(stringValue(safeContext, "session_id", ""))
                .setUserId(longValue(safeContext, "user_id", 0L))
                .setAccountId(longValue(safeContext, "account_id", 0L))
                .setMerchantId(longValue(safeContext, "merchant_id", 0L))
                .setUsername(stringValue(safeContext, "username", ""))
                .setRequestId(stringValue(safeContext, "request_id", ""))
                .setAgentName(stringValue(safeContext, "agent_name", ""))
                .setSceneId(intValue(safeContext, "scene_id", 0))
                .setSceneType(intValue(safeContext, "scene_type", 0))
                .setSceneName(stringValue(safeContext, "scene_name", ""))
                .setToken(stringValue(safeContext, "token", ""))
                .setAbilityName(stringValue(safeContext, "ability_name", ""))
                .setInvoker(stringValue(safeContext, "invoker", ""))
                .build();
    }

    private Map<String, Object> toResponseMap(QueryUserProfileResponse response) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("base_response", response.hasBaseResponse()
                ? baseResponseToMap(response.getBaseResponse())
                : new LinkedHashMap<>());
        if (response.hasUserProfile()) {
            data.put("user_profile", userProfileToMap(response.getUserProfile()));
        }
        if (response.hasMerchantProfile()) {
            data.put("merchant_profile", merchantProfileToMap(response.getMerchantProfile()));
        }
        return data;
    }

    private Map<String, Object> baseResponseToMap(BaseResponseInfo baseResponse) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("result", baseResponse.getResult());
        data.put("error_code", baseResponse.getErrorCode());
        data.put("error_message", baseResponse.getErrorMessage());
        return data;
    }

    private Map<String, Object> userProfileToMap(UserProfileInfo profile) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("user_id", profile.getUserId());
        data.put("basic_profile", profile.getBasicProfile());
        data.put("interest_preference", profile.getInterestPreference());
        data.put("consumption_behavior", profile.getConsumptionBehavior());
        data.put("local_business_demand_signal", profile.getLocalBusinessDemandSignal());
        data.put("create_time", profile.getCreateTime());
        data.put("update_time", profile.getUpdateTime());
        return data;
    }

    private Map<String, Object> merchantProfileToMap(MerchantProfileInfo profile) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("merchant_id", profile.getMerchantId());
        data.put("main_products_services", profile.getMainProductsServices());
        data.put("business_scope", profile.getBusinessScope());
        data.put("out_of_scope", profile.getOutOfScope());
        data.put("brand_honor", profile.getBrandHonor());
        data.put("team_experts", profile.getTeamExperts());
        data.put("reception_notes", profile.getReceptionNotes());
        data.put("proactive_screening", profile.getProactiveScreening());
        data.put("target_user_value", profile.getTargetUserValue());
        data.put("chat_knowledge_aggr", profile.getChatKnowledgeAggr());
        data.put("video_info_str", profile.getVideoInfoStr());
        data.put("create_time", profile.getCreateTime());
        data.put("update_time", profile.getUpdateTime());
        data.put("merchant_info", profile.getMerchantInfo());
        data.put("sop_selection", profile.getSopSelection());
        data.put("sop_rewritten", profile.getSopRewritten());
        return data;
    }

    private Map<String, Object> missingServiceBeanResponse(QueryUserProfileHttpRequest request) {
        return failedResponse(
                request,
                "KRPC_SERVICE_BEAN_MISSING",
                "未找到 IAdAiStudioUserProfileService Bean。krpc profile 下 Adapter 会默认尝试创建该 Bean；如果仍失败，请检查 KRPC 依赖和 Spring 配置是否加载。"
        );
    }

    private Map<String, Object> rpcCallFailedResponse(QueryUserProfileHttpRequest request, Exception error) {
        return failedResponse(
                request,
                "KRPC_CALL_FAILED",
                "已创建 IAdAiStudioUserProfileService Bean，但调用 QueryUserProfile 失败：" + error.getClass().getSimpleName() + ": " + error.getMessage()
        );
    }

    private Map<String, Object> failedResponse(QueryUserProfileHttpRequest request, String code, String message) {
        Map<String, Object> baseResponse = new LinkedHashMap<>();
        baseResponse.put("result", false);
        baseResponse.put("error_code", code);
        baseResponse.put("error_message", message);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("base_response", baseResponse);
        data.put("user_role", request.getUserRole());
        data.put("user_id", request.getUserId());
        return data;
    }

    private String stringValue(Map<String, Object> source, String key, String fallback) {
        Object value = source.get(key);
        if (value == null) {
            return fallback;
        }
        String text = String.valueOf(value);
        return text.isBlank() ? fallback : text;
    }

    private long longValue(Map<String, Object> source, String key, long fallback) {
        Object value = source.get(key);
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private int intValue(Map<String, Object> source, String key, int fallback) {
        Object value = source.get(key);
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return fallback;
        }
    }
}
