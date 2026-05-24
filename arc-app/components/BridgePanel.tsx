'use client';

import { useState } from 'react';
import s from './panel.module.css';

const CHAINS = ['Arc_Testnet', 'Ethereum_Sepolia', 'Base_Sepolia', 'Arbitrum_Sepolia', 'Solana_Devnet'];

interface TxResult {
  name: string;
  state: string;
  txHash?: string;
  explorerUrl?: string;
}

export default function BridgePanel() {
  const [fromChain, setFromChain] = useState('Ethereum_Sepolia');
  const [toChain, setToChain] = useState('Arc_Testnet');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState('');

  const swap = () => {
    const tmp = fromChain;
    setFromChain(toChain);
    setToChain(tmp);
  };

  const handleSubmit = async () => {
    if (!amount) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromChain, toChain, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bridge failed');
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
        <span className={s.panelIcon} style={{ color: 'var(--green)' }}>⇄</span>
        Bridge Tokens
      </h2>
      <p className={s.panelSub}>Transfer USDC across blockchains using CCTP (Circle Cross-Chain Transfer Protocol)</p>

      <div className={s.form}>
        <div className={s.field}>
          <label className={s.label}>From Chain</label>
          <select className={s.select} value={fromChain} onChange={e => setFromChain(e.target.value)}>
            {CHAINS.filter(c => c !== toChain).map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={swap}
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              color: 'var(--green)',
              borderRadius: '50%',
              width: 36,
              height: 36,
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            title="Swap chains"
          >
            ⇅
          </button>
        </div>

        <div className={s.field}>
          <label className={s.label}>To Chain</label>
          <select className={s.select} value={toChain} onChange={e => setToChain(e.target.value)}>
            {CHAINS.filter(c => c !== fromChain).map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
        </div>

        <div className={s.field}>
          <label className={s.label}>Amount (USDC)</label>
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
          Uses <code>kit.bridge()</code> via CCTP. Bridging can take 15–60 seconds depending on the source chain.
        </div>

        <button
          className={`${s.submitBtn} ${s.submitBtnGreen}`}
          onClick={handleSubmit}
          disabled={loading || !amount || fromChain === toChain}
        >
          {loading
            ? <><span className="spinner" /> Bridging...</>
            : `Bridge ${amount || '0'} USDC → ${toChain.split('_')[0]}`}
        </button>
      </div>

      {result && (
        <div className={`${s.result} ${s.resultSuccess}`}>
          <div className={s.resultHeader}>✓ Bridge Initiated</div>
          <div className={s.resultRow}><span className={s.resultKey}>status</span><span className={s.resultVal} style={{ color: 'var(--green)' }}>{result.state}</span></div>
          <div className={s.resultRow}><span className={s.resultKey}>from → to</span><span className={s.resultVal}>{fromChain.split('_')[0]} → {toChain.split('_')[0]}</span></div>
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
