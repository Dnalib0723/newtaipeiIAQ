// Cloudflare Worker — 靜態網站 + 取代 proxy_server.py 的 /api 轉發 + CO2 告警排程
// 靜態檔案放在 /public，由 ASSETS binding 提供；/api/* 由本檔處理
import { loginEB, getDevices, getHistory } from './ecobear.js';
import { checkCo2Alerts } from './alerts.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    switch (url.pathname) {
      case '/api/login':   return handleLogin(request);
      case '/api/devices': return handleDevices(request);
      case '/api/history': return handleHistory(request);
      case '/api/admin/check-alerts': return handleManualAlertCheck(request, env);
      default:              return env.ASSETS.fetch(request);
    }
  },

  // Cron Trigger（見 wrangler.jsonc 的 triggers.crons）定時喚醒，檢查 CO2 是否連續超標
  async scheduled(event, env, ctx) {
    ctx.waitUntil(checkCo2Alerts(env));
  },
};

async function handleLogin(request) {
  let body = {};
  try { body = await request.json(); } catch (_) {}
  const { data, status } = await loginEB(body.email || '', body.password || '');
  return Response.json(data, { status });
}

async function handleDevices(request) {
  const token = request.headers.get('accessToken') || '';
  try {
    const { data, status } = await getDevices(token);
    return Response.json(data, { status });
  } catch (e) {
    return Response.json({ ret: 'RET_ERROR', retDescription: String(e) }, { status: 500 });
  }
}

async function handleHistory(request) {
  const token = request.headers.get('accessToken') || '';
  const search = new URL(request.url).search; // ?uuid=...&from=...&to=...&group=...
  try {
    const { data, status } = await getHistory(token, search);
    return Response.json(data, { status });
  } catch (e) {
    return Response.json({ ret: 'RET_ERROR', retDescription: String(e) }, { status: 500 });
  }
}

// 不想等 Cron 自然觸發時，手動戳一下測試告警邏輯：
//   curl -X POST https://<你的worker>/api/admin/check-alerts -H "x-admin-key: <ADMIN_KEY>"
// 沒設定 ADMIN_KEY secret 的話這個端點永遠回 404，不會被外部濫用。
async function handleManualAlertCheck(request, env) {
  if (!env.ADMIN_KEY || request.headers.get('x-admin-key') !== env.ADMIN_KEY) {
    return new Response('Not found', { status: 404 });
  }
  await checkCo2Alerts(env);
  return Response.json({ ok: true });
}
