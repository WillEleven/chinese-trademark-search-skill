#!/usr/bin/env node

/**
 * Chinese trademark search skill CLI.
 *
 * Design goals:
 * - Public skill safe for distribution
 * - No third-party dependencies
 * - Uses platform user token only
 * - Never prints token
 * - Always returns structured JSON to stdout
 */

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_CHANNEL = 'clawhub';
const DEFAULT_PAGE_SIZE = 50;
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAYS_MS = [1000, 2000];
const RETRYABLE_CODES = new Set(['SERVER_ERROR', 'UPSTREAM_TIMEOUT']);
const EXPORT_POLL_MAX_ATTEMPTS = 60;

/**
 * Bilingual error messages.
 */
const MESSAGES = {
  zh: {
    envMissingBase: '缺少环境变量 CHINA_TM_PLATFORM_BASE_URL',
    envMissingToken: '缺少环境变量 CHINA_TM_USER_TOKEN',
    httpsRequired: 'CHINA_TM_PLATFORM_BASE_URL 必须使用 HTTPS（设置 ALLOW_HTTP=true 可绕过）',
    unknownCommand: (cmd) => `未知命令: ${cmd}`,
    queryEmpty: 'search --query 不能为空',
    queryTooLong: 'search --query 最长 200 个字符',
    tmidEmpty: '--tmid 不能为空',
    pageSizeRange: '--pageSize 必须在 1~100 之间',
    searchMissingQuery: 'search 缺少 --query 参数',
    detailMissingTmid: 'detail 缺少 --tmid 参数',
    exportMissingQueryId: 'export 缺少 --queryId 参数',
    exportMissingTmids: 'export 缺少 --tmids 参数',
    exportTmidsEmpty: 'export 的 --tmids 不能为空',
    exportStatusMissingJobId: 'export-status 缺少 --jobId 参数',
    exportTimeout: '导出任务轮询超时，已超过最大尝试次数',
    requestTimeout: (ms) => `请求超时，已超过 ${ms}ms`,
    networkError: '平台接口不可达',
    positiveInteger: (field) => `${field} 必须是正整数`,
    badRequest: '请求参数错误',
    unauthorized: '认证失败，请检查平台 token 是否有效',
    forbidden: '当前用户无权访问该平台资源',
    notFound: '请求的资源不存在',
    upstreamTimeout: '平台处理超时',
    rateLimited: '请求过于频繁，请稍后再试',
    serverError: '平台内部错误，请稍后重试',
    httpError: (status) => `请求失败，HTTP ${status}`,
    unknownError: '发生未知错误',
    invalidJson: '平台返回了无法解析的 JSON',
    helpSummary: '中国商标查询 Skill CLI',
    legalDisclaimer: '商标查询结果仅供参考，不构成法律意见。',
    noteSearch: '查询前预计消耗 1 点',
    noteDetail: '详情前预计消耗 1 点',
    noteExport: '导出按条数阶梯扣点',
    noteBind: '未绑定时请先执行 bind-help',
    retrying: (attempt, delay) => `第 ${attempt} 次重试，等待 ${delay}ms ...`,
  },
  en: {
    envMissingBase: 'Missing environment variable CHINA_TM_PLATFORM_BASE_URL',
    envMissingToken: 'Missing environment variable CHINA_TM_USER_TOKEN',
    httpsRequired: 'CHINA_TM_PLATFORM_BASE_URL must use HTTPS (set ALLOW_HTTP=true to bypass)',
    unknownCommand: (cmd) => `Unknown command: ${cmd}`,
    queryEmpty: 'search --query must not be empty',
    queryTooLong: 'search --query must be at most 200 characters',
    tmidEmpty: '--tmid must not be empty',
    pageSizeRange: '--pageSize must be between 1 and 100',
    searchMissingQuery: 'search requires --query argument',
    detailMissingTmid: 'detail requires --tmid argument',
    exportMissingQueryId: 'export requires --queryId argument',
    exportMissingTmids: 'export requires --tmids argument',
    exportTmidsEmpty: 'export --tmids must not be empty',
    exportStatusMissingJobId: 'export-status requires --jobId argument',
    exportTimeout: 'Export polling timed out after maximum attempts',
    requestTimeout: (ms) => `Request timed out after ${ms}ms`,
    networkError: 'Platform API is unreachable',
    positiveInteger: (field) => `${field} must be a positive integer`,
    badRequest: 'Bad request parameters',
    unauthorized: 'Authentication failed, please check your platform token',
    forbidden: 'Current user does not have permission to access this resource',
    notFound: 'The requested resource does not exist',
    upstreamTimeout: 'Platform processing timed out',
    rateLimited: 'Too many requests, please try again later',
    serverError: 'Platform internal error, please try again later',
    httpError: (status) => `Request failed, HTTP ${status}`,
    unknownError: 'An unknown error occurred',
    invalidJson: 'Platform returned unparsable JSON',
    helpSummary: 'Chinese Trademark Search Skill CLI',
    legalDisclaimer: 'Trademark search results are for reference only, not legal advice.',
    noteSearch: 'Search costs an estimated 1 point',
    noteDetail: 'Detail lookup costs an estimated 1 point',
    noteExport: 'Export costs points based on item count tiers',
    noteBind: 'If not bound, run bind-help first',
    retrying: (attempt, delay) => `Retry #${attempt}, waiting ${delay}ms ...`,
  }
};

/**
 * Resolve the current language.
 */
function resolveLang(args) {
  const langVal = getOptionValue(args, '--lang');
  if (langVal === 'en') return 'en';
  return 'zh';
}

/**
 * Get message bundle for current language.
 */
function msg(lang) {
  return MESSAGES[lang] || MESSAGES.zh;
}

main().catch((error) => {
  writeError(normalizeUnknownError(error));
});

/**
 * Main entry point.
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const lang = resolveLang(args);
  const m = msg(lang);

  if (command === 'help') {
    return writeJson({
      success: true,
      command: 'help',
      data: {
        summary: m.helpSummary,
        commands: [
          {
            name: 'help',
            usage: 'node scripts/cli.mjs help',
            description: lang === 'en' ? 'Show command help' : '输出命令帮助'
          },
          {
            name: 'bind-help',
            usage: 'node scripts/cli.mjs bind-help',
            description: lang === 'en' ? 'Read platform binding guide' : '读取平台绑定指引'
          },
          {
            name: 'capabilities',
            usage: 'node scripts/cli.mjs capabilities',
            description: lang === 'en' ? 'Read binding status, points balance, metering hints, and capabilities' : '读取绑定状态、点数余额、计费提示与能力信息'
          },
          {
            name: 'search',
            usage: 'node scripts/cli.mjs search --query "华源科技" --page 1 --pageSize 50',
            description: lang === 'en' ? 'Execute trademark search' : '执行商标查询'
          },
          {
            name: 'detail',
            usage: 'node scripts/cli.mjs detail --tmid "tm_20260310_0001"',
            description: lang === 'en' ? 'Read trademark details' : '读取指定商标详情'
          },
          {
            name: 'export',
            usage: 'node scripts/cli.mjs export --queryId "qry_001" --tmids "tm_001,tm_002"',
            description: lang === 'en' ? 'Create trademark export job' : '发起商标导出任务'
          },
          {
            name: 'export-status',
            usage: 'node scripts/cli.mjs export-status --jobId "exp_20260310_0003"',
            description: lang === 'en' ? 'Check export job status' : '查询导出任务状态'
          },
          {
            name: 'modules',
            usage: 'node scripts/cli.mjs modules',
            description: lang === 'en' ? 'Read module capabilities' : '读取模块能力'
          }
        ],
        flags: [
          { name: '--pageSize', description: lang === 'en' ? 'Results per page (1-100, default 50)' : '每页结果数 (1-100, 默认 50)', default: 50 },
          { name: '--lang', description: lang === 'en' ? 'Output language: en or zh (default zh)' : '输出语言: en 或 zh (默认 zh)', default: 'zh' }
        ],
        environment: [
          'CHINA_TM_PLATFORM_BASE_URL',
          'CHINA_TM_USER_TOKEN',
          'CHINA_TM_TIMEOUT_MS',
          'CHINA_TM_SKILL_CHANNEL',
          'ALLOW_HTTP'
        ],
        notes: [
          m.noteSearch,
          m.noteDetail,
          m.noteExport,
          m.noteBind
        ],
        legalDisclaimer: m.legalDisclaimer
      }
    });
  }

  const env = readEnv(lang);

  switch (command) {
    case 'bind-help':
      return runBindHelp(env);
    case 'capabilities':
      return runCapabilities(env);
    case 'search':
      return runSearch(env, args.slice(1), lang);
    case 'detail':
      return runDetail(env, args.slice(1), lang);
    case 'export':
      return runExport(env, args.slice(1), lang);
    case 'export-status':
      return runExportStatus(env, args.slice(1), lang);
    case 'modules':
      return runModules(env);
    default:
      return writeError({
        code: 'UNKNOWN_COMMAND',
        message: m.unknownCommand(command)
      });
  }
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

/**
 * Validates a search query string.
 */
function validateQuery(q, lang) {
  const m_ = msg(lang);
  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    throw createSkillError('ARGUMENT_INVALID', m_.queryEmpty);
  }
  if (q.length > 200) {
    throw createSkillError('ARGUMENT_INVALID', m_.queryTooLong);
  }
  return q.trim();
}

/**
 * Validates a trademark ID.
 */
function validateTmid(id, lang) {
  const m_ = msg(lang);
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw createSkillError('ARGUMENT_INVALID', m_.tmidEmpty);
  }
  return id.trim();
}

/**
 * Validates page size (1-100, default 50).
 */
function validatePageSize(n, lang) {
  const m_ = msg(lang);
  if (n === undefined || n === null) return DEFAULT_PAGE_SIZE;
  const value = Number(n);
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    throw createSkillError('ARGUMENT_INVALID', m_.pageSizeRange);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

/**
 * Reads required environment values.
 */
function readEnv(lang) {
  const m_ = msg(lang);
  const baseUrl = process.env.CHINA_TM_PLATFORM_BASE_URL;
  const token = process.env.CHINA_TM_USER_TOKEN;
  const timeoutMsRaw = process.env.CHINA_TM_TIMEOUT_MS;
  const channel = process.env.CHINA_TM_SKILL_CHANNEL || DEFAULT_CHANNEL;
  const allowHttp = process.env.ALLOW_HTTP === 'true';

  if (!baseUrl) {
    throw createSkillError('ENV_MISSING', m_.envMissingBase);
  }

  if (!token) {
    throw createSkillError('ENV_MISSING', m_.envMissingToken);
  }

  const timeoutMs = parsePositiveInteger(timeoutMsRaw, DEFAULT_TIMEOUT_MS, 'CHINA_TM_TIMEOUT_MS', lang);

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');

  if (!/^https:\/\//i.test(normalizedBaseUrl) && !allowHttp) {
    throw createSkillError('HTTPS_REQUIRED', m_.httpsRequired);
  }

  return {
    baseUrl: normalizedBaseUrl,
    token,
    timeoutMs,
    channel,
    lang
  };
}

// ---------------------------------------------------------------------------
// Command runners
// ---------------------------------------------------------------------------

async function runBindHelp(env) {
  const data = await apiRequestWithRetry(env, 'GET', '/v1/openclaw/bind/help');
  writeJson({
    success: true,
    command: 'bind-help',
    data
  });
}

async function runCapabilities(env) {
  const data = await apiRequestWithRetry(env, 'GET', '/v1/openclaw/capabilities');
  writeJson({
    success: true,
    command: 'capabilities',
    data
  });
}

async function runSearch(env, argv, lang) {
  const m_ = msg(lang);
  const queryRaw = getOptionValue(argv, '--query');
  const pageRaw = getOptionValue(argv, '--page') || '1';
  const pageSizeRaw = getOptionValue(argv, '--pageSize');
  const page = parsePositiveInteger(pageRaw, 1, '--page', lang);

  if (!queryRaw) {
    throw createSkillError('ARGUMENT_INVALID', m_.searchMissingQuery);
  }

  const query = validateQuery(queryRaw, lang);
  const pageSize = validatePageSize(pageSizeRaw, lang);

  const body = {
    query,
    page,
    pageSize,
    channel: env.channel
  };

  const data = await apiRequestWithRetry(env, 'POST', '/v1/openclaw/trademarks/search', body);
  writeJson({
    success: true,
    command: 'search',
    data
  });
}

async function runDetail(env, argv, lang) {
  const m_ = msg(lang);
  const tmidRaw = getOptionValue(argv, '--tmid');

  if (!tmidRaw) {
    throw createSkillError('ARGUMENT_INVALID', m_.detailMissingTmid);
  }

  const tmid = validateTmid(tmidRaw, lang);

  const data = await apiRequestWithRetry(
    env,
    'GET',
    `/v1/openclaw/trademarks/${encodeURIComponent(tmid)}`
  );

  writeJson({
    success: true,
    command: 'detail',
    data
  });
}

async function runExport(env, argv, lang) {
  const m_ = msg(lang);
  const queryId = getOptionValue(argv, '--queryId');
  const tmidsRaw = getOptionValue(argv, '--tmids');

  if (!queryId) {
    throw createSkillError('ARGUMENT_INVALID', m_.exportMissingQueryId);
  }

  if (!tmidsRaw) {
    throw createSkillError('ARGUMENT_INVALID', m_.exportMissingTmids);
  }

  const selectedTmids = tmidsRaw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (selectedTmids.length === 0) {
    throw createSkillError('ARGUMENT_INVALID', m_.exportTmidsEmpty);
  }

  const body = {
    queryId,
    selectedTmids,
    channel: env.channel
  };

  const data = await apiRequestWithRetry(env, 'POST', '/v1/openclaw/trademarks/export', body);
  writeJson({
    success: true,
    command: 'export',
    data
  });
}

async function runExportStatus(env, argv, lang) {
  const m_ = msg(lang);
  const exportJobId = getOptionValue(argv, '--jobId');

  if (!exportJobId) {
    throw createSkillError('ARGUMENT_INVALID', m_.exportStatusMissingJobId);
  }

  let attempts = 0;
  while (attempts < EXPORT_POLL_MAX_ATTEMPTS) {
    const data = await apiRequestWithRetry(
      env,
      'GET',
      `/v1/openclaw/exports/${encodeURIComponent(exportJobId)}`
    );

    if (data.status !== 'processing' && data.status !== 'queued') {
      return writeJson({
        success: true,
        command: 'export-status',
        data
      });
    }

    // If this is the first call (no polling yet), just return the current status
    // Polling only happens when explicitly looped by the caller
    return writeJson({
      success: true,
      command: 'export-status',
      data,
      pollInfo: {
        attempt: attempts + 1,
        maxAttempts: EXPORT_POLL_MAX_ATTEMPTS
      }
    });
  }

  throw createSkillError('EXPORT_TIMEOUT', m_.exportTimeout);
}

async function runModules(env) {
  const data = await apiRequestWithRetry(env, 'GET', '/v1/openclaw/modules');
  writeJson({
    success: true,
    command: 'modules',
    data
  });
}

// ---------------------------------------------------------------------------
// API request with retry
// ---------------------------------------------------------------------------

/**
 * Wraps apiRequest with exponential backoff for retryable errors.
 */
async function apiRequestWithRetry(env, method, path, body) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      return await apiRequest(env, method, path, body);
    } catch (error) {
      lastError = error;

      if (attempt < MAX_RETRY_ATTEMPTS && error && RETRYABLE_CODES.has(error.code)) {
        const delay = RETRY_DELAYS_MS[attempt];
        const m_ = msg(env.lang || 'zh');
        process.stderr.write(`${m_.retrying(attempt + 1, delay)}\n`);
        await sleep(delay);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

/**
 * Sleeps for given milliseconds.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Core API request
// ---------------------------------------------------------------------------

/**
 * Sends a request to the hosted platform API.
 */
async function apiRequest(env, method, path, body) {
  const m_ = msg(env.lang || 'zh');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.timeoutMs);

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${env.token}`
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const requestInit = {
    method,
    headers,
    signal: controller.signal
  };

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${env.baseUrl}${path}`, requestInit);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error && error.name === 'AbortError') {
      throw createSkillError('UPSTREAM_TIMEOUT', m_.requestTimeout(env.timeoutMs));
    }

    throw createSkillError('NETWORK_ERROR', m_.networkError);
  }

  clearTimeout(timeoutId);

  const payload = await safeReadJson(response, env.lang);

  if (response.ok) {
    return payload;
  }

  throw mapHttpError(response.status, payload, env.lang);
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Parses a positive integer with fallback.
 */
function parsePositiveInteger(rawValue, fallbackValue, fieldName, lang) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return fallbackValue;
  }

  const m_ = msg(lang || 'zh');
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    throw createSkillError('ARGUMENT_INVALID', m_.positiveInteger(fieldName));
  }
  return value;
}

/**
 * Gets a CLI option value, for example --query "abc".
 */
function getOptionValue(argv, optionName) {
  const index = argv.indexOf(optionName);
  if (index === -1) return null;
  return argv[index + 1] ?? null;
}

/**
 * Reads JSON safely. Falls back to text if needed.
 */
async function safeReadJson(response, lang) {
  const m_ = msg(lang || 'zh');
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!text) {
    return {};
  }

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: m_.invalidJson
        },
        raw: text
      };
    }
  }

  // Fallback: some platforms may return JSON without correct content-type; try parsing.
  // If that fails, wrap the raw text as a message to ensure the host always gets a structured object.
  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text
    };
  }
}

/**
 * Maps HTTP status and platform payload into a structured error.
 */
function mapHttpError(status, payload, lang) {
  const m_ = msg(lang || 'zh');
  const platformError = payload && typeof payload === 'object' ? payload.error : null;
  const platformCode = platformError && typeof platformError.code === 'string' ? platformError.code : null;
  const platformMessage = platformError && typeof platformError.message === 'string' ? platformError.message : null;

  if (platformCode && platformMessage) {
    return createSkillError(platformCode, platformMessage);
  }

  switch (status) {
    case 400:
      return createSkillError('BAD_REQUEST', readMessage(payload, m_.badRequest));
    case 401:
      return createSkillError('UNAUTHORIZED', m_.unauthorized);
    case 403:
      return createSkillError('FORBIDDEN', m_.forbidden);
    case 404:
      return createSkillError('NOT_FOUND', m_.notFound);
    case 408:
      return createSkillError('UPSTREAM_TIMEOUT', m_.upstreamTimeout);
    case 429:
      return createSkillError('RATE_LIMITED', m_.rateLimited);
    case 500:
    case 502:
    case 503:
    case 504:
      return createSkillError('SERVER_ERROR', readMessage(payload, m_.serverError));
    default:
      return createSkillError('HTTP_ERROR', readMessage(payload, m_.httpError(status)));
  }
}

/**
 * Reads a human message from payload.
 */
function readMessage(payload, fallback) {
  if (!payload || typeof payload !== 'object') return fallback;
  if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
  if (payload.error && typeof payload.error.message === 'string' && payload.error.message.trim()) {
    return payload.error.message;
  }
  return fallback;
}

/**
 * Creates a known skill error.
 */
function createSkillError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Converts unknown exceptions into skill error objects.
 */
function normalizeUnknownError(error) {
  if (error && typeof error === 'object' && typeof error.code === 'string' && typeof error.message === 'string') {
    return {
      code: error.code,
      message: error.message
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: MESSAGES.zh.unknownError
  };
}

/**
 * Prints a successful JSON result.
 */
function writeJson(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

/**
 * Prints a structured error JSON result.
 */
function writeError(error) {
  process.stdout.write(
    `${JSON.stringify(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      },
      null,
      2
    )}\n`
  );
  process.exitCode = 1;
}
