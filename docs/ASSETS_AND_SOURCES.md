# 素材、來源與使用界線

## 案場圖片

既有網站使用 `public/photos/` 下由使用者在討論中提供的照片及街景截圖；本公開 GitHub 副本不包含影像檔。程式碼保留相對路徑，若有權使用照片，可自行放回對應目錄；否則案場照片區會顯示缺圖，但 Three.js 場景與視線計算仍可運作。

| 檔案 | 用途 |
|---|---|
| IMG_6729.jpeg | 右排風箱、內側百葉與停車計數器 |
| IMG_6730.jpeg | 左排風箱、第一行道樹與樹穴 |
| IMG_6731.jpeg | 兩座排風箱與入口相對位置 |
| IMG_6732.jpeg | 右側樹穴、枝葉與防撞柱 |
| IMG_6733.jpeg | 入口、立面、地磚及路側設施全景 |
| IMG_6681.jpeg、IMG_6682.jpeg、IMG_6680.jpeg | 較早建物外觀與入口重建參考 |
| IMG_6675.jpeg、IMG_6678.jpeg、IMG_6679.jpeg、IMG_6695.jpeg | 歷史候選位置與管線路徑標註 |

原始上傳檔名部分包含 `(1)`，網站資產採標準化檔名。未將拍攝方位或街景標籤視為精確測量證據。

## 法規與工程來源

原網站查核日期為 **2026-09-19**；本次 2026-09-24 原始碼整理未重新查核法規內容。以下連結沿用 `app/content.ts`，應在實際發包前重新核對。

- 校區：https://www.ext.scu.edu.tw/
- 臺北市廣告物管理：https://laws.gov.taipei/Law/LawSearch/LawArticleContent/FL079873
- 招牌廣告及樹立廣告管理：https://laws.gov.taipei/Law/LawSearch/LawArticleContent/FL030498
- 用戶用電設備裝置規則：https://law.moea.gov.tw/LawContent.aspx?id=FL011045
- 道路挖掘：https://laws.gov.taipei/Law/LawSearch/LawArticleContent/FL003974
- 挖掘施工維護：https://laws.gov.taipei/law/LawSearch/LawArticleContent/FL093698
- 職業安全衛生設施規則：https://laws.mol.gov.tw/FLAW/PrintFLAWDAT0201.aspx?beginpos=46&id=FL015021
- 簡化阻力公式：https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/drag-equation/

本文件是來源索引，不是本次重新作成的法律意見。原網站含適用條件說明，不應只擷取單一規費數字認定案件必然適用。

## 程式碼與第三方內容

保留原有 `build/sites-vite-plugin.LICENSE` 及 `vendor/shadcn-tailwind-4.13.0.LICENSE.md`。其他依賴請依各套件授權使用。此整理沒有加入整體 MIT 等授權，也沒有宣稱照片是可自由商用素材。

本專案的 GitHub repository 目前為公開，因此未收錄提供的照片與街景截圖。若將來公開放入圖片，應先確認影像的再散布範圍或改用已取得授權的素材。
