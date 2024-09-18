import { parseTransferSolInstruction } from "../utils/Solana";
import { useState, useEffect } from "react";

const InstructionDetails = ({ key, instruction }) => {
  const [isTransferSol, setIsTransferSol] = useState(false);
  const [data, setData] = useState(0);
  const [to, setTo] = useState("Unknown");

  useEffect(() => {
    const { isTransfer, amount, from, to } =
      parseTransferSolInstruction(instruction);
    console.log(parseTransferSolInstruction(instruction));
    setIsTransferSol(isTransfer);

    if (isTransfer) {
      setData(amount);
      setTo(to.toString());
    } else {
      setData(instruction.data);
      setTo(instruction.programId.toString());
    }
  }, [instruction]);

  const formatSolAddress = (address) => {
    if (address.length > 10) {
      return address.slice(0, 10) + "...";
    }
    return address;
  };

  if (isTransferSol) {
    return (
      <div className="instruction-details">
        <p>
          <span className="transfer-text">TRANSFER</span>{" "}
          <span className="amount-text">{data}</span> SOL TO{" "}
          <a href={`https://solscan.io/account/${to}`} target="_blank">
            <span className="recipient-text">{formatSolAddress(to)}</span>
          </a>
        </p>
      </div>
    );
  } else {
    return (
      <div className="instruction-details">
        <p>
          <span className="unknown-text">UNKNOWN</span> INTERACTION WITH{" "}
          <a href={`https://solscan.io/account/${to}`} target="_blank">
            <span className="recipient-text">{formatSolAddress(to)}</span>
          </a>
        </p>
      </div>
    );
  }
};

export default InstructionDetails;
