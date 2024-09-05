import BundleLabel from "./BundleLabel";

const BundleHistory = () => {
  return (
    <div className="bundle-history-container">
      <BundleLabel
        id="658ba7bf333cb8366006612028dee9a6580b445d59b0e7b2ede45f206fd203b7"
        status="pending"
        amount="-1.23"
      />
      <BundleLabel
        id="658ba7bf333cb8366006612028dee9a6580b445d59b0e7b2ede45f206fd203b7"
        status="landed"
        amount="-1.23"
      />
      <BundleLabel
        id="658ba7bf333cb8366006612028dee9a6580b445d59b0e7b2ede45f206fd203b7"
        status="failed"
        amount="-1.23"
      />
    </div>
  );
};

export default BundleHistory;
