// Cloudflare Pages Function — 取代 proxy_server.py 的 /api/devices
const EB_BASE = 'https://eb.ecobear.tw';

export async function onRequest({ request }) {
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
