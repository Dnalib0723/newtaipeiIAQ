# EB05 IAQ Dashboard 啟動指南

## 前置需求

- Python 3.8 以上版本
- 瀏覽器（Chrome 或 Edge）

---

## 步驟 1：安裝 Python 套件

在 PowerShell 中執行（僅需安裝一次）：

```powershell
pip install flask flask-cors requests
```

---

## 步驟 2：切換到專案資料夾

```powershell
cd "C:\Users\USER\Desktop\dashborad\dashboardv2"
```

---

## 步驟 3：啟動 Proxy Server

```powershell
python proxy_server.py
```

啟動成功後，終端機會顯示：

```
==================================================
EB05 Dashboard Proxy Server
==================================================
開啟瀏覽器前往: http://localhost:5050
按 Ctrl+C 停止伺服器
==================================================
 * Running on http://127.0.0.1:5050
```

> **注意：保持此 PowerShell 視窗開著，不要關閉。**

---

## 步驟 4：開啟瀏覽器

在瀏覽器網址列輸入：

```
http://localhost:5050
```

---

## 步驟 5：登入

| 欄位 | 說明 |
|------|------|
| 電子郵件 | 你的 EcoBear 帳號 email |
| 密碼 | 你的 EcoBear 密碼 |

登入後系統自動載入裝置列表與即時感測數據。

---

## 功能說明

| 功能 | 說明 |
|------|------|
| 側邊欄裝置列表 | 顯示帳號下所有 EB05 裝置，點擊切換 |
| 即時數據卡片 | CO₂、PM10、PM2.5、HCHO、CO、TVOC、溫度、濕度 |
| 歷史趨勢圖表 | 可選擇污染物與時間範圍（今天 / 7天 / 30天） |
| 下載 CSV | 匯出目前選取污染物的歷史資料 |
| 自動刷新 | 每 60 秒自動重新抓取最新數據 |

---

## 停止伺服器

在 PowerShell 視窗按下：

```
Ctrl + C
```

---

## 下次使用（套件已安裝，僅需以下兩步）

```powershell
cd "C:\Users\USER\Desktop\dashborad\dashboardv2"
python proxy_server.py
```

開啟瀏覽器前往 `http://localhost:5050` 即可。

---

## 注意事項

- Proxy server 必須持續執行，儀表板才能正常顯示資料
- Token 會儲存在瀏覽器 localStorage，下次開啟不需重新登入
- 如需登出，點擊側邊欄右下角的登出按鈕
- 警戒線標準：CO₂ 1000 ppm、PM10 75 μg/m³、PM2.5 35 μg/m³、HCHO 80 ppb、CO 9 ppm、TVOC 560 ppb

---

*© 2026 新北市政府環境保護局 · 室內空氣品質雲端平台*
