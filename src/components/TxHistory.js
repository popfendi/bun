import TxLabel from "./TxLabel";

const TxHistory = () => {
  return (
    <div className="bundle-history-container">
      <TxLabel
        id="658ba7bf333cb8366006612028dee9a6580b445d59b0e7b2ede45f206fd203b7"
        status="pending"
        amount="-1.23"
        type="bundle"
      />
      <TxLabel
        id="658ba7bf333cb8366006612028dee9a6580b445d59b0e7b2ede45f206fd203b7"
        status="landed"
        amount="-1.23"
        type="bundle"
      />
      <TxLabel
        id="658ba7bf333cb8366006612028dee9a6580b445d59b0e7b2ede45f206fd203b7"
        status="failed"
        amount="-1.23"
        type="bundle"
      />
      <TxLabel
        id="658ba7bf333cb8366006612028dee9a6580b445d59b0e7b2ede45f206fd203b7"
        status="landed"
        amount="-1.23"
        type="transaction"
      />
    </div>
  );
};

export default TxHistory;
