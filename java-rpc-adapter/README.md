# Java HTTP Adapter for QueryUserProfile

当前前端 demo 是静态前端 + Node 本地服务，不能直接引入 Maven/KRPC 依赖。这里补了一个最小 Java HTTP Adapter 工程：

前端 demo -> Node server.js -> Java HTTP Adapter -> KRPC QueryUserProfile

## 本地先跑通 HTTP 层

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

当前工程通过 `krpc` profile 创建 KRPC client，核心调用代码在：

```text
src/main/java/com/kuaishou/demo/profile/adapter/client/KrpcUserProfileClient.java
```

实际调用的 stub 和方法是：

```java
AdAiStudioUserProfileServiceGrpc.AdAiStudioUserProfileServiceFutureClient#queryUserProfile
```

对应服务注册配置在 `src/main/resources/application.yml`：

```yaml
profile:
  adapter:
    krpc:
      biz-def: AD_INDUSTRY_INFRA_AIGC
      biz-name: ad-industry-infra-aigc-studio-serivce
      registry-name: ad-industry-ai-studio-center
      disable-auto-grpc-prefix: true
      division: staging
```

依赖版本：

```xml
<dependency>
  <groupId>kuaishou</groupId>
  <artifactId>ad-industry-ai-studio-center-client</artifactId>
  <version>1.0.234</version>
</dependency>
```

启动真实 KRPC profile：

```bash
mvn spring-boot:run \
  -Dspring-boot.run.profiles=krpc \
  -Dspring-boot.run.jvmArguments="--add-exports=java.base/sun.net.util=ALL-UNNAMED"
```

`--add-exports` 是为了兼容当前 KRPC 依赖在 Java 17 下访问 JDK 内部网络工具类的行为。

HTTP 请求会被转换成 `QueryUserProfileRequest`：

```text
context.biz_code = business_platform
user_role = 1 商家 / 2 普通用户
user_id = 商家ID / 用户ID
```

## 排查提示

- `rpc.connSuccess.ad-industry-ai-studio-center` 表示 KRPC 连接成功。
- `rpc.succ.ad-industry-ai-studio-center.queryUserProfile` 表示 `queryUserProfile` 调用成功返回。
- 如果返回 `success` 但画像字段为空，通常需要服务端确认当前 division、biz_code、权限和测试 ID 是否能命中真实画像数据。
