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

## Export Control and Sanctions / 出口管制与制裁

This Skill and the associated platform are subject to US Export Administration Regulations (EAR) and OFAC sanctions programs. Access is prohibited from sanctioned jurisdictions (Iran, North Korea, Syria, Cuba, Crimea) and by individuals or entities on the OFAC SDN List.

The platform may implement IP-based geoblocking and automated sanctions screening to enforce compliance. Violations may result in immediate account termination and referral to authorities.

For full details, see [SANCTIONS_COMPLIANCE.md](SANCTIONS_COMPLIANCE.md).

本 Skill 及相关平台受美国出口管理条例（EAR）和 OFAC 制裁计划约束。禁止从受制裁司法管辖区（伊朗、朝鲜、叙利亚、古巴、克里米亚）及 OFAC SDN 名单上的个人或实体访问。详情请参阅 [SANCTIONS_COMPLIANCE.md](SANCTIONS_COMPLIANCE.md)。

## Data Residency Architecture / 数据驻留架构

The platform operates two completely independent regional deployments:

| Region | Domain | Data Location | Applicable Law |
|---|---|---|---|
| China Mainland | `zqip.cn` | Mainland China | PIPL, DSL, CSL |
| Global | `zqaiip.com` | Hong Kong SAR | PDPO (Cap. 486) |

Key security properties of this architecture:

- **Database isolation:** No data synchronization, mirroring, or sharing between regions.
- **Independent infrastructure:** Each region runs on separate infrastructure with independent access controls.
- **Regional compliance:** Each deployment is configured to comply with its applicable data protection framework.
- **User choice:** Users select their region at registration; data residency is determined for the account lifetime.

For full details, see [DATA_RESIDENCY.md](DATA_RESIDENCY.md).

两个区域部署完全独立，数据库不共享。每个区域运行在独立基础设施上，具有独立的访问控制。详情请参阅 [DATA_RESIDENCY.md](DATA_RESIDENCY.md)。

## GDPR Cross-Border Mechanisms / GDPR 跨境传输机制

For EU/EEA users accessing the Global region (`zqaiip.com`), personal data is stored in Hong Kong SAR. As Hong Kong has not received an adequacy decision from the European Commission, the following safeguards are in place:

- **Standard Contractual Clauses (SCCs):** Commission Implementing Decision (EU) 2021/914, supplemented by a Transfer Impact Assessment (TIA).
- **Encryption:** TLS 1.2+ in transit, AES-256 at rest.
- **Access controls:** Data access restricted to authorized personnel with role-based permissions.
- **Sub-processor management:** DPAs with all sub-processors; 30-day advance notice of changes.
- **Data Processing Agreement (DPA):** Available on request for enterprise customers (contact: legal@zqaiip.com).

For full GDPR compliance details, see [GDPR_COMPLIANCE.md](GDPR_COMPLIANCE.md).

针对访问全球区域（`zqaiip.com`）的欧盟/EEA 用户，个人数据存储在中国香港特别行政区。平台通过标准合同条款（SCCs）及传输影响评估（TIA）保障跨境数据传输合规。详情请参阅 [GDPR_COMPLIANCE.md](GDPR_COMPLIANCE.md)。
