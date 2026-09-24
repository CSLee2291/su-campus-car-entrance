# 戶外字幕機 3D 設計安全實驗室 × ChatGPT Prompt 實作

以臺北市中正區貴陽街一段 56 號停車場入口為案例，使用 Three.js 比較電子看板位置、模擬駕駛視線，並整理由照片、需求到網站修正的 ChatGPT 協作方法。

- **已部署示範**：https://guiyang-sign-safety-lab.cs-lee.chatgpt.site
- **整理日期**：2026-09-24
- **原始網站版本**：Sites 第 6 版；來源 commit `d466aa022fe521818f452e20504f8cd1b7db838d`。
- **使用界線**：照片推估的概念模型，不是測量成果、施工圖、法規核定或安全鑑定。

## 先從哪裡開始

| 目的 | 文件 |
|---|---|
| 操作網站、了解預設條件 | [使用說明](docs/USER_GUIDE.md) |
| 學習如何描述需求與修正模型 | [ChatGPT Prompt 教學](docs/PROMPT_GUIDE.md) |
| 直接複製 Prompt 使用 | [Prompt 範本集](docs/PROMPT_TEMPLATES.md) |
| 回顧這次案例如何逐步成形 | [案例演進紀錄](docs/CASE_STUDY.md) |
| 修改 Three.js 模型、理解可見性計算 | [技術說明](docs/ARCHITECTURE.md) |
| 查看照片與第三方素材的使用範圍 | [素材與來源](docs/ASSETS_AND_SOURCES.md) |

## 最終確認的三處配置

左右以「站在街道，面向停車場入口」為準。

| 編號 | 位置 | 面板方向 | 正面朝向 |
|---|---|---|---|
| ① | 左排風口內側上方 | 沿車道方向 | 車道內側 |
| ② | 右排風口上方 | 與入口立面平行 | 街道 |
| ③ | 左側第一棵行道樹的樹穴旁 | 與入口立面平行（比較假設） | 街道 |

③ 使用獨立支架示意，沒有把看板綁在樹幹上。駕駛預設**從右側接近**，進度 80%、眼高 1.2 m、看行進方向、顯示既有樹木。

## 網站功能

- 駕駛視角：三方案獨立顯示、左右接近、轉頭看入口、路徑播放與俯視。
- 幾何比較：視野內且未遮擋比例、距離、斜視角與水平角寬。
- 危害動畫：雨水與漏電、延長線與絆倒、強風與脫落、夜間眩光、開挖與路面下陷、散熱不良。
- 照片對照：紅磚立面、雙側排風箱與朝車道的百葉、樹穴及入口設施。
- 設計、法規與費用：來源連結、適用條件及可填入報價的費用拆解。

## 本機執行

本專案沿用原網站的 React、TypeScript、Three.js、Vinext/Vite 與 Cloudflare Worker 架構。依 `package.json` 使用 Node.js **22.13.0 以上**及 pnpm **11.25.0**；依賴版本以 `pnpm-lock.yaml` 為準。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

一般本機設定使用 5173 埠，以終端顯示網址為準。建置及檢查：

```bash
pnpm exec tsc --noEmit --incremental false
pnpm build
pnpm start
```

`pnpm start` 啟動建置後的本機 Worker，並非部署到 GitHub Pages。此專案不能直接把原始碼當作靜態網站丟到 GitHub Pages；若要改為純靜態部署，需另做匯出與相容性調整。

## 專案結構

```text
app/scene.tsx              Three.js 場景、排風箱、樹木、看板與危害動畫
app/visibility.ts         看板座標／朝向、駕駛路徑及視線採樣
app/driver-comparison.tsx 駕駛比較介面
app/page.tsx              主頁與各功能分頁
app/content.ts            危害與設計文案、來源連結
app/entrance-photos.tsx   最新入口照片說明
public/photos/            照片放置目錄（公開 GitHub 副本不含照片）
components/ui/            原專案使用的 UI 元件
scripts/                  開發與建置輔助程式
build/                    Sites/Vite 整合
docs/                    教學、範本與案例文件
```

## GitHub 副本與既有網站的關係

這是獨立整理的原始碼副本；提交此專案**不會自動更新既有 Sites 網站**。已移除既有 Sites 專案綁定 ID，保留 `.openai/hosting.json` 的空白 D1/R2 設定以供本機建置。若之後要把 GitHub 與正式網站建立同步，需另外明確設定部署流程。

沒有收錄照片、密碼、Token、環境變數檔、`node_modules` 或建置輸出。此 GitHub 專案目前為公開；原網站的照片仍由網站保管，若要在本機顯示對照照片，請在有權使用的前提下自行放入 `public/photos/`。完整對話與其他個人資料沒有納入；Prompt 文件是依本案需求整理的教學版本，不是逐字對話匯出。

## 模型限制與授權

幾何可見比例不等於文字可讀率；動畫不是物理失效計算。法規頁原查核日期為 2026-09-19，本次整理沒有重新查核法律現況。施工與發包前仍需核對現場、設備及適用規範。

本次未擅自替整個專案指定開源授權。原有第三方 LICENSE 已保留；使用者提供的街景截圖及照片不代表取得任意再散布授權，詳見 [素材與來源](docs/ASSETS_AND_SOURCES.md)。
