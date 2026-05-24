# ArcPay 💸

> P2P USDC Payment App trên Arc Testnet — Full Stack (Smart Contract + Backend API + Frontend React)

## Kiến trúc

```
arcpay/
├── contracts/P2PPayment.sol    ← Solidity smart contract
├── scripts/deploy.js           ← Script deploy lên Arc Testnet
├── frontend/                   ← React app (Vite) → GitHub Pages
│   └── src/
│       ├── App.jsx             ← Giao diện chính
│       ├── useWallet.js        ← Hook kết nối MetaMask
│       └── config.js           ← Địa chỉ contract, ABI, config
├── backend/                    ← Express API → Railway
│   └── src/index.js            ← REST API đọc dữ liệu blockchain
├── .github/workflows/          ← CI/CD tự động deploy
├── hardhat.config.js
└── railway.toml
```

## Cách hoạt động

```
User (MetaMask) ──→ Frontend (GitHub Pages)
                         │
                         ├──→ Arc Testnet (giao dịch trực tiếp)
                         │
                         └──→ Backend API (Railway) ──→ Arc Testnet (đọc dữ liệu)
```

---

## Hướng dẫn cài đặt từng bước

### Bước 1: Clone project từ GitHub

```bash
git clone https://github.com/TEN_GITHUB_CUA_BAN/arcpay.git
cd arcpay
```

### Bước 2: Cài thư viện

```bash
npm run install:all
```

### Bước 3: Tạo file .env

```bash
cp .env.example .env
```

Mở file `.env` và điền private key ví của bạn:
```
DEPLOYER_PRIVATE_KEY=0x_private_key_cua_ban
```

> ⚠️ **QUAN TRỌNG**: Không bao giờ commit file `.env` lên GitHub!

### Bước 4: Lấy testnet USDC (làm gas)

Vào https://faucet.circle.com/ → chọn **Arc Testnet** → nhập địa chỉ ví → nhận USDC.

### Bước 5: Deploy smart contract

```bash
npm run compile
npm run deploy
```

Lệnh này tự động lưu địa chỉ contract vào `frontend/src/contract.json` và `backend/src/contract.json`.

### Bước 6: Chạy local để test

```bash
# Chạy cả backend lẫn frontend cùng lúc
npm run dev
```

Mở http://localhost:5173 trên trình duyệt.

---

## Deploy lên Internet

### Backend → Railway (miễn phí)

1. Vào https://railway.app và đăng nhập bằng GitHub
2. Nhấn **"New Project"** → **"Deploy from GitHub repo"**
3. Chọn repo `arcpay` → Railway tự detect `railway.toml`
4. Vào **Variables** → thêm biến: `PORT=3001`
5. Copy URL Railway được cấp (ví dụ: `https://arcpay.up.railway.app`)

### Frontend → GitHub Pages (tự động)

1. Vào **GitHub repo** → **Settings** → **Pages**
2. Source: **GitHub Actions**
3. Vào **Settings** → **Secrets and variables** → **Actions**
4. Thêm secret: `VITE_API_URL` = URL Railway ở bước trên
5. Push code lên GitHub → GitHub Actions tự build và deploy!

---

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/health` | Kiểm tra server |
| GET | `/api/stats` | Tổng số giao dịch |
| GET | `/api/balance/:address` | Số dư USDC của địa chỉ |
| GET | `/api/payments/:address` | Lịch sử gửi/nhận của địa chỉ |
| GET | `/api/payments/id/:id` | Chi tiết 1 giao dịch |

---

## Thông tin kỹ thuật

| | Giá trị |
|--|--|
| Network | Arc Testnet |
| Chain ID | 5042002 |
| RPC | https://rpc.testnet.arc.network |
| Explorer | https://testnet.arcscan.app |
| USDC (ERC-20) | 0x3600000000000000000000000000000000000000 |
| USDC decimals | 6 (ERC-20) / 18 (native gas) |
| Finality | < 1 giây |
