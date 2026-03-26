# 中国商标查询 Skill

这是一个面向 OpenClaw / ClawHub 的公开 Skill，用于连接“自有商标 SaaS 平台 API”，帮助用户完成中国商标查询、翻页、详情查看、导出、点数检查、模块查看与绑定引导。

本 Skill 不直连上游商标数据商接口，也不要求用户提供上游账号密码。用户只需要配置自己在平台中的用户级 token。

## 适用场景

- 查询企业或个人名下商标
- 查看商标详情
- 翻页浏览查询结果
- 发起导出任务
- 查看点数余额与能力限制
- 查看已开通增值模块
- 在未绑定时获取绑定说明

## 安装到 OpenClaw

可用任一方式安装：

1. 将整个 `chinese-trademark-search-skill/` 文件夹导入到 OpenClaw 的本地 Skill 目录
2. 或在 ClawHub 中上传 / 发布该 Skill 文件夹
3. 在 OpenClaw 中选择该 Skill，并确认运行命令为：

```bash
node {baseDir}/scripts/cli.mjs help
```

## 环境变量配置

在 OpenClaw 或宿主环境中配置以下变量：

### `CHINA_TM_PLATFORM_BASE_URL`

自有商标 SaaS 平台 API 基础地址，例如：

```bash
CHINA_TM_PLATFORM_BASE_URL=https://tm.example.cn
```

### `CHINA_TM_USER_TOKEN`

平台用户级 token，用于代表当前用户访问平台开放接口。

```bash
CHINA_TM_USER_TOKEN=tmu_xxx_your_user_token
```

### `CHINA_TM_TIMEOUT_MS`

请求超时时间，单位毫秒。建议 10000 到 30000。

```bash
CHINA_TM_TIMEOUT_MS=15000
```

### `CHINA_TM_SKILL_CHANNEL`

渠道标识。默认建议使用 `clawhub`。

```bash
CHINA_TM_SKILL_CHANNEL=clawhub
```

## 注册与绑定入口

- 中国区域访问：`https://openclaw.zqip.cn`
- 国外区域访问：`https://openclaw.zqaiip.com`

建议用户根据所在区域选择对应域名进行注册和绑定。中国区域使用大陆节点，国外区域使用中国香港节点。
平台侧也可以根据用户 IP 或区域策略自动推荐更合适的注册入口，但最终以用户可稳定访问的域名为准。

## 体验点说明

首次绑定后，符合条件的新组织可能获得 50 点体验点。是否发放、何时发放、是否仍在活动期，以平台返回为准。

## 点数规则

当前默认计费说明如下：

- 查询：1 点
- 翻页：1 点
- 详情：1 点
- 导出 1~10 条：1 点
- 导出 11~50 条：3 点
- 导出 51~100 条：5 点
- 导出 101~500 条：10 点

使用前请以平台接口返回的实际计费提示为准。

## 增值模块

平台可能按模块授权控制部分能力。典型模块包括：

- 续展监控
- 通知提醒
- 微信端
- 公司页 / 客户页
- 外部监控
- 白牌门户

如接口返回模块未开通，请前往平台购买对应模块后再使用。

## 本 Skill 做什么

- 调用平台 `capabilities` 查看绑定、点数、能力状态
- 调用平台 `search` 执行商标查询
- 调用平台 `detail` 查看商标详情
- 调用平台 `export` 发起导出
- 调用平台 `modules` 查看模块能力
- 调用平台 `bind-help` 获取绑定指引

## 本 Skill 不做什么

- 不保存私有密钥
- 不连接上游商标数据商
- 不向用户索要上游账号密码
- 不伪造查询结果
- 不绕过平台点数或模块限制

## 运行示例

```bash
node scripts/cli.mjs help
node scripts/cli.mjs bind-help
node scripts/cli.mjs capabilities
node scripts/cli.mjs search --query "华源科技" --page 1
node scripts/cli.mjs detail --tmid "tm_20260310_0001"
node scripts/cli.mjs export --queryId "qry_20260310_0008" --tmids "tm_001,tm_002"
node scripts/cli.mjs export-status --jobId "exp_20260310_0003"
node scripts/cli.mjs modules
```

## 返回格式

CLI 统一输出 JSON 到标准输出，便于 OpenClaw 解析。

成功示例：

```json
{
  "success": true,
  "command": "search",
  "data": {
    "queryId": "qry_20260310_0008",
    "results": []
  }
}
```

失败示例：

```json
{
  "success": false,
  "error": {
    "code": "POINTS_NOT_ENOUGH",
    "message": "点数不足"
  }
}
```
