// 共用的 EcoBear API 用戶端 — 給 /api/* 路由和背景告警排程 (alerts.js) 一起用
const EB_BASE = 'https://eb.ecobear.tw';

export async function loginEB(email, password) {
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
      if (data.ret === 'RET_OK') return { data, status: r.status };
      last = { data, status: r.status };
    } catch (e) {
      last = { data: { ret: 'RET_ERROR', retDescription: String(e) }, status: 500 };
    }
  }
  return last || { data: { ret: 'RET_ERROR', retDescription: 'All login methods failed' }, status: 500 };
}

export function extractToken(loginData) {
  return (loginData.data && loginData.data.accessToken) || loginData.accessToken || loginData.token || '';
}

export async function getDevices(token) {
  const r = await fetch(`${EB_BASE}/devices/getByAuth.php`, {
    method: 'POST',
    headers: { accessToken: token },
  });
  return { data: await r.json(), status: r.status };
}

export async function getHistory(token, search) {
  const r = await fetch(`${EB_BASE}/devices/history.php${search}`, {
    method: 'POST',
    headers: { accessToken: token },
  });
  return { data: await r.json(), status: r.status };
}

// getDevices() 回應格式不穩定（有時是 data.data、有時是 data.devices），統一轉成陣列
export function extractDevices(devicesData) {
  return (Array.isArray(devicesData.data) ? devicesData.data : null) ||
         devicesData.devices || devicesData.device || [];
}
