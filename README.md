# Order Book Application

Order Book Demo Application.

## 技術架構

- **前端框架**：React 18 + TypeScript
- **構建工具**：Vite
- **狀態管理**：React Hooks (useState, useEffect, useRef, useCallback)
- **數據驗證**：Zod
- **WebSocket 連接**：原生 WebSocket API
- **樣式**：CSS 模組

## 本地開發

### 安裝依賴

```bash
npm install
```

### 啟動開發伺服器

```bash
npm run dev
```

### 構建生產版本

```bash
npm run build
```

### 執行生產版本

```bash
npm run preview
```

## 專案結構

```
src/
├── components/        # React 元件
│   ├── OrderBook.tsx  # OrderBook主元件
│   └── OrderBook.css  # OrderBook樣式
├── hooks/             # 自定義 React Hooks
│   ├── useWebSocket.ts  # WebSocket 連接
│   ├── useOrderBookWebSocket.ts  # OrderBook WebSocket 連接
│   └── useTradeWebSocket.ts      # Trade WebSocket 連接
├── types/             # TypeScript 類型定義
│   └── orderbook.ts   # OrderBook相關類型和 Zod 模式
├── utils/             # 工具函數
│   ├── formatNumber.ts  # 數字相關功能函式
│   └── orderBookUtils.ts  # OrderBook數據處理和格式化
└── App.tsx           # 應用入口
```
