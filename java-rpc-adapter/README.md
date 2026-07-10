# Java HTTP Adapter

这个目录是画像资产平台 Demo 的后端适配层示例。

前端页面不能直接依赖企业内部服务协议，因此这里用一个轻量 Java HTTP Adapter 做中转：

```text
前端页面 -> Node API -> Java HTTP Adapter -> 企业内部画像查询服务
```

公开版本只保留通用工程结构和 mock 能力，不在文档中暴露任何真实服务名、内部注册信息、私有依赖或访问凭据。

## 本地启动

默认启动 mock client，用于验证 HTTP 层是否可用：

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

示例请求：

```json
{
  "user_role": 2,
  "user_id": "1000000001",
  "context": {
    "biz_code": "demo"
  }
}
```

字段约定：

```text
user_role=1 商家
user_role=2 普通用户
```

## 和前端联调

先启动 Adapter：

```bash
cd java-rpc-adapter
sh start.sh
```

再启动根目录 Demo，并让 Node 代理到 Adapter：

```bash
cd ..
QUERY_USER_PROFILE_HTTP_URL="http://127.0.0.1:8081/api/queryUserProfile" PORT=8090 sh start.sh
```

访问：

```text
http://127.0.0.1:8090
```

此时页面里的「画像查询」会先到 Node，再由 Node 转发到 Java Adapter。

## 如何替换为真实后端

真实项目中，可以在 Adapter 内部替换 `UserProfileClient` 的实现，把 HTTP 请求转换为实际后端服务需要的请求格式。

建议保持对前端稳定的 HTTP 契约：

```text
POST /api/queryUserProfile
```

这样无论后端是 RPC、REST、网关还是其他内部协议，前端都不需要改动。

## 面试讲解点

- 为什么需要 Adapter：隔离浏览器和内部服务协议。
- 为什么保留 mock：保证公开 Demo 不依赖私有环境，也能完整演示。
- 为什么 Node 也做一层代理：统一前端同源 API，避免跨域和环境差异。
- 如何扩展：替换 `UserProfileClient` 实现即可接入真实画像服务。
