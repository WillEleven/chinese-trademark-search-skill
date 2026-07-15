# Changelog

## [1.1.0] - 2026-07-14
### Changed
- 统一计费口径：详情每条 2 点（同一商标已购详情后再次查看不重复扣点）；新注册组织赠送 10 点体验点（30 天有效）；点价 ¥1 = 5 点；导出最高档改为 101 条及以上 = 10 点
- 平台入口统一为 https://tm.zhengquai.com（注册 /register、API Key 生成 /settings、充值 /billing），移除旧双域名表述
- 翻页暂不支持：每次查询固定返回第一页前 50 条，page 大于 1 返回 PAGINATION_NOT_SUPPORTED 且不扣点
### Added
- 幂等请求头 X-OC-Request-Id（8-64 位，[A-Za-z0-9_-]），网络重试不重复扣点（CLI 自动处理）
- 失败自动退点说明：查询失败返回 500 SERVER_ERROR 含 refundedPoints；详情上游失败返回 502 UPSTREAM_ERROR；导出任务创建失败自动退点
- 点数不足返回 HTTP 402，body 含 rechargeUrl（https://tm.zhengquai.com/billing）

## [1.0.0] - 2026-03-28
### Added
- Initial release
- Trademark search, detail, export capabilities
- OpenAI agents.yaml integration
- CLI tool for debugging and testing
- Bilingual documentation (Chinese + English)
- GDPR, CCPA, OFAC compliance documentation
- Data residency disclosure
- Legal disclaimer
