'use client';

import { useState } from 'react';
import s from './panel.module.css';

const CHAINS = ['Arc_Testnet', 'Ethereum_Sepolia', 'Base_Sepolia', 'Arbitrum_Sepolia'];
const TOKENS = ['USDC', 'EURC'];

interface TxResult {
  name: string;
  state: string;
  txHash?: string;
  explorerUrl?: string;
}

export default function SendPanel() {
  const [chain, setChain] = useState('Arc_Testnet');
  const [token, setToken] = useState('USDC');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!to || !amount) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chain, token, to, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transaction failed');
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className={s.panelTitle}>
        <span className={s.panelIcon} style={{ color: 'var(--accent)' }}>↗</span>
        Send Tokens
      </h2>
      <p className={s.panelSub}>Transfer stablecoins between wallets on the same blockchain</p>

      <div className={s.form}>
        <div className={s.row}>
          <div className={s.field}>
            <label className={s.label}>Chain</label>
            <select className={s.select} value={chain} onChange={e => setChain(e.target.value)}>
              {CHAINS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label}>Token</label>
            <select className={s.select} value={token} onChange={e => setToken(e.target.value)}>
              {TOKENS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className={s.field}>
          <label className={s.label}>Recipient Address</label>
          <input
            className={s.input}
            placeholder="0x..."
            value={to}
            onChange={e => setTo(e.target.value)}
          />
        </div>

        <div className={s.field}>
          <label className={s.label}>Amount</label>
          <input
            className={s.input}
            placeholder="1.00"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>

        <div className={s.note}>
          <span className={s.noteIcon}>ℹ</span>
          Uses <code>kit.send()</code> from <code>@circle-fin/app-kit</code>. Requires testnet USDC and native ETH for gas.
        </div>

        <button
          className={s.submitBtn}
          onClick={handleSubmit}
          disabled={loading || !to || !amount}
        >
          {loading ? <><span className="spinner" /> Sending...</> : `Send ${amount || '0'} ${token} ↗`}
        </button>
      </div>

      {result && (
        <div className={`${s.result} ${s.resultSuccess}`}>
          <div className={s.resultHeader}>✓ Transaction Sent</div>
          <div className={s.resultRow}><span className={s.resultKey}>status</span><span className={s.resultVal} style={{ color: 'var(--green)' }}>{result.state}</span></div>
          <div className={s.resultRow}><span className={s.resultKey}>name</span><span className={s.resultVal}>{result.name}</span></div>
          {result.txHash && <div className={s.resultRow}><span className={s.resultKey}>txHash</span><span className={s.resultVal}>{result.txHash.slice(0, 20)}...</span></div>}
          {result.explorerUrl && (
            <a href={result.explorerUrl} target="_blank" rel="noreferrer" className={s.explorerLink}>
              View on Explorer ↗
            </a>
          )}
        </div>
      )}

      {error && (
        <div className={`${s.result} ${s.resultError}`}>
          <div className={s.resultHeader}>✗ Error</div>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
