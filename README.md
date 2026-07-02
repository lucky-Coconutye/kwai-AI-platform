# 底表画像数据展示平台 Demo

这个 Demo 的目标是把两张画像底表能提供的数据，以平台产品的方式展示出来：

- 用户画像底表：`ks_mmu.llm_u2_user_description_white_box_td`
- 商家画像记录表：`ks_mmu.pi_merchant_profile_generation_record`

页面只展示表里已有的画像核心数据项：用户 `result` / `user_profile`、商家基础字段、`merchant_profile` 和实时查询。

当前版本支持离线查询：未配置真实 RPC/HTTP 地址时，`/api/queryUserProfile` 会自动查询 `mock-data/profiles.json` 和 `mock-data/merchant_profiles.json`。

## 启动

```bash
git clone https://github.com/lucky-Coconutye/kwai-AI-platform.git
cd kwai-AI-platform
sh start.sh
```

默认访问：

```text
http://127.0.0.1:8090
```

换端口：

```bash
PORT=8080 sh start.sh
```

## QueryUserProfile 请求

业务 bizCode：

```text
business_platform
```

查询用户画像：

```json
{
  "user_role": 2,
  "user_id": "1839980743",
  "context": {
    "biz_code": "business_platform",
    "session_id": "",
    "user_id": "0",
    "account_id": "0",
    "merchant_id": "0",
    "username": "",
    "request_id": "",
    "agent_name": "",
    "scene_id": 0,
    "scene_type": 0,
    "scene_name": "",
    "token": "",
    "ability_name": "",
    "invoker": ""
  }
}
```

查询商家画像时只需要改：

```json
{
  "user_role": 1,
  "user_id": "商家ID"
}
```

其中 `user_role=1` 表示商家，`user_role=2` 表示普通用户。

## 本地代理

前端可以请求本地 Node 服务：

```text
POST /api/queryUserProfile
```

页面里的「实时查询」会直接调用这个接口。未接入 Java/KRPC Adapter 时，会展示本地离线样例数据；接入后会展示真实返回。

GitHub 版本仅保留脱敏样例数据，方便任何人直接启动验证。

离线样例 ID：

```text
用户：1000000001、1000000002
商家：2000000001、2000000002
```

如果公司内真实服务只能通过 Java/KRPC 调用，需要先起一个 Java HTTP Adapter，再让当前 Demo 转发过去：

```bash
export QUERY_USER_PROFILE_HTTP_URL="http://127.0.0.1:8081/api/queryUserProfile"
export QUERY_USER_PROFILE_BIZ_CODE="business_platform"
PORT=8090 sh start.sh
```

如果没有配置 `QUERY_USER_PROFILE_HTTP_URL`，本地接口会查询 `mock-data/profiles.json` 和 `mock-data/merchant_profiles.json`。查不到 ID 时，会返回可用的离线样例 ID。

## 导入商家画像 CSV

```bash
python3 scripts/import_merchant_profiles.py \
  /Users/coconutye/Desktop/merchant_profile_20260630.csv \
  mock-data/merchant_profiles.json
```

当前 GitHub 版本不提交真实商家画像明细，只保留脱敏样例。若需要在本地演示完整离线商家画像，可用上述脚本重新导入 CSV；导入后，`user_role=1` 的查询会优先从 `mock-data/merchant_profiles.json` 按 `merchant_id` 命中。

## Java/KRPC 依赖

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

```java
private KrpcAdAiStudioUserProfileServiceGrpc.IAdAiStudioUserProfileService userProfileService;
```

模板见：

```text
java-rpc-adapter/UserProfileQueryController.java
java-rpc-adapter/README.md
```
