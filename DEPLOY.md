# 部署到 Cloudflare Pages（免費，不需跑 Python）

## 檔案結構（已準備好）

```
index.html            ← 儀表板（已把 API 改成 /api）
logo.png
functions/
  api/
    login.js          ← 取代 proxy_server.py 的 /api/login
    devices.js        ← 取代 /api/devices
    history.js        ← 取代 /api/history
```

`functions/` 是 Cloudflare Pages 的慣例資料夾，部署後
`/api/login`、`/api/devices`、`/api/history` 會自動由這三支 JS 處理，
跟頁面同一個網域，所以沒有 CORS 問題，也不用開伺服器。

## 方法 A：用 Git（推薦，之後改檔會自動更新）

1. 把這個資料夾推到 GitHub（新開一個 repo 即可）。
2. 到 https://dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git。
3. 選那個 repo，Build command 留空，Output directory 填 `/`（或留空）。
4. Deploy。完成後會給你一個網址：`https://你的專案.pages.dev`
5. 把這個網址給大家即可。

## 方法 B：不想用 Git（指令上傳一次）

需要 Node.js。在這個資料夾執行：

```powershell
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name iaq-dashboard
```

之後每次要更新就再跑一次最後那行。

## 換 Netlify / Vercel？

- Netlify：把 `functions/api/*.js` 改放到 `netlify/functions/`，
  並加 `netlify.toml` 做 `/api/* → /.netlify/functions/:splat` 轉址。
- Vercel：把三支檔案改放到 `api/`（檔名即路由），語法改成
  `export default function handler(req, res) { ... }`。
- 三家免費額度對這個用途都綽綽有餘。

## 注意事項（重要）

1. **每位觀看者仍需用 EcoBear 帳號登入**。目前架構是每個人各自登入、
   token 存在自己瀏覽器。若要「完全公開、免登入」，需要在 function 端
   寫死一組唯讀帳號或 token（安全性取捨，另外處理）。
2. 登入帳密會經過 Cloudflare（或你選的平台）轉發到 `eb.ecobear.tw`，
   信任模型跟原本本機 proxy 一樣，只是換成雲端平台。
3. `proxy_server.py`、`generate_pdf.py`、`startup_guide.*` 部署時都用不到，
   可留著本機用。
