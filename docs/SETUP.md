# 俊鑫主控教育系統 — 設定指引

## 1. 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 建立新專案（例如 `grade8-9-edu`）
3. **Authentication** → Sign-in method → 啟用 **Google**
4. **Firestore Database** → 建立資料庫（建議先選測試模式，之後再套用 `firestore.rules`）
5. **專案設定** → 一般 → 新增 Web 應用程式 → 複製設定值

## 2. 本機環境變數

```bash
cp .env.example .env.local
```

填入 Firebase 設定與教師信箱：

```env
NEXT_PUBLIC_TEACHER_EMAILS=你的Gmail@gmail.com
```

## 3. 啟動開發伺服器

```bash
npm install
npm run dev
```

開啟 http://localhost:3000

## 4. 從 Google 試算表匯入學生

原系統座位表試算表 ID：`1GzToDiDVuLfDZ4Y67BABloyaldCgqv1zwtoT7UNJnYs`

1. 在 Google 試算表選擇 **檔案 → 下載 → CSV**
2. 整理成以下格式（或在試算表直接整理後匯出）：

```csv
班級,學號,姓名,段考成績
8A,1,王小明,85
8A,2,李小華,92
```

3. 教師登入 → 座位表 → 貼上 CSV → 匯入

## 5. 公布給學生

教師在座位表頁面按 **「公布給學生」** 後，學生可透過：

- `/view/seating` — 選擇已公布班級
- `/view/seating/8a` — 直接開啟特定班級（groupId）

## 6. 部署到 Vercel

1. 將程式碼推送到 GitHub
2. 在 [Vercel](https://vercel.com/) Import 專案
3. 在 Vercel 專案 Settings → Environment Variables 加入與 `.env.local` 相同的變數
4. Deploy

## 7. Firebase 授權網域

Firebase Console → Authentication → Settings → Authorized domains

加入：

- `localhost`
- 你的 Vercel 網域（例如 `xxx.vercel.app`）
