# Proprietary Platform API Contract

This document describes the open contract for the "proprietary trademark SaaS platform API," not the upstream trademark data provider interface contract.

All requests are sent by the Skill to the platform API, which then handles binding, points, modules, auditing, and upstream data access internally.

## General Conventions

### Base URL

```text
{CHINA_TM_PLATFORM_BASE_URL}
```

### Authorization Header

```http
Authorization: Bearer {CHINA_TM_USER_TOKEN}
```

### Content-Type

```http
Content-Type: application/json
```

---

## 1. GET /v1/openclaw/capabilities

Retrieve the current user's binding status, points balance, metering hints, and available capabilities.

### Request Example

```http
GET /v1/openclaw/capabilities HTTP/1.1
Authorization: Bearer tmu_demo_user_token
```

### Response Example

```json
{
  "success": true,
  "user": {
    "userId": "usr_20260310_001",
    "organizationId": "org_20260310_001",
    "organizationName": "Chongqing Huayuan Intellectual Property Services Co., Ltd.",
    "bound": true
  },
  "wallet": {
    "totalPoints": 86,
    "giftedPoints": 18,
    "paidPoints": 68
  },
  "metering": {
    "search": { "estimatedPoints": 1, "label": "Search costs an estimated 1 point" },
    "page": { "estimatedPoints": 1, "label": "Paging costs an estimated 1 point" },
    "detail": { "estimatedPoints": 1, "label": "Detail lookup costs an estimated 1 point" },
    "exportTiers": [
      { "min": 1, "max": 10, "points": 1 },
      { "min": 11, "max": 50, "points": 3 },
      { "min": 51, "max": 100, "points": 5 },
      { "min": 101, "max": 500, "points": 10 }
    ]
  },
  "featureEntitlements": [
    { "code": "renew_monitor", "name": "Renewal Monitoring", "enabled": true },
    { "code": "notifications", "name": "Notifications", "enabled": true },
    { "code": "miniapp", "name": "WeChat Mini Program", "enabled": false }
  ]
}
```

---

## 2. POST /v1/openclaw/trademarks/search

Execute a trademark search.

### Request Example

```json
{
  "query": "Chongqing Huayuan Technology Co., Ltd.",
  "page": 1,
  "pageSize": 50,
  "channel": "clawhub"
}
```

### Response Example

```json
{
  "success": true,
  "queryId": "qry_20260310_0008",
  "query": "Chongqing Huayuan Technology Co., Ltd.",
  "page": 1,
  "pageSize": 50,
  "total": 3,
  "estimatedPoints": 1,
  "chargedPoints": 1,
  "remainingPoints": 85,
  "results": [
    {
      "tmid": "tm_20260310_0001",
      "markName": "华源智造",
      "applicationNo": "2024101234567",
      "registrationNo": "78123456",
      "applicantName": "Chongqing Huayuan Technology Co., Ltd.",
      "classNo": 9,
      "className": "Scientific Instruments",
      "status": "Registered",
      "applyDate": "2024-01-18",
      "exclusivePeriodEnd": "2035-05-27"
    },
    {
      "tmid": "tm_20260310_0002",
      "markName": "华源云盾",
      "applicationNo": "2024101234789",
      "registrationNo": "78127890",
      "applicantName": "Chongqing Huayuan Technology Co., Ltd.",
      "classNo": 42,
      "className": "Web Services",
      "status": "Preliminary Announcement",
      "applyDate": "2024-02-06",
      "exclusivePeriodEnd": null
    },
    {
      "tmid": "tm_20260310_0003",
      "markName": "HYMATRIX",
      "applicationNo": "2024101234999",
      "registrationNo": "78129999",
      "applicantName": "Chongqing Huayuan Technology Co., Ltd.",
      "classNo": 35,
      "className": "Advertising & Sales",
      "status": "Registered",
      "applyDate": "2024-02-20",
      "exclusivePeriodEnd": "2035-06-08"
    }
  ]
}
```

### Insufficient Points Example

```json
{
  "success": false,
  "error": {
    "code": "POINTS_NOT_ENOUGH",
    "message": "Insufficient points. Please top up before searching."
  }
}
```

### Not Bound Example

```json
{
  "success": false,
  "error": {
    "code": "BIND_REQUIRED",
    "message": "This account has not completed platform binding."
  }
}
```

---

## 3. GET /v1/openclaw/trademarks/{tmid}

Retrieve details for a specific trademark.

### Request Example

```http
GET /v1/openclaw/trademarks/tm_20260310_0001 HTTP/1.1
Authorization: Bearer tmu_demo_user_token
```

### Response Example

```json
{
  "success": true,
  "estimatedPoints": 1,
  "chargedPoints": 1,
  "remainingPoints": 84,
  "trademark": {
    "tmid": "tm_20260310_0001",
    "markName": "华源智造",
    "applicationNo": "2024101234567",
    "registrationNo": "78123456",
    "applicantName": "Chongqing Huayuan Technology Co., Ltd.",
    "agentName": "Chongqing Huayuan Intellectual Property Services Co., Ltd.",
    "classNo": 9,
    "className": "Scientific Instruments",
    "status": "Registered",
    "applyDate": "2024-01-18",
    "announcementDate": "2025-02-27",
    "registrationDate": "2025-05-28",
    "exclusivePeriodStart": "2025-05-28",
    "exclusivePeriodEnd": "2035-05-27",
    "goods": [
      "Downloadable computer software",
      "Recorded computer programs",
      "Interface cards for smart terminals"
    ],
    "riskSummary": {
      "renewalStatus": "Renewal period is far away",
      "monitorSupported": true
    }
  }
}
```

---

## 4. POST /v1/openclaw/trademarks/export

Create an export job.

### Request Example

```json
{
  "queryId": "qry_20260310_0008",
  "selectedTmids": [
    "tm_20260310_0001",
    "tm_20260310_0002",
    "tm_20260310_0003"
  ],
  "channel": "clawhub"
}
```

### Response Example

```json
{
  "success": true,
  "exportJobId": "exp_20260310_0003",
  "status": "queued",
  "selectedCount": 3,
  "estimatedPoints": 1,
  "chargedPoints": 1,
  "remainingPoints": 83,
  "message": "Export job created. Please check export status shortly."
}
```

### Module Not Enabled Example

```json
{
  "success": false,
  "error": {
    "code": "FEATURE_NOT_ENABLED",
    "message": "Module not enabled: Company Page / Client Page"
  }
}
```

---

## 5. GET /v1/openclaw/exports/{exportJobId}

Check export job status.

### Request Example

```http
GET /v1/openclaw/exports/exp_20260310_0003 HTTP/1.1
Authorization: Bearer tmu_demo_user_token
```

### Response Example

```json
{
  "success": true,
  "exportJobId": "exp_20260310_0003",
  "status": "completed",
  "fileName": "Chongqing_Huayuan_Technology_trademark_export_2026-03-10.csv",
  "downloadUrl": "https://tm.example.cn/downloads/exp_20260310_0003.csv",
  "createdAt": "2026-03-10T09:18:00+08:00",
  "completedAt": "2026-03-10T09:18:12+08:00"
}
```

### Processing Example

```json
{
  "success": true,
  "exportJobId": "exp_20260310_0003",
  "status": "processing",
  "fileName": null,
  "downloadUrl": null,
  "createdAt": "2026-03-10T09:18:00+08:00",
  "completedAt": null
}
```

---

## 6. GET /v1/openclaw/modules

Retrieve available modules for the current user or organization.

### Request Example

```http
GET /v1/openclaw/modules HTTP/1.1
Authorization: Bearer tmu_demo_user_token
```

### Response Example

```json
{
  "success": true,
  "modules": [
    {
      "code": "renew_monitor",
      "name": "Renewal Monitoring",
      "enabled": true,
      "description": "Monitor trademark expiration and renewal risks"
    },
    {
      "code": "notifications",
      "name": "Notifications",
      "enabled": true,
      "description": "Enable email, SMS, or in-app notification capabilities"
    },
    {
      "code": "miniapp",
      "name": "WeChat Mini Program",
      "enabled": false,
      "description": "WeChat Mini Program access capability"
    },
    {
      "code": "companies_page",
      "name": "Company Page / Client Page",
      "enabled": false,
      "description": "Client company perspective for trademark aggregation and operations"
    },
    {
      "code": "external_monitor",
      "name": "External Monitoring",
      "enabled": false,
      "description": "Competitor and target company external monitoring"
    },
    {
      "code": "white_label",
      "name": "White-Label Portal",
      "enabled": false,
      "description": "Branded portal and white-label configuration capability"
    }
  ]
}
```

---

## 7. GET /v1/openclaw/bind/help

Retrieve binding instructions.

### Request Example

```http
GET /v1/openclaw/bind/help HTTP/1.1
Authorization: Bearer tmu_demo_user_token
```

### Response Example

```json
{
  "success": true,
  "bound": false,
  "bindUrl": "https://openclaw.zqip.cn",
  "bindUrls": {
    "china": "https://openclaw.zqip.cn",
    "global": "https://openclaw.zqaiip.com"
  },
  "recommendedRegion": "china",
  "steps": [
    "Visit the OpenClaw domain appropriate for your region and register an account",
    "Users in China should use openclaw.zqip.cn; users outside China should use openclaw.zqaiip.com",
    "The platform may automatically recommend the most suitable domain based on IP or region",
    "Navigate to the OpenClaw binding page",
    "Confirm the organization associated with your account",
    "Generate or paste your user-level token",
    "After completing binding, return to OpenClaw and retry"
  ],
  "trialNotice": "After initial binding, eligible new organizations may receive 50 trial points"
}
```

---

## Error Codes Reference

| Code | Meaning |
|---|---|
| `ENV_MISSING` | Required environment variable is missing |
| `HTTPS_REQUIRED` | Base URL must use HTTPS |
| `BIND_REQUIRED` | Platform account binding is required |
| `POINTS_NOT_ENOUGH` | Insufficient points |
| `FEATURE_NOT_ENABLED` | Module is not enabled |
| `UNAUTHORIZED` | Token is invalid or expired |
| `FORBIDDEN` | Current user does not have access to this resource |
| `RATE_LIMITED` | Too many requests |
| `UPSTREAM_TIMEOUT` | Platform API timed out |
| `SERVER_ERROR` | Platform internal error |
| `EXPORT_TIMEOUT` | Export status polling exceeded maximum attempts |
