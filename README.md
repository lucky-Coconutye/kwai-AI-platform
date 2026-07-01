# AI 回评策略工作台 Demo

这个 Demo 的定位不是“查表工具”，而是：

> 利用用户画像底表和商家画像底表，为 AI 回评提供上下文、风险判断和回复策略的业务工作台。

两张表只做底层画像来源，页面核心表达的是“把画像转成回评决策”。

## 页面模块

保留 5 个模块：

1. **画像工作台**：看整体状态，包括画像命中率、待处理评论、风险评论、已发布数。
2. **画像联动**：展示两张底表如何参与回评决策。
3. **评论任务**：展示评论、user_id、merchant_id、用户画像命中情况、风险等级。
4. **回评策略**：展示用户阶段、关注点、商家供给、禁答边界和最终策略。
5. **审核发布**：审核 AI 回复，发布或标记 Badcase。

## 核心链路

```text
选择商家 / 素材
→ 拉取评论
→ 根据评论 user_id 查用户画像
→ 根据 merchant_id 查商家画像
→ 解析两类画像
→ 生成回评策略
→ 生成 AI 回复
→ 审核发布 / Badcase
```

## 两张底表

### 用户画像表

表名：`ks_mmu.llm_u2_user_description_white_box_td`

```sql
select
  user_id,
  result
from ks_mmu.llm_u2_user_description_white_box_td
where p_date = '${date}'
  and user_id in (...)
```

约束：必须带 `p_date`，必须用 `user_id in (...)`，不要扫全表。`result` 需要解析成用户意向阶段、关注点、意向强度、风险信号、地域/年龄段等业务字段。

### 商家画像表

表名：`ks_mmu.pi_merchant_profile_generation_record`

```sql
select
  merchant_id,
  first_industry_name,
  merchant_name,
  guide_words,
  chat_knowledge_aggr,
  merchant_profile
from ks_mmu.pi_merchant_profile_generation_record
where p_date = '${date}'
  and merchant_id in (...)
```

约束：必须带 `p_date`，用 `merchant_id in (...)` 查询。`merchant_profile` 是核心画像，`guide_words`、`chat_knowledge_aggr` 作为商家知识补充。

## 策略规则示例

- 用户画像风险高 → 转人工 / 不自动回
- 用户高意向 + 关注预约 → 引导预约 / 私信
- 用户关注价格 → 不报固定价，引导详情页 / 私信
- 用户问库存 → 不编造库存，引导确认
- 商家画像有禁答边界 → 回复必须避开

一句话：用户画像决定“对谁说、风险多高”；商家画像决定“能说什么、不能说什么”；评论内容决定“这次具体问什么”。AI 只负责把策略转成自然语言。

## 启动

```bash
sh start.sh
```

浏览器打开：

```text
http://127.0.0.1:8080
```

换端口：

```bash
PORT=8090 sh start.sh
```

## 可演示交互

- 输入/选择 merchant_id、material_id
- 拉取 10-20 条评论样例，目前 Demo 内置少量 mock 评论
- 根据 user_id 命中用户画像
- 根据 merchant_id 命中商家画像
- 页面展示画像解析结果
- 生成回评策略
- 生成 AI 回复
- 人工审核发布或标记 Badcase

## 真实接口接入点

当前使用 `app.js` 里的 `mockApi`。后续接真实接口时替换：

- `getMerchantProfile(merchantId)`
- `getCommentTasks(materialId)`
- `getUserProfiles(userIds)`
- `generateStrategy({ task, merchantProfile, userProfile })`
- `generateReply({ task, merchantProfile, userProfile, strategy })`
