---
name: chinese_trademark_search_skill
description: Connects to the Chinese trademark search hosted platform API, handling trademark search, details, export, points and module checks, and binding guidance. Designed for use within OpenClaw / ClawHub via a local Node CLI skill invocation.
homepage: https://openclaw.zqip.cn
metadata: {"skillKey":"chinese_trademark_search_skill","homepage":"https://openclaw.zqip.cn","tags":["china","trademark","商标","search","openclaw","clawhub"]}
---

# Chinese Trademark Search Skill

This Skill connects to a "proprietary trademark SaaS platform API" within OpenClaw / ClawHub, enabling Chinese trademark search, detail viewing, export, module inspection, points checking, and binding guidance.

## Connection Boundaries

- This Skill only connects to the hosted platform API; it does not connect directly to upstream trademark data providers.
- It never asks users for upstream trademark API credentials.
- Users only need to configure a platform-level user token.
- If a user has not yet bound their platform account or organization, guide them through binding first, then proceed with search, detail, export, and other actions.
- Never fabricate trademark data; if nothing is found, state that clearly.
- Prefer summary display to avoid overly long output at once.

## OpenClaw Invocation

OpenClaw should invoke this Skill via the local Node CLI:

```bash
node {baseDir}/scripts/cli.mjs help
node {baseDir}/scripts/cli.mjs bind-help
node {baseDir}/scripts/cli.mjs capabilities
node {baseDir}/scripts/cli.mjs search --query "华源科技" --page 1 --pageSize 50
node {baseDir}/scripts/cli.mjs detail --tmid "tm_20260310_0001"
node {baseDir}/scripts/cli.mjs export --queryId "qry_20260310_0008" --tmids "tm_001,tm_002"
node {baseDir}/scripts/cli.mjs export-status --jobId "exp_20260310_0003"
node {baseDir}/scripts/cli.mjs modules
```

## Conversation Strategy

### 1. Prioritize Binding Guidance When Unbound

If any of `capabilities`, `search`, `detail`, `export`, or `modules` responses indicate the user is not bound:

- First call `bind-help`
- Tell the user the binding URL
  - For users in China, prefer `https://openclaw.zqip.cn`
  - For users outside China, prefer `https://openclaw.zqaiip.com`
- Explain the binding steps
- Tell the user to complete binding before continuing with search or export
- Do not execute any cost-bearing actions

### 2. Notify Estimated Point Cost Before Search / Detail / Export

Before initiating any cost-bearing action, inform the user:

- Before search: estimated cost of 1 point
- Before detail: estimated cost of 1 point
- Before export: estimated cost based on item count

Export estimated point cost tiers:

- 1-10 items: 1 point
- 11-50 items: 3 points
- 51-100 items: 5 points
- 101-500 items: 10 points

### 3. Handling Insufficient Points

If the platform returns an insufficient points error:

- Clearly state "insufficient points"
- Guide the user to the platform to top up
- Never fabricate results
- Never retry cost-bearing API calls repeatedly

### 4. Handling Disabled Modules

If the platform returns a module-not-enabled error:

- Clearly state the specific module name
- Guide the user to purchase the corresponding module
- Never bypass platform module restrictions

Modules that may be involved:

- Renewal Monitoring
- Notifications
- WeChat Mini Program
- Company Page / Client Page
- External Monitoring
- White-Label Portal

### 5. Output Style

- Provide a summary first, then necessary details
- When there are too many search results, display the first few and prompt that the user can continue paging
- For export jobs, prioritize showing job status, estimated points, and how to retrieve the export file
- For any uncertain information, state "subject to platform response"

## Recommended Workflows

### Search

1. If needed, first call `capabilities`
2. Inform the user: "Estimated cost: 1 point"
3. Execute `search --query "<keyword>" --page 1`
4. Display a summary of results and remaining points
5. If the user requests the next page, continue with `search --query "<keyword>" --page N`

### Detail

1. Inform the user: "Estimated cost: 1 point"
2. Execute `detail --tmid "<tmid>"`
3. Return core information: trademark name, applicant, international class, application number, registration number, status, validity period, etc.

### Export

1. First confirm how many items the user wants to export
2. Inform estimated point cost based on item count
3. Execute `export --queryId "<queryId>" --tmids "<comma-separated>"`
4. Return the export job ID, job status, estimated or actual point charge
5. To check export status, execute `export-status --jobId "<exportJobId>"`
6. If status is `processing`, check again later; if `completed`, return the download link

### Modules / Balance / Capabilities

1. Execute `capabilities` or `modules`
2. Describe the balance, available modules, and restricted actions
3. If there are disabled modules, clearly identify the module name and its purpose

## Legal Disclaimer

Trademark search results are for reference only, not legal advice. Users should consult a qualified trademark attorney or agent for legal guidance.
