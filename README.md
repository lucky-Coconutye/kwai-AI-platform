# 画像资产平台 Demo

这是一个面向面试展示的画像数据产品 Demo。项目把“用户画像”和“商家画像”两类底表数据包装成一个可交互的资产工作台，支持画像检索、条件筛选、详情查看和实时查询链路演示。

在线评审或本地运行时，访问者不需要公司内网依赖也能看到完整产品形态：GitHub 版本内置了脱敏样例数据，默认会走本地离线查询；如果在公司网络环境中配置 Java/KRPC Adapter，也可以把同一套前端切换到真实 `QueryUserProfile` 服务。

## 项目目标

这个项目用于展示以下能力：

- 将离线画像底表抽象成可检索、可筛选、可查看详情的平台化产品界面。
- 支持用户画像与商家画像两种对象类型，并用统一交互承载不同字段结构。
- 在无后端依赖时使用 mock 数据完整演示，在有公司 KRPC 环境时切换到真实服务调用。
- 用 Node 本地服务解决前端同源 API、静态资源托管和后端代理问题。
- 用 Java HTTP Adapter 演示浏览器前端如何间接打通公司内 KRPC 服务。

## 功能概览

- **画像市场**：集中展示用户画像和商家画像卡片。
- **关键词搜索**：支持按用户 ID、商家 ID、行业、服务、兴趣等字段搜索。
- **结构化筛选**：支持画像类型、行业/标签和画像字段条件筛选。
- **画像详情**：展示底表原始字段和结构化画像字段。
- **实时查询**：右侧输入画像 ID，可查询用户或商家画像。
- **离线兜底**：未配置真实后端时自动读取 `mock-data/` 中的脱敏样例。
- **KRPC 接入骨架**：`java-rpc-adapter/` 提供 HTTP 到 KRPC 的适配层。

## 技术架构

```text
浏览器页面
  -> Node server.js
     -> mock-data 离线样例数据
     -> Java HTTP Adapter
        -> KESS/KRPC
           -> QueryUserProfile 服务
```

前端始终只请求同源接口：

```text
GET  /api/profileList
POST /api/queryUserProfile
```

这样浏览器不需要直接处理 KRPC SDK、公司内网依赖或跨域问题。

## 目录结构

```text
.
├── index.html                  # 页面结构
├── styles.css                  # 页面样式
├── app.js                      # 前端交互、筛选、查询和详情渲染
├── server.js                   # Node 静态服务与 API 代理
├── start.sh                    # 一键启动前端 Demo
├── mock-data/                  # 脱敏离线样例数据
├── scripts/                    # 数据导入脚本
└── java-rpc-adapter/           # Java HTTP -> KRPC Adapter
```

## 快速启动

```bash
git clone https://github.com/lucky-Coconutye/kwai-AI-platform.git
cd kwai-AI-platform
sh start.sh
```

默认访问：

```text
http://127.0.0.1:8090
```

修改端口：

```bash
PORT=8080 sh start.sh
```

默认情况下不需要配置任何后端服务，页面会使用脱敏离线样例数据。

## 可测试样例 ID

离线样例数据中内置了以下 ID：

```text
用户：1000000001、1000000002
商家：2000000001、2000000002
```

页面右侧「画像查询」表单可以直接输入这些 ID 验证查询链路。

## API 说明

### 查询画像列表

```text
GET /api/profileList?limit=36
```

返回用户画像和商家画像的卡片化摘要数据。

### 查询单个画像

```text
POST /api/queryUserProfile
```

查询用户画像：

```json
{
  "user_role": 2,
  "user_id": "1000000001",
  "context": {
    "biz_code": "business_platform"
  }
}
```

查询商家画像：

```json
{
  "user_role": 1,
  "user_id": "2000000001",
  "context": {
    "biz_code": "business_platform"
  }
}
```

字段约定：

```text
user_role=1 表示商家
user_role=2 表示普通用户
biz_code=business_platform
```

## 接入真实 KRPC 服务

当前仓库包含一个 Java Adapter，用来把 HTTP 请求转成公司内 KRPC 调用：

```text
前端页面 -> Node server.js -> Java HTTP Adapter -> KRPC QueryUserProfile
```

先启动 Java Adapter：

```bash
cd java-rpc-adapter
sh start.sh
```

健康检查：

```text
GET http://127.0.0.1:8081/api/health
```

再启动前端 Demo，并让 Node 代理到 Java Adapter：

```bash
cd ..
export QUERY_USER_PROFILE_HTTP_URL="http://127.0.0.1:8081/api/queryUserProfile"
export QUERY_USER_PROFILE_BIZ_CODE="business_platform"
PORT=8090 sh start.sh
```

如果需要使用 `krpc` profile 连接真实 KESS/KRPC 服务，可在公司网络环境下运行：

```bash
cd java-rpc-adapter
mvn spring-boot:run \
  -Dspring-boot.run.profiles=krpc \
  -Dspring-boot.run.jvmArguments="--add-exports=java.base/sun.net.util=ALL-UNNAMED"
```

说明：真实 KRPC 调用依赖公司内网、KESS 配置、服务权限和正确的数据环境。GitHub 公开演示建议使用默认离线样例。

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `8090` | Node Demo 监听端口 |
| `HOST` | `127.0.0.1` | Node Demo 监听地址 |
| `QUERY_USER_PROFILE_HTTP_URL` | 空 | 配置后 Node 会把查询转发到真实 HTTP Adapter |
| `QUERY_USER_PROFILE_BIZ_CODE` | `business_platform` | 默认业务标识 |
| `QUERY_USER_PROFILE_TOKEN` | 空 | 转发到上游时附带 Bearer Token |
| `QUERY_USER_PROFILE_COOKIE` | 空 | 转发到上游时附带 Cookie |
| `QUERY_USER_PROFILE_TIMEOUT_MS` | `8000` | 上游请求超时时间 |

## 数据导入

如果有本地 CSV，可以把商家画像导入成离线 JSON：

```bash
python3 scripts/import_merchant_profiles.py \
  /path/to/merchant_profile.csv \
  mock-data/merchant_profiles.json
```

为了便于公开展示，仓库默认只提交脱敏样例数据，不提交真实业务明细。

## 面试展示建议

推荐给面试官的使用方式：

1. 打开 GitHub 仓库，先阅读项目目标和架构。
2. 本地执行 `sh start.sh`，访问 `http://127.0.0.1:8090`。
3. 体验搜索、筛选、画像详情和右侧实时查询。
4. 查看 `server.js` 理解 Node 同源代理和离线兜底。
5. 查看 `java-rpc-adapter/` 理解前端如何通过 HTTP Adapter 间接接入 KRPC。

## 当前状态

- 本地离线 Demo：可直接运行。
- Node API 代理：已实现。
- Java HTTP Adapter：已实现。
- KRPC 接入：保留公司内网环境下的适配代码和配置。
- 公开数据：仅包含脱敏 mock 数据，适合 GitHub 展示。
