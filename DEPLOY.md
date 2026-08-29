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
