import InstructionDetails from "./InstructionDetails";

const BundleInstructionDetails = ({ index, transaction }) => {
  const renderInstructionDetails = () => {
    return transaction.instructions.map((instruction, index) => (
      <InstructionDetails key={index} instruction={instruction} />
    ));
  };
  return (
    <div className="bundle-instruction-details">
      <p className="bundle-instruction-details-title">TX {index}</p>
      {renderInstructionDetails()}
    </div>
  );
};

export default BundleInstructionDetails;
