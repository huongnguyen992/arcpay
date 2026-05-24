'use client';

import { useState } from 'react';
import s from './panel.module.css';

const CHAINS = ['Arc_Testnet', 'Base_Sepolia', 'Arbitrum_Sepolia'];
const TOKEN_PAIRS: Record<string, string[]> = {
  Arc_Testnet: ['USDC', 'EURC'],
  Base_Sepolia: ['USDC', 'EURC'],
  Arbitrum_Sepolia: ['USDC', 'EURC'],
};

interface TxResult {
  name: string;
  state: string;
  txHash?: string;
  explorerUrl?: string;
  amountOut?: string;
}

export default function SwapPanel() {
  const [chain, setChain] = useState('Arc_Testnet');
  const [tokenIn, setTokenIn] = useState('USDC');
  const [tokenOut, setTokenOut] = useState('EURC');
  const [amountIn, setAmountIn] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState('');

  const tokens = TOKEN_PAIRS[chain] || ['USDC', 'EURC'];

  const handleFlip = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
  };

  const handleSubmit = async () => {
    if (!amountIn) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chain, tokenIn, tokenOut, amountIn }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Swap failed');
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
        <span className={s.panelIcon} style={{ color: 'var(--orange)' }}>⟳</span>
        Swap Tokens
      </h2>
      <p className={s.panelSub}>Exchange one stablecoin for another on the same blockchain</p>

      <div className={s.form}>
        <div className={s.field}>
          <label className={s.label}>Chain</label>
          <select className={s.select} value={chain} onChange={e => setChain(e.target.value)}>
            {CHAINS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
        </div>

        <div style={{ position: 'relative' }}>
          <div className={s.row}>
            <div className={s.field}>
              <label className={s.label}>From Token</label>
              <select className={s.select} value={tokenIn} onChange={e => setTokenIn(e.target.value)}>
                {tokens.filter(t => t !== tokenOut).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className={s.field}>
              <label className={s.label}>To Token</label>
              <select className={s.select} value={tokenOut} onChange={e => setTokenOut(e.target.value)}>
                {tokens.filter(t => t !== tokenIn).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={handleFlip}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) translateY(10px)',
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              color: 'var(--orange)',
              borderRadius: '50%',
              width: 30,
              height: 30,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            ⇄
          </button>
        </div>

        <div className={s.field}>
          <label className={s.label}>Amount In</label>
          <input
            className={s.input}
            placeholder="1.00"
            type="number"
            min="0"
            step="0.01"
            value={amountIn}
            onChange={e => setAmountIn(e.target.value)}
          />
        </div>

        <div className={s.note}>
          <span className={s.noteIcon}>ℹ</span>
          Uses <code>kit.swap()</code>. Requires a <strong>Kit Key</strong> from{' '}
          <a href="https://console.circle.com" target="_blank" rel="noreferrer">Circle Console</a> (free).
          Set <code>KIT_KEY</code> in your <code>.env.local</code>.
        </div>

        <button
          className={`${s.submitBtn} ${s.submitBtnOrange}`}
          onClick={handleSubmit}
          disabled={loading || !amountIn}
        >
          {loading
            ? <><span className="spinner" /> Swapping...</>
            : `Swap ${amountIn || '0'} ${tokenIn} → ${tokenOut}`}
        </button>
      </div>

      {result && (
        <div className={`${s.result} ${s.resultSuccess}`}>
          <div className={s.resultHeader}>✓ Swap Complete</div>
          <div className={s.resultRow}><span className={s.resultKey}>status</span><span className={s.resultVal} style={{ color: 'var(--green)' }}>{result.state}</span></div>
          <div className={s.resultRow}><span className={s.resultKey}>pair</span><span className={s.resultVal}>{tokenIn} → {tokenOut}</span></div>
          {result.amountOut && <div className={s.resultRow}><span className={s.resultKey}>received</span><span className={s.resultVal}>{result.amountOut} {tokenOut}</span></div>}
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
