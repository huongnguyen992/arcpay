'use client';

import { useState } from 'react';
import SendPanel from '@/components/SendPanel';
import BridgePanel from '@/components/BridgePanel';
import SwapPanel from '@/components/SwapPanel';
import UnifiedBalancePanel from '@/components/UnifiedBalancePanel';
import styles from './page.module.css';

type Tab = 'send' | 'bridge' | 'swap' | 'unified';

const TABS: { id: Tab; label: string; icon: string; color: string; desc: string }[] = [
  { id: 'send',    label: 'Send',            icon: '↗',  color: '#00d4ff', desc: 'Transfer tokens same chain' },
  { id: 'bridge',  label: 'Bridge',          icon: '⇄',  color: '#00e5a0', desc: 'Move assets crosschain' },
  { id: 'swap',    label: 'Swap',            icon: '⟳',  color: '#f97316', desc: 'Exchange tokens instantly' },
  { id: 'unified', label: 'Unified Balance', icon: '◈',  color: '#7c3aed', desc: 'Chain-abstracted liquidity' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('send');

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◆</span>
          <span>Arc<span className={styles.logoAccent}>Kit</span></span>
        </div>
        <div className={styles.headerRight}>
          <a
            href="https://testnet.arcscan.app"
            target="_blank"
            rel="noreferrer"
            className={styles.explorerLink}
          >
            Explorer ↗
          </a>
          <a
            href="https://faucet.circle.com"
            target="_blank"
            rel="noreferrer"
            className={styles.faucetBtn}
          >
            Faucet
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <p className={styles.heroTag}>Built on Arc Network · Powered by Circle</p>
        <h1 className={styles.heroTitle}>
          Multichain Finance<br />
          <span className={styles.heroGradient}>In a Few Lines of Code</span>
        </h1>
        <p className={styles.heroSub}>
          Send · Bridge · Swap · Unified Balance — all via Arc App Kit SDK
        </p>
      </section>

      {/* Tab Nav */}
      <nav className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ '--tab-color': tab.color } as React.CSSProperties}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
            <span className={styles.tabDesc}>{tab.desc}</span>
          </button>
        ))}
      </nav>

      {/* Panel */}
      <main className={styles.main}>
        <div className={styles.panel}>
          {activeTab === 'send'    && <SendPanel />}
          {activeTab === 'bridge'  && <BridgePanel />}
          {activeTab === 'swap'    && <SwapPanel />}
          {activeTab === 'unified' && <UnifiedBalancePanel />}
        </div>

        {/* Side info */}
        <aside className={styles.aside}>
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>🔗 Arc Testnet</h3>
            <div className={styles.infoRow}>
              <span>Chain ID</span>
              <span className="mono">2911</span>
            </div>
            <div className={styles.infoRow}>
              <span>RPC</span>
              <span className="mono" style={{ fontSize: 11 }}>testnet.arc.network</span>
            </div>
            <div className={styles.infoRow}>
              <span>Native Token</span>
              <span className="mono">ETH</span>
            </div>
            <div className={styles.infoRow}>
              <span>Stablecoin</span>
              <span className="mono">USDC · EURC</span>
            </div>
          </div>

          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>📦 App Kit SDK</h3>
            <div className={styles.infoRow}>
              <span>Package</span>
              <span className="mono" style={{ fontSize: 11 }}>@circle-fin/app-kit</span>
            </div>
            <div className={styles.infoRow}>
              <span>Adapter</span>
              <span className="mono" style={{ fontSize: 11 }}>adapter-viem-v2</span>
            </div>
            <div className={styles.infoRow}>
              <span>Protocol</span>
              <span className="mono">CCTP · Gateway</span>
            </div>
          </div>

          <div className={styles.docsCard}>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>
              Read the full documentation
            </p>
            <a
              href="https://docs.arc.network/build"
              target="_blank"
              rel="noreferrer"
              className={styles.docsBtn}
            >
              docs.arc.network ↗
            </a>
          </div>
        </aside>
      </main>

      <footer className={styles.footer}>
        <p>Built with <a href="https://docs.arc.network/app-kit" target="_blank" rel="noreferrer">Arc App Kit</a> · Deploy on <a href="https://vercel.com" target="_blank" rel="noreferrer">Vercel</a></p>
      </footer>
    </div>
  );
}
