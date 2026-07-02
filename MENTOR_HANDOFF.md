# 画像资产平台 Demo 交付说明

## 这是什么

这是一个基于画像底表的可运行 Demo，用平台产品形式展示「用户画像」和「商家画像」数据。

核心目标不是复刻达芬奇平台，而是把已有底表能力产品化：支持画像资产检索、筛选、列表查看、详情查看和离线查询验证。

## 当前数据

- 用户画像：来自 `ks_mmu.llm_u2_user_description_white_box_td`
- 商家画像：来自 `ks_mmu.pi_merchant_profile_generation_record`
- GitHub 版本：仅保留脱敏样例数据，避免提交真实画像明细
- 本地数据文件：
  - `mock-data/profiles.json`
  - `mock-data/merchant_profiles.json`

## 当前能力

- 左侧中台式导航：画像市场、用户画像、商家画像
- 画像市场：统一检索用户 ID、商家 ID、行业、服务和兴趣
- 用户画像筛选：性别、年龄段、常驻地域、婚姻状态、育儿状态、设备、消费水平、价格敏感、兴趣和广告偏好
- 商家画像筛选：商家行业、一级行业、智能客服、主营服务、业务范围、目标客群
- 画像详情：展示底表原始字段和解析后的用户/商家画像内容
- 查询接口：`POST /api/queryUserProfile`
- 离线兜底：没有真实 RPC Adapter 时，直接查本地离线数据

## 如何启动

```bash
cd kwai-AI-platform
sh start.sh
```

访问：

```text
http://127.0.0.1:8090/
```

如需换端口：

```bash
PORT=8080 sh start.sh
```

## 可验证 ID

用户画像：

```text
1000000001
1000000002
```

商家画像：

```text
2000000001
2000000002
```

## 和真实接口的关系

当前包默认使用离线数据，确保任何人拿到后都能直接跑起来。

后续如果接入真实 Java/KRPC，可起一个 Java HTTP Adapter，然后配置：

```bash
export QUERY_USER_PROFILE_HTTP_URL="http://127.0.0.1:8081/api/queryUserProfile"
export QUERY_USER_PROFILE_BIZ_CODE="business_platform"
sh start.sh
```

前端无需改动，会通过本地 Node 服务转发到真实查询服务。

## 建议介绍口径

这个 Demo 是一个画像资产平台的 MVP：先把用户画像和商家画像底表里的核心内容，以中台产品形态展示出来，支持检索、筛选、详情查看和查询验证。当前为了保证可演示性，先使用离线数据跑通；后续只需要接入 QueryUserProfile 的 Java/KRPC Adapter，就可以切到真实画像服务。
