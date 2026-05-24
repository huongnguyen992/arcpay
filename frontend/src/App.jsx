import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "./useWallet.js";
import { API_URL, EXPLORER, USDC_ADDRESS, USDC_ABI } from "./config.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
const short = (addr) => addr ? `${addr.slice(0,6)}…${addr.slice(-4)}` : "";
const fmtUsdc = (raw6) => parseFloat(ethers.formatUnits(raw6, 6)).toFixed(2);
const fmtTime = (ts) => new Date(Number(ts) * 1000).toLocaleString("vi-VN", {
  hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric"
});

// ── Styles chung ──────────────────────────────────────────────────────────────
const S = {
  page:   { minHeight: "100vh", display: "flex", flexDirection: "column" },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "1rem 2rem", borderBottom: "1px solid var(--border)",
    background: "var(--surface)",
  },
  logo:   { display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.02em" },
  logoIcon: {
    width: 32, height: 32, background: "var(--accent)", borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
  },
  main:   {
    flex: 1, maxWidth: 900, width: "100%", margin: "2rem auto",
    padding: "0 1.25rem",
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", alignItems: "start",
  },
  card:   {
    background: "var(--card)", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", padding: "1.5rem",
  },
  cardTitle: {
    fontSize: 12, fontWeight: 500, letterSpacing: "0.07em",
    textTransform: "uppercase", color: "var(--muted)", marginBottom: "1.25rem",
    display: "flex", alignItems: "center", gap: 8,
  },
  label:  { display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6, fontWeight: 500 },
  input:  {
    width: "100%", background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)", padding: "10px 14px", color: "var(--text)",
    fontFamily: "'DM Mono', monospace", fontSize: 13, outline: "none",
    transition: "border-color 0.15s",
  },
  btn:    (bg = "var(--accent)", color = "#fff") => ({
    width: "100%", padding: "11px", background: bg, border: "none",
    borderRadius: "var(--radius-sm)", color, fontFamily: "'DM Sans', sans-serif",
    fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8,
    transition: "opacity 0.15s",
  }),
};

// ── Component: Status Box ─────────────────────────────────────────────────────
function StatusBox({ msg, type }) {
  if (!msg) return null;
  const colors = {
    ok:   { bg: "var(--success-dim)", color: "var(--success)" },
    err:  { bg: "rgba(240,90,90,.12)", color: "var(--danger)" },
    info: { bg: "var(--accent-dim)",  color: "var(--accent)" },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: "var(--radius-sm)",
      background: c.bg, color: c.color, fontSize: 13, lineHeight: 1.5 }}
      dangerouslySetInnerHTML={{ __html: msg }} />
  );
}

// ── Component: Tx Item ────────────────────────────────────────────────────────
function TxItem({ tx, myAddr }) {
  const isOut = tx.sender.toLowerCase() === myAddr.toLowerCase();
  const other = isOut ? tx.recipient : tx.sender;
  const amt   = tx.amount ? fmtUsdc(tx.amount) : tx.amount_usdc;

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "auto 1fr auto",
      gap: 12, padding: "12px 14px", background: "var(--surface)",
      border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
      alignItems: "center", marginBottom: 6,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", display: "flex",
        alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0,
        background: isOut ? "rgba(240,168,61,.15)" : "var(--success-dim)",
        color: isOut ? "var(--warn)" : "var(--success)",
      }}>
        {isOut ? "↑" : "↓"}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "var(--muted)" }}>
          {isOut ? "Đến: " : "Từ: "}{short(other)}
        </div>
        {tx.memo && (
          <div style={{ fontSize: 12, color: "var(--text)", opacity: 0.7, marginTop: 2,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {tx.memo}
          </div>
        )}
        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
          {fmtTime(tx.timestamp)} · #{tx.id?.toString()}
        </div>
      </div>
      <a href={`${EXPLORER}/tx/${tx.txHash || ""}`} target="_blank" rel="noreferrer"
        style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 500, textDecoration: "none",
          color: isOut ? "var(--warn)" : "var(--success)" }}>
        {isOut ? "−" : "+"}{amt} USDC
      </a>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const {
    account, contract, usdcContract, balance, signer,
    isConnecting, error: walletError, networkOk, contractAddress, connect,
  } = useWallet();

  // Form state
  const [recipient, setRecipient] = useState("");
  const [amount,    setAmount]    = useState("");
  const [memo,      setMemo]      = useState("");
  const [status,    setStatus]    = useState({ msg: "", type: "" });
  const [loading,   setLoading]   = useState({ approve: false, send: false });

  // Data state
  const [txHistory,   setTxHistory]   = useState([]);
  const [apiStats,    setApiStats]    = useState(null);
  const [apiBalance,  setApiBalance]  = useState(null);
  const [activeTab,   setActiveTab]   = useState("send"); // "send" | "history" | "explorer"

  const isDeployed = contractAddress !== "0x0000000000000000000000000000000000000000";

  // Load API data
  const loadApiData = useCallback(async () => {
    try {
      const statsRes = await fetch(`${API_URL}/api/stats`);
      if (statsRes.ok) setApiStats(await statsRes.json());
    } catch (_) {}

    if (!account) return;
    try {
      const [balRes, txRes] = await Promise.all([
        fetch(`${API_URL}/api/balance/${account}`),
        fetch(`${API_URL}/api/payments/${account}`),
      ]);
      if (balRes.ok) setApiBalance(await balRes.json());
      if (txRes.ok) {
        const data = await txRes.json();
        setTxHistory(data.all || []);
      }
    } catch (_) {}
  }, [account]);

  useEffect(() => { loadApiData(); }, [loadApiData]);
  useEffect(() => {
    const iv = setInterval(loadApiData, 15000);
    return () => clearInterval(iv);
  }, [loadApiData]);

  // Approve USDC
  async function handleApprove() {
    if (!signer || !usdcContract) return setStatus({ msg: "Hãy kết nối ví trước", type: "err" });
    if (!amount || parseFloat(amount) <= 0) return setStatus({ msg: "Nhập số lượng USDC trước", type: "err" });
    if (!isDeployed) return setStatus({ msg: "⚠️ Contract chưa được deploy", type: "err" });

    setLoading(l => ({ ...l, approve: true }));
    setStatus({ msg: "Đang gửi approve… xác nhận trong MetaMask", type: "info" });
    try {
      const amt = ethers.parseUnits(amount, 6);
      const tx = await usdcContract.approve(contractAddress, amt, {
  gasLimit: 100000n,
});
      setStatus({ msg: `Approve đang xử lý: ${tx.hash.slice(0,14)}…`, type: "info" });
      await tx.wait();
      setStatus({ msg: "✅ Approve thành công! Giờ nhấn <b>Send</b>.", type: "ok" });
    } catch (e) {
      setStatus({ msg: "Lỗi approve: " + (e.reason || e.shortMessage || e.message), type: "err" });
    } finally {
      setLoading(l => ({ ...l, approve: false }));
    }
  }

  // Send USDC
  async function handleSend() {
    if (!signer || !contract) return setStatus({ msg: "Hãy kết nối ví trước", type: "err" });
    if (!ethers.isAddress(recipient)) return setStatus({ msg: "Địa chỉ người nhận không hợp lệ", type: "err" });
    if (!amount || parseFloat(amount) <= 0) return setStatus({ msg: "Nhập số lượng USDC hợp lệ", type: "err" });
    if (!isDeployed) return setStatus({ msg: "⚠️ Contract chưa được deploy", type: "err" });

    setLoading(l => ({ ...l, send: true }));
    setStatus({ msg: "Đang gửi giao dịch… xác nhận trong MetaMask", type: "info" });
    try {
      const amt = ethers.parseUnits(amount, 6);

      // Kiểm tra allowance
      const usdcRead = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const allowance = await usdcRead.allowance(account, contractAddress);
      if (allowance < amt) {
        return setStatus({ msg: "Chưa approve đủ USDC — nhấn <b>Approve</b> trước", type: "err" });
      }

      const tx = await contract.send(recipient, amt, memo);
      setStatus({ msg: `Tx đang xử lý: ${tx.hash.slice(0,14)}…`, type: "info" });
      const receipt = await tx.wait();

      setStatus({
        msg: `✅ Đã gửi ${amount} USDC! <a href="${EXPLORER}/tx/${receipt.hash}" target="_blank" style="color:var(--success)">Xem trên Explorer ↗</a>`,
        type: "ok",
      });
      setRecipient(""); setAmount(""); setMemo("");
      setTimeout(loadApiData, 2000);
    } catch (e) {
      setStatus({ msg: "Lỗi gửi: " + (e.reason || e.shortMessage || e.message), type: "err" });
    } finally {
      setLoading(l => ({ ...l, send: false }));
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>

      {/* Header */}
      <header style={S.header}>
        <div style={S.logo}>
          <div style={S.logoIcon}>◈</div>
          ArcPay
          <span style={{ color: "var(--muted)", fontWeight: 300, fontSize: "0.9rem" }}>/ USDC P2P</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Network badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 12,
            fontFamily: "'DM Mono',monospace", color: "var(--warn)",
            background: "rgba(240,168,61,.1)", border: "1px solid rgba(240,168,61,.25)",
            borderRadius: 20, padding: "4px 12px",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--warn)", display: "inline-block" }} />
            Arc Testnet
          </div>
          {/* Connect button */}
          <button onClick={connect} disabled={isConnecting} style={{
            ...S.btn(account ? "var(--success-dim)" : "var(--card)", account ? "var(--success)" : "var(--text)"),
            width: "auto", padding: "8px 18px", border: "1px solid var(--border-hi)", marginTop: 0,
          }}>
            {isConnecting ? "Đang kết nối…" : account ? `✓ ${short(account)}` : "Kết nối ví"}
          </button>
        </div>
      </header>

      {/* Wallet error */}
      {walletError && (
        <div style={{ maxWidth: 900, margin: "0.75rem auto", padding: "0 1.25rem", width: "100%" }}>
          <StatusBox msg={walletError} type="err" />
        </div>
      )}

      {/* Not connected overlay message */}
      {!account && (
        <div style={{
          maxWidth: 900, margin: "3rem auto", padding: "0 1.25rem", width: "100%",
          textAlign: "center",
        }}>
          <div style={{ ...S.card, maxWidth: 400, margin: "0 auto" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔐</div>
            <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Kết nối ví để bắt đầu</h2>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, marginBottom: "1.5rem" }}>
              ArcPay cần MetaMask kết nối vào Arc Testnet để gửi/nhận USDC.
            </p>
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: "1.25rem",
              fontFamily: "'DM Mono',monospace", fontSize: 11, color: "var(--muted)", textAlign: "left", lineHeight: 2,
            }}>
              <b style={{ color: "var(--text)" }}>Chain ID:</b> 5042002<br />
              <b style={{ color: "var(--text)" }}>RPC:</b> rpc.testnet.arc.network<br />
              <b style={{ color: "var(--text)" }}>Gas:</b> USDC
            </div>
            <button onClick={connect} style={S.btn()}>
              {isConnecting ? "Đang kết nối…" : "Connect MetaMask"}
            </button>
          </div>
        </div>
      )}

      {/* Main content — chỉ hiện khi đã connect */}
      {account && (
        <main style={S.main}>

          {/* ── Balance Card (full width) ── */}
          <div style={{ ...S.card, gridColumn: "1 / -1" }}>
            <div style={S.cardTitle}>
              <span style={{ width: 3, height: 14, background: "var(--accent)", borderRadius: 2, display: "inline-block" }} />
              Số dư ví
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <div style={{ fontSize: "2.5rem", fontWeight: 700, fontFamily: "'DM Mono',monospace", letterSpacing: "-0.04em" }}>
                {apiBalance ? apiBalance.usdc_erc20 : balance}
              </div>
              <div style={{ color: "var(--muted)", fontWeight: 300 }}>USDC</div>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              {account}
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.25rem" }}>
              {[
                { label: "Đã gửi",    value: txHistory.filter(t => t.sender?.toLowerCase() === account.toLowerCase()).length, color: "var(--accent)" },
                { label: "Đã nhận",   value: txHistory.filter(t => t.recipient?.toLowerCase() === account.toLowerCase()).length, color: "var(--success)" },
                { label: "Tổng onchain", value: apiStats?.totalPayments || "—", color: "var(--text)" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  flex: 1, background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)", padding: "12px 16px",
                }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 700, fontFamily: "'DM Mono',monospace", color, marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginTop: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
              {[["send","💸 Gửi"], ["history","📋 Lịch sử"], ["explorer","🔗 Explorer"]].map(([key, label]) => (
                <button key={key} onClick={() => setActiveTab(key)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "8px 16px", fontSize: 13, fontFamily: "'DM Sans',sans-serif",
                  color: activeTab === key ? "var(--accent)" : "var(--muted)",
                  borderBottom: activeTab === key ? "2px solid var(--accent)" : "2px solid transparent",
                  fontWeight: activeTab === key ? 600 : 400, marginBottom: -1,
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab: Gửi USDC ── */}
          {activeTab === "send" && (
            <>
              {/* Send form */}
              <div style={S.card}>
                <div style={S.cardTitle}>
                  <span style={{ width: 3, height: 14, background: "var(--accent)", borderRadius: 2, display: "inline-block" }} />
                  Gửi USDC
                </div>

                {!isDeployed && (
                  <div style={{ fontSize: 12, color: "var(--warn)", background: "rgba(240,168,61,.1)",
                    border: "1px solid rgba(240,168,61,.2)", borderRadius: "var(--radius-sm)",
                    padding: "10px 14px", marginBottom: "1rem", lineHeight: 1.6 }}>
                    ⚠️ Contract chưa deploy. Chạy <code>npm run deploy</code> trước.
                  </div>
                )}

                <div style={{ fontSize: 12, color: "var(--muted)", borderLeft: "3px solid var(--accent)",
                  padding: "8px 12px", marginBottom: "1rem", lineHeight: 1.7, borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                  background: "var(--surface)" }}>
                  Bước 1: <b style={{ color: "var(--text)" }}>Approve</b> → cho phép contract dùng USDC<br />
                  Bước 2: <b style={{ color: "var(--text)" }}>Send</b> → gửi USDC đến người nhận
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={S.label}>Địa chỉ người nhận</label>
                  <input value={recipient} onChange={e => setRecipient(e.target.value)}
                    placeholder="0x..." style={S.input}
                    onFocus={e => e.target.style.borderColor = "var(--accent)"}
                    onBlur={e => e.target.style.borderColor = "var(--border)"} />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={S.label}>Số lượng USDC</label>
                  <div style={{ position: "relative" }}>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                      placeholder="1.00" min="0.01" step="0.01"
                      style={{ ...S.input, paddingRight: 60 }}
                      onFocus={e => e.target.style.borderColor = "var(--accent)"}
                      onBlur={e => e.target.style.borderColor = "var(--border)"} />
                    <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                      fontSize: 12, color: "var(--muted)", fontFamily: "'DM Mono',monospace", pointerEvents: "none" }}>
                      USDC
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={S.label}>Ghi chú (tuỳ chọn)</label>
                  <textarea value={memo} onChange={e => setMemo(e.target.value)}
                    placeholder="Ví dụ: Thanh toán tháng 6…"
                    style={{ ...S.input, minHeight: 64, resize: "vertical", fontFamily: "'DM Sans',sans-serif" }}
                    onFocus={e => e.target.style.borderColor = "var(--accent)"}
                    onBlur={e => e.target.style.borderColor = "var(--border)"} />
                </div>

                <button onClick={handleApprove} disabled={loading.approve} style={S.btn("var(--surface)", "var(--accent)")}>
                  {loading.approve ? "Đang approve…" : "1. Approve USDC"}
                </button>
                <button onClick={handleSend} disabled={loading.send} style={S.btn()}>
                  {loading.send ? "Đang gửi…" : "2. Send Payment ↗"}
                </button>

                <StatusBox msg={status.msg} type={status.type} />
              </div>

              {/* Info card */}
              <div style={S.card}>
                <div style={S.cardTitle}>
                  <span style={{ width: 3, height: 14, background: "var(--accent)", borderRadius: 2, display: "inline-block" }} />
                  Thông tin contract
                </div>
                {[
                  ["Contract", contractAddress === "0x000...000" ? "Chưa deploy" : `${contractAddress.slice(0,8)}…${contractAddress.slice(-6)}`],
                  ["USDC (ERC-20)", "0x3600…0000"],
                  ["Chain ID", "5042002"],
                  ["RPC", "rpc.testnet.arc.network"],
                  ["Finality", "< 1 giây"],
                  ["Gas token", "USDC"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between",
                    padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                    <span style={{ color: "var(--muted)" }}>{k}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "var(--text)" }}>{v}</span>
                  </div>
                ))}

                <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { href: "https://faucet.circle.com/", label: "↗ Circle Faucet — lấy testnet USDC", color: "var(--accent)" },
                    { href: "https://testnet.arcscan.app/", label: "↗ Arc Testnet Explorer", color: "var(--muted)" },
                  ].map(({ href, label, color }) => (
                    <a key={href} href={href} target="_blank" rel="noreferrer" style={{
                      display: "block", textDecoration: "none", padding: "9px 12px",
                      border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                      fontSize: 13, color, transition: "border-color 0.15s",
                    }}
                      onMouseOver={e => e.currentTarget.style.borderColor = "var(--border-hi)"}
                      onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}
                    >{label}</a>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Tab: Lịch sử ── */}
          {activeTab === "history" && (
            <div style={{ ...S.card, gridColumn: "1 / -1" }}>
              <div style={S.cardTitle}>
                <span style={{ width: 3, height: 14, background: "var(--accent)", borderRadius: 2, display: "inline-block" }} />
                Lịch sử giao dịch
              </div>
              {txHistory.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)", fontSize: 14 }}>
                  Chưa có giao dịch nào. Hãy gửi USDC đầu tiên!
                </div>
              ) : (
                txHistory.map(tx => <TxItem key={tx.id?.toString()} tx={tx} myAddr={account} />)
              )}
            </div>
          )}

          {/* ── Tab: Explorer ── */}
          {activeTab === "explorer" && (
            <div style={{ ...S.card, gridColumn: "1 / -1" }}>
              <div style={S.cardTitle}>
                <span style={{ width: 3, height: 14, background: "var(--accent)", borderRadius: 2, display: "inline-block" }} />
                Tra cứu giao dịch
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={S.label}>Nhập địa chỉ ví để tra cứu</label>
                <ExplorerSearch apiUrl={API_URL} myAddr={account} />
              </div>
              <a href={`${EXPLORER}/address/${account}`} target="_blank" rel="noreferrer"
                style={{ ...S.btn("var(--surface)", "var(--accent)"), display: "block", textAlign: "center", textDecoration: "none", marginTop: 0 }}>
                Xem ví của bạn trên Explorer ↗
              </a>
            </div>
          )}

        </main>
      )}
    </div>
  );
}

// ── Component: Explorer Search ─────────────────────────────────────────────────
function ExplorerSearch({ apiUrl, myAddr }) {
  const [addr, setAddr]     = useState(myAddr || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!ethers.isAddress(addr)) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/payments/${addr}`);
      setResult(await res.json());
    } catch (_) {
      setResult({ error: "Không thể kết nối API" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={addr} onChange={e => setAddr(e.target.value)}
          placeholder="0x..." style={{ ...S.input, flex: 1 }}
          onFocus={e => e.target.style.borderColor = "var(--accent)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"} />
        <button onClick={search} style={{
          ...S.btn(), width: "auto", padding: "10px 20px", marginTop: 0,
        }}>
          {loading ? "…" : "Tìm"}
        </button>
      </div>
      {result && !result.error && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: "0.75rem" }}>
            Tìm thấy {result.all?.length || 0} giao dịch
          </div>
          {(result.all || []).map(tx => <TxItem key={tx.id?.toString()} tx={tx} myAddr={addr} />)}
        </div>
      )}
      {result?.error && <div style={{ color: "var(--danger)", fontSize: 13, marginTop: 8 }}>{result.error}</div>}
    </div>
  );
}
