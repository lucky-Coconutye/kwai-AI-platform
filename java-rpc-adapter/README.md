# Java RPC Adapter for QueryUserProfile

当前前端 demo 是静态前端 + Node 本地服务，不能直接引入 Maven/KRPC 依赖：

```xml
<dependency>
  <groupId>kuaishou</groupId>
  <artifactId>ad-industry-ai-studio-center-client</artifactId>
  <version>1.0.232</version>
</dependency>
```

正确接法是：

```text
前端 demo
→ Node server.js
→ Java HTTP Adapter
→ KrpcAdAiStudioUserProfileServiceGrpc.IAdAiStudioUserProfileService
→ QueryUserProfile
```

## Maven 依赖

把下面依赖放到 Java 后端项目的 `pom.xml`：

```xml
<dependency>
  <groupId>kuaishou</groupId>
  <artifactId>ad-industry-ai-studio-center-parent</artifactId>
  <version>1.0.232</version>
</dependency>
<dependency>
  <groupId>kuaishou</groupId>
  <artifactId>ad-industry-ai-studio-center-client</artifactId>
  <version>1.0.232</version>
</dependency>
```

## 前端 demo 如何连

Java 适配层暴露：

```text
POST http://127.0.0.1:8081/api/queryUserProfile
```

请求体默认使用 `biz_code=business_platform`。只需要按查询对象切换：

```text
user_role=1，user_id=商家ID
user_role=2，user_id=普通用户ID
```

然后启动当前 demo：

```bash
export QUERY_USER_PROFILE_HTTP_URL="http://127.0.0.1:8081/api/queryUserProfile"
PORT=8090 sh start.sh
```

这样当前 demo 的 `/api/queryUserProfile` 会转发到 Java 适配层，再由 Java 调真实 KRPC。

## 注意

`UserProfileQueryController.java` 是接入模板。里面的 import、注入注解、builder 方法名需要按公司生成的真实 client 类微调。
