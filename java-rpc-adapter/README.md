# Java RPC Adapter for QueryUserProfile

当前前端 demo 是静态前端 + Node 本地服务，不能直接引入 Maven/KRPC 依赖。这里补了一个最小 Java HTTP Adapter 工程：

前端 demo -> Node server.js -> Java HTTP Adapter -> KRPC QueryUserProfile

## 本地先跑通

默认是 mock client，可以先验证 Java HTTP 层是否通：

```bash
cd java-rpc-adapter
sh start.sh
```

健康检查：

```text
GET http://127.0.0.1:8081/api/health
```

查询接口：

```text
POST http://127.0.0.1:8081/api/queryUserProfile
```

请求体：

```json
{
  "user_role": 2,
  "user_id": "1839980743",
  "context": {
    "biz_code": "business_platform"
  }
}
```

## 让现有前端连 Java Adapter

另开一个终端启动当前 demo：

```bash
QUERY_USER_PROFILE_HTTP_URL="http://127.0.0.1:8081/api/queryUserProfile" PORT=8090 sh start.sh
```

访问：

```text
http://127.0.0.1:8090
```

此时前端点「查询画像」，会先到 Node，再转发到 Java Adapter。

## 切真实 KRPC

KDev 中看到的依赖版本是：

```xml
<dependency>
  <groupId>kuaishou</groupId>
  <artifactId>ad-industry-ai-studio-center-parent</artifactId>
  <version>1.0.234</version>
</dependency>
<dependency>
  <groupId>kuaishou</groupId>
  <artifactId>ad-industry-ai-studio-center-client</artifactId>
  <version>1.0.234</version>
</dependency>
```

本工程已在 `pom.xml` 的 `krpc` profile 里放好。真正接入时需要：

1. 打开 `src/main/java/com/kuaishou/demo/profile/adapter/client/KrpcUserProfileClient.java`
2. 按公司真实包名补齐 import。
3. 按公司 KRPC 方式注入：

```java
private KrpcAdAiStudioUserProfileServiceGrpc.IAdAiStudioUserProfileService userProfileService;
```

4. 把 HTTP 请求转换成 `QueryUserProfileRequest`：

```text
context.biz_code = business_platform
user_role = 1 商家 / 2 普通用户
user_id = 商家ID / 用户ID
```

5. 使用真实 profile 启动：

```bash
mvn spring-boot:run -Pkrpc -Dspring-boot.run.profiles=krpc
```

## 还需要老师/后端补齐的信息

- `KrpcAdAiStudioUserProfileServiceGrpc.IAdAiStudioUserProfileService` 的真实 Java import。
- `QueryUserProfileRequest`、`QueryUserProfileResponse`、`ServiceContext` 的真实 Java import。
- 公司 KRPC 注入注解和本地启动配置。
- `business_platform` 的调用权限是否已开通。
