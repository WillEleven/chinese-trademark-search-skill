# Security Notice

## 公开 Skill 说明

这是一个公开 Skill，适合发布到 ClawHub、代码仓库或公开分发渠道。

## 不包含私有密钥

本 Skill 不包含以下任何敏感信息：

- 平台管理员密钥
- 上游商标数据商账号密码
- 上游商标接口私钥
- 用户个人 token
- 平台数据库凭据

## 用户应使用的平台 token

用户应配置的是“自有平台的用户级 token”，而不是上游商标接口密钥。

推荐环境变量：

- `CHINA_TM_PLATFORM_BASE_URL`
- `CHINA_TM_USER_TOKEN`
- `CHINA_TM_TIMEOUT_MS`
- `CHINA_TM_SKILL_CHANNEL`

## 安全使用建议

- 不要把 token 写进 prompt
- 不要把 token 发到 issue
- 不要把 token 放进截图
- 不要把 token 硬编码到 Skill 文件中
- 不要把 token 提交到 Git 仓库

## 平台侧建议

平台应支持以下安全能力：

- token 吊销
- token 轮换
- token 过期控制
- 用户级权限隔离
- 操作日志审计
- 限流与异常访问检测

## 日志与输出要求

本 Skill 的 CLI 不应打印 token，也不应在错误堆栈中回显 Authorization 头或完整请求体中的敏感字段。

## 泄露处理建议

若怀疑 token 泄露：

1. 立即在平台吊销该 token
2. 重新生成新 token
3. 检查最近访问日志
4. 如有必要，通知相关用户轮换凭据
