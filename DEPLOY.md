# 部署到 Cloudflare Workers（免費，不需跑 Python）

## 檔案結構

```
wrangler.jsonc        ← Cloudflare 設定
src/index.js          ← Worker：/api/* 轉發到 eb.ecobear.tw，其餘走靜態檔案
public/
  index.html          ← 儀表板（API 指向同源 /api）
  logo.png
proxy_server.py 等    ← 本機用，部署不需要
```

`src/index.js` 完整取代了 `proxy_server.py`：處理 `/api/login`、`/api/devices`、
`/api/history`，其他路徑交給 `ASSETS` binding 提供 `public/` 裡的靜態檔。
跟頁面同一個網域，所以沒有 CORS 問題。

## 部署（GitHub + Cloudflare 自動建置）

1. 程式碼已在 https://github.com/Dnalib0723/newtaipeiIAQ （branch `main`）
2. Cloudflare Dashboard → **Workers & Pages** → **Create application**
3. 選 **Import a repository**（連接 GitHub）→ 選 `newtaipeiIAQ`
4. Cloudflare 會偵測到 `wrangler.jsonc`：
   - Build command：**留空**
   - Deploy command：`npx wrangler deploy`（預設值，不用改）
5. **Save and Deploy**，等約 1 分鐘
6. 拿到網址 `https://newtaipeiiaq.<你的子網域>.workers.dev`

之後改東西 → `git push` → Cloudflare 自動重新部署。

## 本機開發（可選）

```powershell
npm install -g wrangler
wrangler dev
```

開 `http://localhost:8787`，行為跟線上一致。

## 注意事項

1. **每位觀看者仍需用 EcoBear 帳號登入**（token 各自存在自己瀏覽器）。
   若要「完全公開、免登入」，需在 `src/index.js` 寫死一組唯讀 token。
2. 登入帳密經 Cloudflare 轉發到 `eb.ecobear.tw`，信任模型同原本本機 proxy。

## CO2 連續超標告警（Email）

每 10 分鐘（`wrangler.jsonc` 的 `triggers.crons`）由 Cloudflare 自動喚醒 Worker，
用帳密重新登入抓所有裝置的即時 CO2；任何一台連續超標滿 1 小時就寄信，之後每多
超標 1 小時再寄一次；CO2 回到門檻以下就清除狀態（不會寄「已恢復」信）。邏輯在
`src/alerts.js`，寄信用 `src/mailer.js`（Gmail SMTP + App Password）。

### 一次性設定步驟

1. **建立 KV namespace**（存每台裝置的超標起始時間）：
   ```powershell
   npx wrangler kv namespace create ALERT_KV
   ```
   把輸出的 `id` 貼到 `wrangler.jsonc` 的 `kv_namespaces[0].id`。

2. **申請 Gmail App Password**：Google 帳戶 → 安全性 → 開啟兩步驟驗證 → 應用程式密碼，
   產生一組給「郵件」用的 16 碼密碼（不是你平常登入 Gmail 的密碼）。

3. **設定 secrets**（機密資訊，不會進 git、不會寫進 wrangler.jsonc）：
   ```powershell
   npx wrangler secret put EB_EMAIL           # 你的 EcoBear 帳號 email
   npx wrangler secret put EB_PASSWORD        # 你的 EcoBear 密碼
   npx wrangler secret put GMAIL_USER         # 寄件用的 gmail 帳號
   npx wrangler secret put GMAIL_APP_PASSWORD # 上一步申請的 16 碼 App Password
   npx wrangler secret put ALERT_EMAIL_TO     # 告警信要寄到哪個信箱
   ```

4. `npm install` 後 `npx wrangler deploy`（或照原本流程 `git push` 讓 Cloudflare 自動部署，
   但 secrets 只能用上面的 CLI 指令設定一次，不會因為 git push 而改變）。

### 調整門檻 / 時間

`wrangler.jsonc` 的 `vars` 區塊：
- `CO2_THRESHOLD_PPM`：超標門檻，預設 1000（跟前端儀表板的警戒線一致）
- `CO2_EXCEED_MINUTES`：連續超標多久才寄第一封信，預設 60
- `CO2_REPEAT_MINUTES`：持續異常時，多久再寄一次提醒，預設 60
- `ALERT_DEVICE_MATCH`：只監控這些裝置（比對側邊欄顯示的名稱/別名或 UUID，
  不分大小寫），逗號分隔可填多台，例如 `"HAC_01_127,HAC_02_xxx,HAC_03_xxx"`。
  目前只設定了 `HAC_01_127`。改成空字串 `""` 會變回監控全部裝置。

改完這幾個數字重新 `wrangler deploy` 即可，不用動程式碼或 secrets。

### 手動測試

設定一個 `ADMIN_KEY` secret（`npx wrangler secret put ADMIN_KEY`），就能不等 Cron
直接戳一次：
```powershell
curl -X POST https://<你的worker網址>/api/admin/check-alerts -H "x-admin-key: <ADMIN_KEY>"
```
想馬上看到信，可以先把 `CO2_EXCEED_MINUTES` 暫時改成 `1` 部署、觸發一次、確認收到信後再改回 `60`。
