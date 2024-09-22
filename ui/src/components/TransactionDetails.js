import { updateMessageBlockhash, LAMPORTS_PER_SOL } from "../utils/Solana";
import { useEffect, useState } from "react";
import { useSolana } from "../context/SolanaContext";
import InstructionDetails from "./InstructionDetails";
import sol from "../images/sol.svg";
import Modal from "react-modal";

Modal.setAppElement("#root");

const TransactionDetails = ({ requestDetails, selectedAccount }) => {
  const { getFeeForMessage, getRecentBlockhash, getBalanceDifference } =
    useSolana();
  const [instructions, setInstructions] = useState([]);
  const [fee, setFee] = useState(0);
  const [balanceDiff, setBalanceDiff] = useState(0);
  const [simLoading, setSimLoading] = useState(true);
  const [simSuccess, setSimSuccess] = useState(false);
  const [simError, setSimError] = useState("");
  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);

  const openInstructionsModal = () => {
    setInstructionsModalOpen(true);
  };

  const closeInstructionsModal = () => {
    setInstructionsModalOpen(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setSimLoading(true);

        const blockhash = await getRecentBlockhash();
        const transaction = updateMessageBlockhash(
          requestDetails.params.message,
          blockhash
        );

        setInstructions(transaction.instructions);

        const fee = await getFeeForMessage(
          transaction,
          requestDetails.params.message
        );

        const balanceDiff = await getBalanceDifference(
          transaction,
          requestDetails.params.message,
          selectedAccount.publicKey
        );

        setBalanceDiff(balanceDiff);
        setFee(fee.value);

        setSimSuccess(true);
      } catch (error) {
        setSimSuccess(false);
        setSimError(error.message);
        console.error("Error:", error);
      } finally {
        setSimLoading(false);
      }
    };

    fetchData();
  }, [
    requestDetails,
    getRecentBlockhash,
    getFeeForMessage,
    getBalanceDifference,
    selectedAccount.publicKey,
  ]);

  const handleDiffAndFee = () => {
    if (balanceDiff < 0) {
      return Number(balanceDiff + fee) / LAMPORTS_PER_SOL;
    } else if (balanceDiff > 0) {
      return Number(balanceDiff - fee) / LAMPORTS_PER_SOL;
    } else {
      return 0;
    }
  };

  return (
    <>
      <div
        className="transaction-details-container"
        onClick={openInstructionsModal}
      >
        <p className="details-click-text">
          {simLoading ? "Simulating..." : "click for details"}
        </p>
        {simError && (
          <p className="error-text">
            simulation error, transaction will likely fail
          </p>
        )}
        <div className="transaction-details-segment">
          <img src={sol} alt="sol" width={30} />
          <p
            className={
              handleDiffAndFee() < 0
                ? "status-colour-failed"
                : "status-colour-landed"
            }
          >
            {handleDiffAndFee()} SOL
          </p>
        </div>
        <div className="transaction-details-segment fee-details">
          <p>Network Fee: -{Number(fee) / LAMPORTS_PER_SOL} SOL</p>
        </div>
      </div>
      <Modal
        isOpen={instructionsModalOpen}
        onRequestClose={closeInstructionsModal}
        contentLabel="instructions modal"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <p className="instructions-title">instructions</p>
        {instructions.map((instruction, index) => (
          <InstructionDetails key={index} instruction={instruction} />
        ))}
      </Modal>
    </>
  );
};

export default TransactionDetails;
