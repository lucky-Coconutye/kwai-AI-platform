# 画像资产平台 Demo

这是一个用于面试展示的画像数据产品 Demo。它把“用户画像”和“商家画像”包装成一个可交互的数据资产工作台，支持检索、筛选、详情查看和查询链路演示。

公开版本只包含脱敏样例数据和通用工程结构，不包含任何真实业务数据、内部服务名、内部表名或私有访问凭据。面试官可以直接 clone 后本地运行，看到一个完整可操作的产品原型。

## 这个项目是做什么的

在真实业务里，画像数据通常散落在数据表、接口或离线文件中，非技术用户很难直接理解和使用。这个 Demo 模拟了一个“画像资产平台”：

- 把用户画像、商家画像整理成统一的卡片列表。
- 支持按 ID、行业、兴趣、标签等信息搜索。
- 支持按画像类型和结构化字段筛选。
- 支持查看画像详情和原始字段。
- 支持用同一套前端在 mock 数据和后端查询服务之间切换。

面试中可以把它讲成一个“把底层画像数据产品化”的项目：不仅展示页面，也展示了前端、Node API、后端适配层和数据兜底策略的完整思路。

## 项目亮点

- **产品化表达**：把原始画像数据转成画像市场、筛选器、详情面板和查询工作台。
- **前后端分层清晰**：浏览器只请求 Node 同源接口，Node 负责静态资源、mock 数据和后端代理。
- **可离线演示**：默认使用脱敏 mock 数据，不依赖任何公司内网或私有服务。
- **可扩展后端接入**：预留 Java Adapter，用于把 HTTP 查询适配到企业内部画像查询服务。
- **面试友好**：clone 后一条命令启动，README 包含项目背景、架构和演示路径。

## 功能概览

- **画像市场**：集中展示用户画像和商家画像卡片。
- **关键词搜索**：支持按用户 ID、商家 ID、行业、服务、兴趣等字段搜索。
- **结构化筛选**：支持画像类型、行业/标签和画像字段条件筛选。
- **画像详情**：展示底表字段、画像字段、标签和关键指标。
- **画像查询**：输入画像 ID，查询用户或商家画像。
- **离线兜底**：未配置后端地址时自动读取 `mock-data/` 中的脱敏样例。
- **后端适配骨架**：`java-rpc-adapter/` 展示如何把本地 HTTP API 转接到企业内部查询服务。

## 技术架构

```text
浏览器页面
  -> Node 本地服务
     -> mock-data 脱敏样例数据
     -> Java HTTP Adapter
        -> 企业内部画像查询服务
```

前端始终只请求同源接口：

```text
GET  /api/profileList
POST /api/queryUserProfile
```

这样设计的好处是：

- 前端不需要感知后端服务协议。
- 本地演示和真实服务接入可以复用同一套 UI。
- 没有后端环境时也能完整展示项目。
- 后端查询服务可以通过 Adapter 独立替换。

## 技术栈

- HTML / CSS / JavaScript
- Node.js 原生 HTTP 服务
- Java / Spring Boot Adapter
- JSON mock 数据
- Shell 启动脚本

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
└── java-rpc-adapter/           # Java HTTP Adapter 示例
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
    "biz_code": "demo"
  }
}
```

查询商家画像：

```json
{
  "user_role": 1,
  "user_id": "2000000001",
  "context": {
    "biz_code": "demo"
  }
}
```

字段约定：

```text
user_role=1 表示商家
user_role=2 表示普通用户
biz_code 可以理解为业务场景标识，公开 Demo 中使用示例值即可
```

## 后端接入方式

公开演示默认走 mock 数据。如果要接入真实画像服务，可以配置 Node 服务把查询请求转发到一个 HTTP Adapter：

```bash
export QUERY_USER_PROFILE_HTTP_URL="http://127.0.0.1:8081/api/queryUserProfile"
PORT=8090 sh start.sh
```

这里的 `java-rpc-adapter/` 是一个通用适配层示例，用于说明：

```text
前端页面 -> Node API -> Java HTTP Adapter -> 企业内部画像查询服务
```

公开仓库不会提供任何真实服务地址、内部服务名或私有认证信息。不同公司或项目可以替换 Adapter 内部实现，保持前端和 Node API 不变。

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `8090` | Node Demo 监听端口 |
| `HOST` | `127.0.0.1` | Node Demo 监听地址 |
| `QUERY_USER_PROFILE_HTTP_URL` | 空 | 配置后 Node 会把查询转发到 HTTP Adapter |
| `QUERY_USER_PROFILE_BIZ_CODE` | `demo` | 默认业务场景标识 |
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

## 面试讲解思路

可以按这个顺序介绍项目：

1. **问题背景**：画像数据原本是底层数据，直接给运营或产品使用门槛高。
2. **产品方案**：做成画像资产平台，提供搜索、筛选、详情和实时查询。
3. **技术架构**：前端只依赖 Node 同源 API，Node 同时支持 mock 数据和后端代理。
4. **工程取舍**：公开 Demo 可以离线运行，真实场景可以替换 Adapter 接入内部服务。
5. **扩展方向**：增加权限、批量查询、画像对比、指标看板、导出能力和在线部署。

## 当前项目状态

- 本地离线 Demo：可直接运行。
- Node API 代理：已实现。
- Java HTTP Adapter：提供通用接入示例。
- 公开数据：仅包含脱敏 mock 数据，适合 GitHub 展示。
- 真实服务接入：保留抽象接口和 Adapter 结构，不在公开 README 暴露内部细节。
