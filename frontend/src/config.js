// Thông tin Arc Testnet
export const ARC_TESTNET = {
  chainId: "0x4CFF72",      // 5042002 dạng hex
  chainName:       "Arc Testnet",
  nativeCurrency:  { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls:         ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
};

export const CHAIN_ID_DEC = 5042002;
// USDC ERC-20 trên Arc Testnet (6 decimals)
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

// Contract ABI — chỉ những hàm cần dùng ở frontend
export const CONTRACT_ABI = [
  "function send(address recipient, uint256 amount, string calldata memo) external returns (uint256)",
  "function getSentPayments(address) view returns (uint256[])",
  "function getReceivedPayments(address) view returns (uint256[])",
  "function getPaymentsBatch(uint256[]) view returns (tuple(uint256 id, address sender, address recipient, uint256 amount, string memo, uint256 timestamp)[])",
  "function totalPayments() view returns (uint256)",
  "event PaymentSent(uint256 indexed id, address indexed sender, address indexed recipient, uint256 amount, string memo, uint256 timestamp)",
];

export const USDC_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

// URL của backend API
// Khi deploy production: thay bằng URL Railway của bạn
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Explorer
export const EXPLORER = "https://testnet.arcscan.app";
