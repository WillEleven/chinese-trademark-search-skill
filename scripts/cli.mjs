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

main().catch((error) => {
  writeError(normalizeUnknownError(error));
});

/**
 * Main entry point.
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  if (command === 'help') {
    return writeJson({
      success: true,
      command: 'help',
      data: {
        summary: '中国商标查询 Skill CLI',
        commands: [
          {
            name: 'help',
            usage: 'node scripts/cli.mjs help',
            description: '输出命令帮助'
          },
          {
            name: 'bind-help',
            usage: 'node scripts/cli.mjs bind-help',
            description: '读取平台绑定指引'
          },
          {
            name: 'capabilities',
            usage: 'node scripts/cli.mjs capabilities',
            description: '读取绑定状态、点数余额、计费提示与能力信息'
          },
          {
            name: 'search',
            usage: 'node scripts/cli.mjs search --query "华源科技" --page 1',
            description: '执行商标查询'
          },
          {
            name: 'detail',
            usage: 'node scripts/cli.mjs detail --tmid "tm_20260310_0001"',
            description: '读取指定商标详情'
          },
          {
            name: 'export',
            usage: 'node scripts/cli.mjs export --queryId "qry_001" --tmids "tm_001,tm_002"',
            description: '发起商标导出任务'
          },
          {
            name: 'export-status',
            usage: 'node scripts/cli.mjs export-status --jobId "exp_20260310_0003"',
            description: '查询导出任务状态'
          },
          {
            name: 'modules',
            usage: 'node scripts/cli.mjs modules',
            description: '读取模块能力'
          }
        ],
        environment: [
          'CHINA_TM_PLATFORM_BASE_URL',
          'CHINA_TM_USER_TOKEN',
          'CHINA_TM_TIMEOUT_MS',
          'CHINA_TM_SKILL_CHANNEL'
        ],
        notes: [
          '查询前预计消耗 1 点',
          '详情前预计消耗 1 点',
          '导出按条数阶梯扣点',
          '未绑定时请先执行 bind-help'
        ]
      }
    });
  }

  const env = readEnv();

  switch (command) {
    case 'bind-help':
      return runBindHelp(env);
    case 'capabilities':
      return runCapabilities(env);
    case 'search':
      return runSearch(env, args.slice(1));
    case 'detail':
      return runDetail(env, args.slice(1));
    case 'export':
      return runExport(env, args.slice(1));
    case 'export-status':
      return runExportStatus(env, args.slice(1));
    case 'modules':
      return runModules(env);
    default:
      return writeError({
        code: 'UNKNOWN_COMMAND',
        message: `未知命令: ${command}`
      });
  }
}

/**
 * Reads required environment values.
 */
function readEnv() {
  const baseUrl = process.env.CHINA_TM_PLATFORM_BASE_URL;
  const token = process.env.CHINA_TM_USER_TOKEN;
  const timeoutMsRaw = process.env.CHINA_TM_TIMEOUT_MS;
  const channel = process.env.CHINA_TM_SKILL_CHANNEL || DEFAULT_CHANNEL;

  if (!baseUrl) {
    throw createSkillError('ENV_MISSING', '缺少环境变量 CHINA_TM_PLATFORM_BASE_URL');
  }

  if (!token) {
    throw createSkillError('ENV_MISSING', '缺少环境变量 CHINA_TM_USER_TOKEN');
  }

  const timeoutMs = parsePositiveInteger(timeoutMsRaw, DEFAULT_TIMEOUT_MS, 'CHINA_TM_TIMEOUT_MS');

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');

  if (!/^https:\/\//i.test(normalizedBaseUrl)) {
    process.stderr.write(
      '[WARN] CHINA_TM_PLATFORM_BASE_URL 未使用 HTTPS，token 可能明文传输\n'
    );
  }

  return {
    baseUrl: normalizedBaseUrl,
    token,
    timeoutMs,
    channel
  };
}

async function runBindHelp(env) {
  const data = await apiRequest(env, 'GET', '/v1/openclaw/bind/help');
  writeJson({
    success: true,
    command: 'bind-help',
    data
  });
}

async function runCapabilities(env) {
  const data = await apiRequest(env, 'GET', '/v1/openclaw/capabilities');
  writeJson({
    success: true,
    command: 'capabilities',
    data
  });
}

async function runSearch(env, argv) {
  const query = getOptionValue(argv, '--query');
  const pageRaw = getOptionValue(argv, '--page') || '1';
  const page = parsePositiveInteger(pageRaw, 1, '--page');

  if (!query) {
    throw createSkillError('ARGUMENT_INVALID', 'search 缺少 --query 参数');
  }

  const body = {
    query,
    page,
    pageSize: 50,
    channel: env.channel
  };

  const data = await apiRequest(env, 'POST', '/v1/openclaw/trademarks/search', body);
  writeJson({
    success: true,
    command: 'search',
    data
  });
}

async function runDetail(env, argv) {
  const tmid = getOptionValue(argv, '--tmid');

  if (!tmid) {
    throw createSkillError('ARGUMENT_INVALID', 'detail 缺少 --tmid 参数');
  }

  const data = await apiRequest(
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

async function runExport(env, argv) {
  const queryId = getOptionValue(argv, '--queryId');
  const tmidsRaw = getOptionValue(argv, '--tmids');

  if (!queryId) {
    throw createSkillError('ARGUMENT_INVALID', 'export 缺少 --queryId 参数');
  }

  if (!tmidsRaw) {
    throw createSkillError('ARGUMENT_INVALID', 'export 缺少 --tmids 参数');
  }

  const selectedTmids = tmidsRaw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (selectedTmids.length === 0) {
    throw createSkillError('ARGUMENT_INVALID', 'export 的 --tmids 不能为空');
  }

  const body = {
    queryId,
    selectedTmids,
    channel: env.channel
  };

  const data = await apiRequest(env, 'POST', '/v1/openclaw/trademarks/export', body);
  writeJson({
    success: true,
    command: 'export',
    data
  });
}

async function runExportStatus(env, argv) {
  const exportJobId = getOptionValue(argv, '--jobId');

  if (!exportJobId) {
    throw createSkillError('ARGUMENT_INVALID', 'export-status 缺少 --jobId 参数');
  }

  const data = await apiRequest(
    env,
    'GET',
    `/v1/openclaw/exports/${encodeURIComponent(exportJobId)}`
  );

  writeJson({
    success: true,
    command: 'export-status',
    data
  });
}

async function runModules(env) {
  const data = await apiRequest(env, 'GET', '/v1/openclaw/modules');
  writeJson({
    success: true,
    command: 'modules',
    data
  });
}

/**
 * Sends a request to the hosted platform API.
 */
async function apiRequest(env, method, path, body) {
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
      throw createSkillError('UPSTREAM_TIMEOUT', `请求超时，已超过 ${env.timeoutMs}ms`);
    }

    throw createSkillError('NETWORK_ERROR', '平台接口不可达');
  }

  clearTimeout(timeoutId);

  const payload = await safeReadJson(response);

  if (response.ok) {
    return payload;
  }

  throw mapHttpError(response.status, payload);
}

/**
 * Parses a positive integer with fallback.
 */
function parsePositiveInteger(rawValue, fallbackValue, fieldName) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return fallbackValue;
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    throw createSkillError('ARGUMENT_INVALID', `${fieldName} 必须是正整数`);
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
async function safeReadJson(response) {
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
          message: '平台返回了无法解析的 JSON'
        },
        raw: text
      };
    }
  }

  // Fallback: 某些平台可能返回 JSON 但未设置正确的 content-type，尝试解析；
  // 若仍失败则将原文包装为 message 返回，确保宿主始终收到结构化对象。
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
function mapHttpError(status, payload) {
  const platformError = payload && typeof payload === 'object' ? payload.error : null;
  const platformCode = platformError && typeof platformError.code === 'string' ? platformError.code : null;
  const platformMessage = platformError && typeof platformError.message === 'string' ? platformError.message : null;

  if (platformCode && platformMessage) {
    return createSkillError(platformCode, platformMessage);
  }

  switch (status) {
    case 400:
      return createSkillError('BAD_REQUEST', readMessage(payload, '请求参数错误'));
    case 401:
      return createSkillError('UNAUTHORIZED', '认证失败，请检查平台 token 是否有效');
    case 403:
      return createSkillError('FORBIDDEN', '当前用户无权访问该平台资源');
    case 404:
      return createSkillError('NOT_FOUND', '请求的资源不存在');
    case 408:
      return createSkillError('UPSTREAM_TIMEOUT', '平台处理超时');
    case 429:
      return createSkillError('RATE_LIMITED', '请求过于频繁，请稍后再试');
    case 500:
    case 502:
    case 503:
    case 504:
      return createSkillError('SERVER_ERROR', readMessage(payload, '平台内部错误，请稍后重试'));
    default:
      return createSkillError('HTTP_ERROR', readMessage(payload, `请求失败，HTTP ${status}`));
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
    message: '发生未知错误'
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
