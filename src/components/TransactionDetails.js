import { b58ToTransaction } from "../utils/Solana";
import { useEffect, useState } from "react";
import { getBalanceDifference } from "../utils/Solana";

const TransactionDetails = ({ requestDetails }) => {
  const [instructions, setInstructions] = useState([]);
  const [balanceDiff, setBalanceDiff] = useState(0);
  const [simSuccess, setSimSuccess] = useState(false);
  const [simLoading, setSimLoading] = useState(true);

  useEffect(() => {
    const simData = async () => {
      let diff = await getBalanceDifference(transaction, requestDetails.signer);
      console.log(diff);
    };

    const transaction = b58ToTransaction(requestDetails.params.message);
    setInstructions(transaction.instructions);
    simData();
  }, [requestDetails]);

  return (
    <>
      <p className="request-details-text">{requestDetails}</p>
    </>
  );
};

export default TransactionDetails;
