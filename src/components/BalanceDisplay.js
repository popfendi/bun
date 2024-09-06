import { useEffect, useState } from "react";
import * as solanaWeb3 from "@solana/web3.js";
import { conf } from "../config";

const BalanceDisplay = (props) => {
  const [balance, setBalance] = useState(0.0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoading(true);
        const connection = new solanaWeb3.Connection(conf.DEV_RPC_URL);
        const publicKey = new solanaWeb3.PublicKey(
          props.selectedAccount.publicKey
        );
        const balance = await connection.getBalance(publicKey);
        const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;
        const roundedSolBalance = solBalance.toFixed(5);
        const finalBalance =
          solBalance.toString().length > roundedSolBalance.length
            ? roundedSolBalance
            : solBalance;
        setBalance(finalBalance);
      } catch (error) {
        console.error("Error fetching balance:", error);
      } finally {
        setLoading(false);
      }
    };

    if (props.selectedAccount) {
      fetchBalance();
    }
  }, [props.selectedAccount]);

  return (
    <div className="balance-display-container">
      <div className="balance-text">
        <p className="balance-number">{loading ? "🔍" : balance}</p>
        <p className="balance-symbol">SOL</p>
      </div>
    </div>
  );
};

export default BalanceDisplay;
