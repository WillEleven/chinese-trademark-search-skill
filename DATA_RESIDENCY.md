# Data Residency / 数据驻留

**Effective Date:** 2026-03-28
**Last Updated:** 2026-03-28

---

## English

### Overview

The platform operates two independent regional deployments. Each region has its own data storage, processing infrastructure, and applicable legal framework. **Databases are not shared between regions.**

### Region 1: China Mainland

| Attribute | Detail |
|---|---|
| **Domain** | `zqip.cn` |
| **Data Storage Location** | Mainland China |
| **Applicable Data Protection Law** | Personal Information Protection Law of the People's Republic of China (PIPL) |
| **Intended Users** | Users located in mainland China |
| **Regulatory Authority** | Cyberspace Administration of China (CAC) |

Data stored in the China mainland region is subject to PIPL and related regulations, including the Data Security Law (DSL) and the Cybersecurity Law (CSL). Cross-border data transfer from this region is subject to regulatory approval mechanisms as required by Chinese law.

### Region 2: Global (Hong Kong SAR)

| Attribute | Detail |
|---|---|
| **Domain** | `zqaiip.com` |
| **Data Storage Location** | Hong Kong Special Administrative Region, China |
| **Applicable Data Protection Law** | Personal Data (Privacy) Ordinance (PDPO), Cap. 486 |
| **Intended Users** | Users located outside mainland China |
| **Regulatory Authority** | Office of the Privacy Commissioner for Personal Data (PCPD) |

Data stored in the Hong Kong SAR region is governed by the PDPO. This region is designed to serve international users, including those in the European Union, United States, Japan, and other jurisdictions.

### Database Isolation

- The China mainland region and the Global (Hong Kong SAR) region operate **completely independent databases**.
- User accounts, query history, trademark data caches, and all associated metadata are **not synchronized, mirrored, or shared** between regions.
- Choosing a region at registration determines where your data resides for the lifetime of that account.

### Recommendation for EU Users

Users located in the European Union are recommended to use the **Global (Hong Kong SAR) region** (`zqaiip.com`). While Hong Kong has not received an adequacy decision from the European Commission, the platform implements Standard Contractual Clauses (SCCs) for EU-to-HK data transfers. See [GDPR_COMPLIANCE.md](GDPR_COMPLIANCE.md) for details.

### Right to Erasure

Users may request erasure of their personal data in accordance with applicable law. To submit an erasure request, contact:

**privacy@zqaiip.com**

Please include your user ID, registered email, and the region (mainland China or Hong Kong SAR) in your request. Erasure requests will be processed within 30 days, subject to any legal retention obligations.

---

## 中文

### 概述

本平台运营两个独立的区域部署。每个区域拥有独立的数据存储、处理基础设施和适用法律框架。**两个区域之间的数据库不共享。**

### 区域一：中国大陆

| 属性 | 详情 |
|---|---|
| **域名** | `zqip.cn` |
| **数据存储位置** | 中国大陆 |
| **适用数据保护法律** | 《中华人民共和国个人信息保护法》（PIPL） |
| **目标用户** | 位于中国大陆的用户 |
| **监管机构** | 国家互联网信息办公室（CAC） |

中国大陆区域存储的数据受 PIPL 及相关法规约束，包括《数据安全法》（DSL）和《网络安全法》（CSL）。从该区域进行跨境数据传输须遵守中国法律规定的监管审批机制。

### 区域二：全球（中国香港特别行政区）

| 属性 | 详情 |
|---|---|
| **域名** | `zqaiip.com` |
| **数据存储位置** | 中国香港特别行政区 |
| **适用数据保护法律** | 《个人资料（隐私）条例》（PDPO），第 486 章 |
| **目标用户** | 位于中国大陆以外的用户 |
| **监管机构** | 个人资料私隐专员公署（PCPD） |

香港特别行政区区域存储的数据受 PDPO 管辖。该区域旨在服务国际用户，包括欧盟、美国、日本及其他司法管辖区的用户。

### 数据库隔离

- 中国大陆区域与全球（香港特别行政区）区域运营**完全独立的数据库**。
- 用户账户、查询历史、商标数据缓存及所有相关元数据**不会**在区域之间同步、镜像或共享。
- 注册时选择的区域将决定该账户存续期间的数据驻留位置。

### 对欧盟用户的建议

位于欧盟的用户建议使用**全球（香港特别行政区）区域**（`zqaiip.com`）。尽管香港尚未获得欧盟委员会的充分性认定，本平台针对欧盟至香港的数据传输实施了标准合同条款（SCCs）。详情请参阅 [GDPR_COMPLIANCE.md](GDPR_COMPLIANCE.md)。

### 数据删除权

用户可依据适用法律请求删除其个人数据。如需提交删除请求，请联系：

**privacy@zqaiip.com**

请在请求中注明您的用户 ID、注册邮箱及所属区域（中国大陆或香港特别行政区）。删除请求将在 30 天内处理，但须遵守法定数据保留义务。
