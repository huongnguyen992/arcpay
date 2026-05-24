const express = require("express");
const cors    = require("cors");
const { ethers } = require("ethers");
const contractInfo = require("./contract.json");

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Setup provider + contract (read-only) ────────────────────────────────────
const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");

const ABI = [
  "function totalPayments() view returns (uint256)",
  "function getSentPayments(address) view returns (uint256[])",
  "function getReceivedPayments(address) view returns (uint256[])",
  "function getPaymentsBatch(uint256[]) view returns (tuple(uint256 id, address sender, address recipient, uint256 amount, string memo, uint256 timestamp)[])",
  "function usdcBalanceOf(address) view returns (uint256)",
  "event PaymentSent(uint256 indexed id, address indexed sender, address indexed recipient, uint256 amount, string memo, uint256 timestamp)",
];

const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
];

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

const contract = new ethers.Contract(contractInfo.address, ABI, provider);
const usdc     = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);

// ── Helper ───────────────────────────────────────────────────────────────────
function formatPayment(p) {
  return {
    id:        p.id.toString(),
    sender:    p.sender,
    recipient: p.recipient,
    amount:    ethers.formatUnits(p.amount, 6),   // "1.000000" → số USDC
    memo:      p.memo,
    timestamp: Number(p.timestamp),
    time:      new Date(Number(p.timestamp) * 1000).toISOString(),
  };
}

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /api/health — kiểm tra server
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    contract: contractInfo.address,
    network: "Arc Testnet",
    chainId: contractInfo.chainId,
  });
});

// GET /api/stats — tổng số giao dịch
app.get("/api/stats", async (_req, res) => {
  try {
    const total = await contract.totalPayments();
    res.json({ totalPayments: total.toString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/balance/:address — số dư USDC ERC-20 (6 decimals)
app.get("/api/balance/:address", async (req, res) => {
  try {
    const { address } = req.params;
    if (!ethers.isAddress(address)) return res.status(400).json({ error: "Địa chỉ không hợp lệ" });

    const [erc20Bal, nativeBal] = await Promise.all([
      usdc.balanceOf(address),
      provider.getBalance(address),
    ]);

    res.json({
      address,
      usdc_erc20:  ethers.formatUnits(erc20Bal, 6),
      usdc_native: ethers.formatUnits(nativeBal, 18),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/payments/:address — lịch sử gửi + nhận của 1 địa chỉ
app.get("/api/payments/:address", async (req, res) => {
  try {
    const { address } = req.params;
    if (!ethers.isAddress(address)) return res.status(400).json({ error: "Địa chỉ không hợp lệ" });

    const [sentIds, recvIds] = await Promise.all([
      contract.getSentPayments(address),
      contract.getReceivedPayments(address),
    ]);

    // Merge + deduplicate
    const allIds = [...new Set([...sentIds, ...recvIds].map(i => i.toString()))];

    let payments = [];
    if (allIds.length > 0) {
      const raw = await contract.getPaymentsBatch(allIds.map(BigInt));
      payments = raw.map(formatPayment);
    }

    // Sort mới nhất trước
    payments.sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      address,
      sent:     payments.filter(p => p.sender.toLowerCase() === address.toLowerCase()),
      received: payments.filter(p => p.recipient.toLowerCase() === address.toLowerCase()),
      all:      payments,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/payments/id/:id — chi tiết 1 giao dịch
app.get("/api/payments/id/:id", async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const raw = await contract.getPaymentsBatch([id]);
    if (!raw.length || raw[0].id.toString() === "0") {
      return res.status(404).json({ error: "Không tìm thấy giao dịch" });
    }
    res.json(formatPayment(raw[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ ArcPay API chạy tại http://localhost:${PORT}`);
  console.log(`   Contract: ${contractInfo.address}`);
  console.log(`   Network:  Arc Testnet (chain 5042002)`);
});
