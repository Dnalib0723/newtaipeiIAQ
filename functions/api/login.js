// Cloudflare Pages Function — 取代 proxy_server.py 的 /api/login
// 依序嘗試 4 種登入方式，對應原本 Python 版的邏輯
const EB_BASE = 'https://eb.ecobear.tw';

export async function onRequestPost({ request }) {
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
      if (data.ret === 'RET_OK') {
        return Response.json(data, { status: r.status });
      }
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
