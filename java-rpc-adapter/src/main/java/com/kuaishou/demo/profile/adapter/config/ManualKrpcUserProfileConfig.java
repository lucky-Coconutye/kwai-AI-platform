package com.kuaishou.demo.profile.adapter.config;

import com.kuaishou.ad.industry.ai.studio.center.protobuf.AdAiStudioUserProfileServiceGrpc;
import com.kuaishou.ad.industry.ai.studio.center.protobuf.KrpcAdAiStudioUserProfileServiceGrpc;
import com.kuaishou.framework.rpc.client.n.GrpcClient;
import com.kuaishou.framework.rpc.config.n.RpcConfig;
import com.kuaishou.framework.warmup.Warmuper;
import com.kuaishou.infra.grpc.constant.RpcStubHolder;
import java.time.Duration;
import kuaishou.common.BizDef;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("krpc")
public class ManualKrpcUserProfileConfig {

    @Bean
    @ConditionalOnMissingBean(KrpcAdAiStudioUserProfileServiceGrpc.IAdAiStudioUserProfileService.class)
    @ConditionalOnProperty(prefix = "profile.adapter.krpc", name = "manual-enabled", havingValue = "true")
    public KrpcAdAiStudioUserProfileServiceGrpc.IAdAiStudioUserProfileService userProfileService(
            @Value("${profile.adapter.krpc.biz-def:AD_INDUSTRY_INFRA_AIGC}") String bizDef,
            @Value("${profile.adapter.krpc.biz-name:ad-industry-ai-studio-center}") String bizName,
            @Value("${profile.adapter.krpc.registry-name:${profile.adapter.krpc.biz-name:ad-industry-ai-studio-center}}") String registryName,
            @Value("${profile.adapter.krpc.port:0}") int port,
            @Value("${profile.adapter.krpc.timeout-ms:5000}") long timeoutMs
    ) {
        RpcConfig rpcConfig = new UserProfileRpcConfig(bizDef, bizName, registryName, port);
        return GrpcClient.create(rpcConfig)
                .toGrpcCore()
                .getClient(
                        KrpcAdAiStudioUserProfileServiceGrpc.IAdAiStudioUserProfileService.class,
                        Duration.ofMillis(timeoutMs)
                );
    }

    private record UserProfileRpcConfig(
            String bizDefName,
            String bizName,
            String registryName,
            int port
    ) implements RpcConfig {

        @Override
        public Class<? extends RpcStubHolder> grpcClass() {
            return AdAiStudioUserProfileServiceGrpc.class;
        }

        @Override
        public String bizName() {
            return bizName;
        }

        @Override
        public int port() {
            return port;
        }

        @Override
        public String bizNameForRegistry() {
            return registryName;
        }

        @Override
        public Warmuper warmuper() {
            return Warmuper.NOOP_WARMUP;
        }

        @Override
        public BizDef bizDef() {
            try {
                return BizDef.valueOf(bizDefName);
            } catch (IllegalArgumentException ignored) {
                return BizDef.AD_INDUSTRY_INFRA_AIGC;
            }
        }
    }
}
