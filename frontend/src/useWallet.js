import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ARC_TESTNET, CHAIN_ID_DEC, USDC_ADDRESS, USDC_ABI, CONTRACT_ABI } from "./config.js";

// Đọc địa chỉ contract từ file được tạo lúc deploy
import contractInfo from "./contract.json";
const CONTRACT_ADDRESS = contractInfo.address || "0x0000000000000000000000000000000000000000";

export function useWallet() {
  const [account,       setAccount]       = useState(null);
  const [provider,      setProvider]      = useState(null);
  const [signer,        setSigner]        = useState(null);
  const [contract,      setContract]      = useState(null);
  const [usdcContract,  setUsdcContract]  = useState(null);
  const [balance,       setBalance]       = useState("0.00");
  const [isConnecting,  setIsConnecting]  = useState(false);
  const [error,         setError]         = useState(null);
  const [networkOk,     setNetworkOk]     = useState(false);

  const contractAddress = CONTRACT_ADDRESS;

  // Refresh số dư
  const refreshBalance = useCallback(async (prov, addr) => {
    try {
      const native = await prov.getBalance(addr);
      setBalance(parseFloat(ethers.formatUnits(native, 18)).toFixed(4));
    } catch (_) {}
  }, []);

  // Kết nối ví
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("Không tìm thấy MetaMask. Hãy cài tại metamask.io");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const prov = new ethers.BrowserProvider(window.ethereum);
      await prov.send("eth_requestAccounts", []);

      // Switch sang Arc Testnet
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ARC_TESTNET.chainId }],
        });
      } catch (sw) {
        if (sw.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [ARC_TESTNET],
          });
        } else throw sw;
      }

      const prov2  = new ethers.BrowserProvider(window.ethereum);
      const sgn    = await prov2.getSigner();
      const addr   = await sgn.getAddress();
      const net    = await prov2.getNetwork();
      const onArc  = true;

      setProvider(prov2);
      setSigner(sgn);
      setAccount(addr);
      setNetworkOk(onArc);

      if (onArc && contractAddress !== "0x0000000000000000000000000000000000000000") {
        setContract(new ethers.Contract(contractAddress, CONTRACT_ABI, sgn));
        setUsdcContract(new ethers.Contract(USDC_ADDRESS, USDC_ABI, sgn));
      }

      await refreshBalance(prov2, addr);
    } catch (e) {
      if (e.code !== 4001) setError(e.reason || e.message || "Lỗi kết nối");
    } finally {
      setIsConnecting(false);
    }
  }, [contractAddress, refreshBalance]);

  // Lắng nghe thay đổi account/chain
  useEffect(() => {
    if (!window.ethereum) return;
    const reload = () => window.location.reload();
    window.ethereum.on("accountsChanged", reload);
    window.ethereum.on("chainChanged",    reload);
    return () => {
      window.ethereum.removeListener("accountsChanged", reload);
      window.ethereum.removeListener("chainChanged",    reload);
    };
  }, []);

  // Poll balance mỗi 10s
  useEffect(() => {
    if (!provider || !account) return;
    const iv = setInterval(() => refreshBalance(provider, account), 10000);
    return () => clearInterval(iv);
  }, [provider, account, refreshBalance]);

  return {
    account, provider, signer, contract, usdcContract,
    balance, isConnecting, error, networkOk, contractAddress,
    connect, refreshBalance,
  };
}
