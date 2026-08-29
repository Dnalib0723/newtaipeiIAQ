// Cloudflare Pages Function — 取代 proxy_server.py 的 /api/history
const EB_BASE = 'https://eb.ecobear.tw';

export async function onRequest({ request }) {
  const token = request.headers.get('accessToken') || '';
  const search = new URL(request.url).search; // 直接帶上 ?uuid=...&from=...&to=...&group=...
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
