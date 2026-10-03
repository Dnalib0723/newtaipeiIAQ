// CO2 連續超標告警 — 由 wrangler.jsonc 裡的 Cron Trigger 定時呼叫 checkCo2Alerts()
//
// 判斷邏輯：
//   - 每次執行都重新登入拿 token，抓所有裝置目前的 CO2。
//   - 若設定了 ALERT_DEVICE_MATCH，只處理名稱/別名/UUID符合清單中任何一項的裝置，
//     其餘裝置略過；清單用逗號分隔，可以寫一台或多台。
//   - 用 KV 記住每台裝置「從什麼時候開始超標」(firstExceededAt)。
//   - 一旦連續超標時間 >= CO2_EXCEED_MINUTES，就寄一封信；之後只要還在超標，
//     每滿 CO2_REPEAT_MINUTES 就再寄一次（避免狂發信）。
//   - 一旦讀到的 CO2 回到門檻以下，就清掉該裝置的狀態，不會寄「已恢復」信。
import { loginEB, extractToken, getDevices, extractDevices } from './ecobear.js';
import { sendMail } from './mailer.js';

// 裝置失聯或狀態沒再更新時，讓 KV 自動過期清掉，不要留垃圾資料
const STATE_TTL_SECONDS = 60 * 60 * 24 * 2;

function minutesToMs(min) {
  return min * 60 * 1000;
}

// ALERT_DEVICE_MATCH 是逗號分隔的清單，例如 "HAC_01_127, HAC_02_088"
function parseTargetList(matchTarget) {
  return String(matchTarget || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
}

// 用裝置名稱/別名/UUID 比對清單中任何一項（不分大小寫、去頭尾空白）
function matchesTargetDevice(device, targetList) {
  if (!targetList.length) return true; // 沒設定就監控全部裝置
  const candidates = [device.uuid, device.alias, device.name].filter(Boolean).map(String);
  return candidates.some(c => targetList.includes(c.trim().toLowerCase()));
}

export async function checkCo2Alerts(env) {
  const threshold = Number(env.CO2_THRESHOLD_PPM || 1000);
  const exceedMs  = minutesToMs(Number(env.CO2_EXCEED_MINUTES || 60));
  const repeatMs  = minutesToMs(Number(env.CO2_REPEAT_MINUTES || 60));

  const { data: loginData } = await loginEB(env.EB_EMAIL, env.EB_PASSWORD);
  const token = extractToken(loginData);
  if (!token) {
    console.error('CO2 alert: EcoBear login failed', loginData);
    return;
  }

  const { data: devicesData } = await getDevices(token);
  const devices = extractDevices(devicesData);
  const targetList = parseTargetList(env.ALERT_DEVICE_MATCH);
  const now = Date.now();

  for (const device of devices) {
    const uuid = device.uuid;
    if (!uuid) continue;
    if (!matchesTargetDevice(device, targetList)) continue;

    const sensors = device.sensors || device;
    const co2 = sensors.co2 != null && sensors.co2 !== '' ? parseFloat(sensors.co2) : null;
    if (co2 == null || Number.isNaN(co2)) continue;

    const key = `co2alert:${uuid}`;
    const stateRaw = await env.ALERT_KV.get(key);
    const state = stateRaw ? JSON.parse(stateRaw) : null;

    if (co2 <= threshold) {
      if (state) await env.ALERT_KV.delete(key);
      continue;
    }

    // 剛開始超標：記下起始時間，還不到寄信門檻
    if (!state) {
      await env.ALERT_KV.put(
        key,
        JSON.stringify({ firstExceededAt: now, lastAlertedAt: null }),
        { expirationTtl: STATE_TTL_SECONDS }
      );
      continue;
    }

    const elapsed = now - state.firstExceededAt;
    if (elapsed < exceedMs) continue;

    const sinceLastAlert = state.lastAlertedAt ? now - state.lastAlertedAt : Infinity;
    if (sinceLastAlert < repeatMs) continue;

    const name = device.alias || device.name || uuid;
    try {
      await sendMail(env, {
        subject: `⚠️ IAQ 告警：${name} CO2 連續超標`,
        text:
          `裝置：${name}（${uuid}）\n` +
          `目前 CO2：${co2} ppm（門檻 ${threshold} ppm）\n` +
          `已連續超標：約 ${Math.round(elapsed / 60000)} 分鐘\n` +
          `時間：${new Date(now).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`,
      });
    } catch (e) {
      console.error('CO2 alert: sendMail failed', e);
      continue; // 寄信失敗就不要更新 lastAlertedAt，下次排程再試
    }

    await env.ALERT_KV.put(
      key,
      JSON.stringify({ ...state, lastAlertedAt: now }),
      { expirationTtl: STATE_TTL_SECONDS }
    );
  }
}
