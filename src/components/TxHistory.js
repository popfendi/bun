import TxLabel from "./TxLabel";
import { useMemo } from "react";

const TxHistory = (props) => {
  const sortedTxs = useMemo(() => {
    return [...props.txs].sort((a, b) => {
      return new Date(b.metadata.createdAt) - new Date(a.metadata.createdAt);
    });
  }, [props.txs]);

  return (
    <div className="tx-history-container">
      {sortedTxs.map((tx) => (
        <a
          href={
            tx.type === "transaction"
              ? `https://explorer.solana.com/tx/${tx.id}?cluster=devnet`
              : `https://explorer.jito.wtf/bundle/${tx.id}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="tx-label-link"
          key={tx.id}
        >
          <TxLabel key={tx.id} id={tx.id} status={tx.status} type={tx.type} />
        </a>
      ))}
    </div>
  );
};

export default TxHistory;
