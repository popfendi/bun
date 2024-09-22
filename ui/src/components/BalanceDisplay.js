import { useEffect, useState } from "react";
import { useSolana } from "../context/SolanaContext";

const BalanceDisplay = (props) => {
  const [balance, setBalance] = useState(0.0);
  const [loading, setLoading] = useState(false);
  const { getUserBalance } = useSolana();

  useEffect(() => {
    const fetchBalance = async () => {
      if (props.selectedAccount) {
        setLoading(true);
        try {
          const b = await getUserBalance(props.selectedAccount.publicKey);
          setBalance(b);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchBalance();
  }, [props.selectedAccount, getUserBalance]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const fetchBalance = async () => {
        if (props.selectedAccount) {
          try {
            const b = await getUserBalance(props.selectedAccount.publicKey);
            setBalance(b);
          } catch (error) {
            console.error(error);
          }
        }
      };

      fetchBalance();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [props.selectedAccount, getUserBalance]);

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
