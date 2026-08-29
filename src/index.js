// Cloudflare Worker — 靜態網站 + 取代 proxy_server.py 的 /api 轉發
// 靜態檔案放在 /public，由 ASSETS binding 提供；/api/* 由本檔處理
const EB_BASE = 'https://eb.ecobear.tw';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    switch (url.pathname) {
      case '/api/login':   return handleLogin(request);
      case '/api/devices': return handleDevices(request);
      case '/api/history': return handleHistory(request);
      default:             return env.ASSETS.fetch(request);
    }
  },
};

async function handleLogin(request) {
  let body = {};
  try { body = await request.json(); } catch (_) {}
  const email = body.email || '';
  const password = body.password || '';

  const attempts = [
    // 方法1: JSON body
    () => fetch(`${EB_BASE}/users/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ email, password }),
    }),
    // 方法2: Form data
    () => fetch(`${EB_BASE}/users/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email, password }),
    }),
    // 方法3: 帳密放 Headers
    () => fetch(`${EB_BASE}/users/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8', email, password },
    }),
    // 方法4: Query parameters
    () => fetch(`${EB_BASE}/users/login.php?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    }),
  ];

  let last = null;
  for (const attempt of attempts) {
    try {
      const r = await attempt();
      const data = await r.json();
      if (data.ret === 'RET_OK') return Response.json(data, { status: r.status });
      last = { data, status: r.status };
    } catch (e) {
      last = { data: { ret: 'RET_ERROR', retDescription: String(e) }, status: 500 };
    }
  }
  return Response.json(
    last ? last.data : { ret: 'RET_ERROR', retDescription: 'All login methods failed' },
    { status: last ? last.status : 500 }
  );
}

async function handleDevices(request) {
  const token = request.headers.get('accessToken') || '';
  try {
    const r = await fetch(`${EB_BASE}/devices/getByAuth.php`, {
      method: 'POST',
      headers: { 'accessToken': token },
    });
    const data = await r.json();
    return Response.json(data, { status: r.status });
  } catch (e) {
    return Response.json({ ret: 'RET_ERROR', retDescription: String(e) }, { status: 500 });
  }
}

async function handleHistory(request) {
  const token = request.headers.get('accessToken') || '';
  const search = new URL(request.url).search; // ?uuid=...&from=...&to=...&group=...
  try {
    const r = await fetch(`${EB_BASE}/devices/history.php${search}`, {
      method: 'POST',
      headers: { 'accessToken': token },
    });
    const data = await r.json();
    return Response.json(data, { status: r.status });
  } catch (e) {
    return Response.json({ ret: 'RET_ERROR', retDescription: String(e) }, { status: 500 });
  }
}
