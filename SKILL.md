---
name: chinese_trademark_search_skill
description: 连接中国商标查询托管平台 API，处理商标查询、详情、导出、点数与模块检查、绑定引导，适用于 OpenClaw / ClawHub 中通过本地 Node CLI 调用公开 Skill。
homepage: https://openclaw.zqip.cn
metadata: {"skillKey":"chinese_trademark_search_skill","homepage":"https://openclaw.zqip.cn","tags":["china","trademark","商标","search","openclaw","clawhub"]}
---

# 中国商标查询 Skill

本 Skill 用于在 OpenClaw / ClawHub 中连接“自有商标 SaaS 平台 API”，完成中国商标查询、详情查看、导出、模块查看、点数检查与绑定引导。

## 连接边界

- 本 Skill 只连接托管平台 API，不直连上游商标数据提供商。
- 不向用户索要上游商标接口账号密码。
- 用户只需要配置平台用户级 token。
- 若用户尚未绑定平台账号或组织，先引导绑定，再执行查询、详情、导出等动作。
- 不伪造商标数据；查不到就明确说明查不到。
- 优先摘要展示，避免一次输出过长。

## OpenClaw 调用方式

OpenClaw 应通过本地 Node CLI 调用本 Skill：

```bash
node {baseDir}/scripts/cli.mjs help
node {baseDir}/scripts/cli.mjs bind-help
node {baseDir}/scripts/cli.mjs capabilities
node {baseDir}/scripts/cli.mjs search --query "华源科技" --page 1
node {baseDir}/scripts/cli.mjs detail --tmid "tm_20260310_0001"
node {baseDir}/scripts/cli.mjs export --queryId "qry_20260310_0008" --tmids "tm_001,tm_002"
node {baseDir}/scripts/cli.mjs export-status --jobId "exp_20260310_0003"
node {baseDir}/scripts/cli.mjs modules
```

## 对话策略

### 1. 未绑定优先引导绑定

若 `capabilities`、`search`、`detail`、`export`、`modules` 任一响应表明用户未绑定：

- 先调用 `bind-help`
- 告诉用户绑定网址
  中国区域优先使用 `https://openclaw.zqip.cn`
  国外区域优先使用 `https://openclaw.zqaiip.com`
- 告诉用户绑定步骤
- 告诉用户完成绑定后再继续执行查询或导出
- 不执行收费动作

### 2. 查询 / 详情 / 导出前先提示预计扣点

在发起收费动作前先提示用户：

- 查询前提示：预计消耗 1 点
- 详情前提示：预计消耗 1 点
- 导出前按条数提示预计扣点

导出预计扣点规则：

- 1~10 条：1 点
- 11~50 条：3 点
- 51~100 条：5 点
- 101~500 条：10 点

### 3. 点数不足时的处理

若平台返回点数不足：

- 明确说明“点数不足”
- 引导用户前往平台充值
- 不伪造结果
- 不重复重试收费接口

### 4. 模块未开通时的处理

若平台返回模块未开通：

- 明确说明具体模块名
- 引导用户购买对应模块
- 不绕过平台模块限制

涉及模块可能包括：

- 续展监控
- 通知提醒
- 微信端
- 公司页 / 客户页
- 外部监控
- 白牌门户

### 5. 输出风格

- 先给摘要，再给必要明细
- 查询结果过多时，优先展示前几条并提示可继续翻页
- 导出任务优先展示任务状态、预计扣点、导出文件获取方式
- 对任何不确定的信息直接说明“以平台返回为准”

## 推荐工作流

### 查询

1. 必要时先 `capabilities`
2. 提示“预计消耗 1 点”
3. 执行 `search --query "<关键词>" --page 1`
4. 摘要展示结果与剩余点数
5. 如用户要求翻页，继续用 `search --query "<关键词>" --page N`

### 详情

1. 提示“预计消耗 1 点”
2. 执行 `detail --tmid "<tmid>"`
3. 返回商标名称、申请人、国际分类、申请号、注册号、状态、有效期等核心信息

### 导出

1. 先确认用户要导出的条数
2. 按条数提示预计扣点
3. 执行 `export --queryId "<queryId>" --tmids "<comma-separated>"`
4. 返回导出任务号、任务状态、预计或实际扣点
5. 如需查询导出状态，执行 `export-status --jobId "<exportJobId>"`
6. 若状态为 `processing`，稍后再次查询；若为 `completed`，返回下载链接

### 模块 / 余额 / 能力

1. 执行 `capabilities` 或 `modules`
2. 说明余额、可用模块、受限动作
3. 若有未开通模块，明确指出模块名和用途
