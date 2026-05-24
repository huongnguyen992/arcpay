'use client';

import { useState } from 'react';
import s from './panel.module.css';

const CHAINS = ['Arc_Testnet', 'Ethereum_Sepolia', 'Base_Sepolia', 'Arbitrum_Sepolia'];

interface TxResult {
  name: string;
  state: string;
  txHash?: string;
  explorerUrl?: string;
}

export default function UnifiedBalancePanel() {
  const [mode, setMode] = useState<'deposit' | 'spend'>('deposit');
  const [fromChain, setFromChain] = useState('Base_Sepolia');
  const [spendChain, setSpendChain] = useState('Arc_Testnet');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!amount) return;
    if (mode === 'spend' && !recipient) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const body = mode === 'deposit'
        ? { mode, fromChain, amount }
        : { mode, spendChain, recipient, amount };

      const res = await fetch('/api/unified-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed');
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
        <span className={s.panelIcon} style={{ color: 'var(--purple)' }}>◈</span>
        Unified Balance
      </h2>
      <p className={s.panelSub}>Combine USDC from multiple chains into one instantly spendable balance</p>

      {/* Mode toggle */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        marginBottom: 24,
        background: 'var(--bg2)',
        padding: 4,
        borderRadius: 12,
        border: '1px solid var(--border)',
      }}>
        {(['deposit', 'spend'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '10px',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'Syne, sans-serif',
              background: mode === m ? 'var(--purple)' : 'transparent',
              color: mode === m ? '#fff' : 'var(--text2)',
              transition: 'all 0.2s',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            {m === 'deposit' ? '⬇ Deposit' : '⬆ Spend'}
          </button>
        ))}
      </div>

      <div className={s.form}>
        {mode === 'deposit' ? (
          <>
            <div className={s.field}>
              <label className={s.label}>From Chain</label>
              <select className={s.select} value={fromChain} onChange={e => setFromChain(e.target.value)}>
                {CHAINS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
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
              Uses <code>kit.unifiedBalance.deposit()</code>. USDC is deposited into your chain-abstracted balance via Circle Gateway.
            </div>
          </>
        ) : (
          <>
            <div className={s.field}>
              <label className={s.label}>Spend on Chain</label>
              <select className={s.select} value={spendChain} onChange={e => setSpendChain(e.target.value)}>
                {CHAINS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className={s.field}>
              <label className={s.label}>Recipient Address</label>
              <input
                className={s.input}
                placeholder="0x..."
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>Amount (USDC)</label>
              <input
                className={s.input}
                placeholder="1.50"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
            <div className={s.note}>
              <span className={s.noteIcon}>ℹ</span>
              Uses <code>kit.unifiedBalance.spend()</code>. Draws from your combined balance and delivers to the recipient on the target chain.
            </div>
          </>
        )}

        <button
          className={`${s.submitBtn} ${s.submitBtnPurple}`}
          onClick={handleSubmit}
          disabled={loading || !amount || (mode === 'spend' && !recipient)}
        >
          {loading
            ? <><span className="spinner" /> Processing...</>
            : mode === 'deposit'
              ? `Deposit ${amount || '0'} USDC from ${fromChain.split('_')[0]}`
              : `Spend ${amount || '0'} USDC on ${spendChain.split('_')[0]}`}
        </button>
      </div>

      {result && (
        <div className={`${s.result} ${s.resultSuccess}`}>
          <div className={s.resultHeader}>✓ {mode === 'deposit' ? 'Deposited' : 'Spent'} Successfully</div>
          <div className={s.resultRow}><span className={s.resultKey}>status</span><span className={s.resultVal} style={{ color: 'var(--green)' }}>{result.state}</span></div>
          <div className={s.resultRow}><span className={s.resultKey}>operation</span><span className={s.resultVal}>{result.name}</span></div>
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
