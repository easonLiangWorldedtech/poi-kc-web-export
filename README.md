# poi-kc-web-export

poi 插件：將艦隊數據導出到 [kc-web](https://noro6.github.io/kc-web/)（制空権シミュレータ）

## 📋 功能

- 從 poi 讀取當前編隊的艦娘和裝備數據
- 轉換為 kc-web deck builder 格式
- 自動打開 webview 並導入數據到 kc-web
- 支援所有 8 個艦隊（第1～第8艦隊）

## 📦 安裝

### 方法一：從 npm 安裝（推薦）

```bash
# 在 poi 中直接搜索 "poi-plugin-kc-web-export"
```

### 方法二：手動安裝

1. 下載最新 release 的 `.zip` 文件
2. 解壓到 poi 插件目錄
3. 重啟 poi

## 🔧 使用方式

1. 在 poi 中編排好艦隊
2. 點擊工具欄中的「kc-web Export」圖標（🔗）
3. 選擇要導出的艦隊（第1～第8艦隊）
4. 自動打開 kc-web webview 並導入數據
5. 在 kc-web 中進行制空權模擬等計算

## 📊 支援的功能

| 功能 | 狀態 |
|------|------|
| 艦娘 ID | ✅ |
| 艦娘等級 | ✅ |
| 裝備（主砲、副砲、雷裝等） | ✅ |
| 補強增設 | ⏳ (未來支援) |
| 親密度 | ⏳ (未來支援) |
| 海色ribbon/白たすき | ⏳ (未來支援) |

## 📁 專案結構

```
poi-kc-web-export/
├── index.es          # 主插件入口
├── package.json      # npm 配置
├── README.md         # 說明文件
└── docs/
    ├── API.md        # poi API 參考
    └── FORMAT.md     # kc-web deck builder 格式說明
```

## 🛠️ 開發

### 環境要求

- Node.js >= 16
- poi >= 11.0.0

### 本地開發

```bash
# 克隆專案
git clone https://github.com/easonLiangWorldedtech/poi-kc-web-export.git
cd poi-kc-web-export

# 安裝依賴（poi 插件通常不需要額外依賴）
npm install

# 在 poi 中載入本地插件
# 設定 → 開發者選項 → 載入資料夾中的插件
```

### 測試

1. 編排一個艦隊
2. 點擊插件圖標
3. 確認 kc-web webview 正確顯示數據

## 📝 格式轉換

poi 的艦隊數據結構：

```javascript
{
  ships: [
    { id: 1, level: 80, equipment: [1, 2, 3, 4] },
    // ...
  ]
}
```

kc-web deck builder 格式：

```javascript
{
  version: 4,
  hqlv: 120,
  f1: {
    s1: { i: 1, lv: 80, is: [1, 2, 3, 4] },
    // ...
  }
}
```

轉換邏輯在 `index.es` 的 `convertToFleetFormat()` 函數中。

## 🤝 貢獻

歡迎提交 PR！請遵循以下步驟：

1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📄 授權

MIT License

## 🔗 相關連結

- [poi](https://github.com/poooi/poi) — 艦隊これくしょん瀏覽器
- [kc-web](https://noro6.github.io/kc-web/) — 制空権シミュレータ
- [KCV Wiki](https://kcwiki.moe/) — Kancolle Wiki
