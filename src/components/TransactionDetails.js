import { updateMessageBlockhash, LAMPORTS_PER_SOL } from "../utils/Solana";
import { useEffect, useState } from "react";
import { useSolana } from "../context/SolanaContext";

const TransactionDetails = ({ requestDetails, selectedAccount }) => {
  const { getFeeForMessage, getRecentBlockhash, getBalanceDifference } =
    useSolana();
  const [instructions, setInstructions] = useState([]);
  const [fee, setFee] = useState(0);
  const [balanceDiff, setBalanceDiff] = useState(0);
  const [simLoading, setSimLoading] = useState(false);
  const [simSuccess, setSimSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const blockhash = await getRecentBlockhash();
      const transaction = updateMessageBlockhash(
        requestDetails.params.message,
        blockhash
      );

      const fee = await getFeeForMessage(
        transaction,
        requestDetails.params.message
      );
      console.log(fee);
      const balanceDiff = await getBalanceDifference(
        transaction,
        requestDetails.params.message,
        selectedAccount.publicKey
      );
      setBalanceDiff(balanceDiff);
      setFee(fee.value);
      setInstructions(transaction.instructions);
    };
    setSimLoading(true);
    try {
      fetchData();
      setSimSuccess(true);
    } catch (error) {
      console.error(error);
      setSimSuccess(false);
    } finally {
      setSimLoading(false);
    }
  }, [requestDetails]);

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
      <p className="request-details-text">
        TX amount: {handleDiffAndFee()}
        fee: {Number(fee) / LAMPORTS_PER_SOL}
      </p>
    </>
  );
};

export default TransactionDetails;
