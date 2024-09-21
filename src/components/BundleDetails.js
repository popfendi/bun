import { updateMessageBlockhash, LAMPORTS_PER_SOL } from "../utils/Solana";
import { useEffect, useState } from "react";
import { useSolana } from "../context/SolanaContext";
import BundleInstructionDetails from "./BundleInstructionDetails";
import Modal from "react-modal";

const BundleDetails = ({
  requestDetails,
  selectedAccount,
  jitoTipAmount,
  setJitoTipAmount,
}) => {
  const {
    getFeeForMessage,
    getRecentBlockhash,
    getBalanceDifference,
    instructionIsJitoTip,
  } = useSolana();
  const [fee, setFee] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);
  const [tipIsAddedToTx, setTipIsAddedToTx] = useState(false);

  const openInstructionsModal = () => {
    setInstructionsModalOpen(true);
  };

  const closeInstructionsModal = () => {
    setInstructionsModalOpen(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const blockhash = await getRecentBlockhash();

        const updatedTransactions = requestDetails.params.message.map((msg) =>
          updateMessageBlockhash(msg, blockhash)
        );

        setTransactions(updatedTransactions);

        const totalFee = await Promise.all(
          updatedTransactions.map((tx) =>
            getFeeForMessage(tx, requestDetails.params.message)
          )
        ).then((fees) => fees.reduce((acc, fee) => acc + fee.value, 0));

        setFee(totalFee);

        // check if the last instruction in the last transaction in the bundle is a jito tip
        const hasJitoTip = instructionIsJitoTip(
          updatedTransactions[
            updatedTransactions.length - 1
          ].instructions.slice(-1)[0]
        );

        if (hasJitoTip) {
          setTipIsAddedToTx(true);
        } else {
          setTipIsAddedToTx(false);
          setJitoTipAmount(0);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
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

  return (
    <>
      <div
        className="transaction-details-container"
        onClick={openInstructionsModal}
      >
        <p className="details-click-text">click for details</p>

        <div className="transaction-details-segment">
          <p>
            {jitoTipAmount == 0
              ? "Tip Must Be Set"
              : `Jito Tip: -${jitoTipAmount} SOL`}
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
        <p className="instructions-title">transactions</p>
        {transactions.map((transaction, index) => (
          <BundleInstructionDetails
            key={index}
            index={index}
            transaction={transaction}
          />
        ))}
      </Modal>
    </>
  );
};

export default BundleDetails;
