import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClone } from "@fortawesome/free-solid-svg-icons";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";

const WalletSelection = () => {
  const [walletAddress, setWalletAddress] = useState(
    "96ELyqufdPB46V9mzYmaihMMqPXJP7eXJF6WCmuLnq2C"
  );
  const [showDropdown, setShowDropdown] = useState(false);

  const copyToClipboard = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(walletAddress).catch((err) => {
        console.error("Failed to copy: ", err);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = walletAddress;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        console.log("Fallback: Copying text command was successful");
      } catch (err) {
        console.error("Fallback: Oops, unable to copy", err);
      }
      document.body.removeChild(textArea);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const selectWallet = (address) => {
    setWalletAddress(address);
    setShowDropdown(false);
  };

  return (
    <div className="wallet-selection-container">
      <div className="wallet-selection-button-group">
        <p className="wallet-address-text">
          {walletAddress.length > 15
            ? `${walletAddress.substring(0, 15)}...`
            : walletAddress}
        </p>
        <button onClick={copyToClipboard}>
          <FontAwesomeIcon icon={faClone} />
        </button>
        <button onClick={toggleDropdown}>
          <FontAwesomeIcon icon={faCaretDown} />
        </button>
      </div>
      {showDropdown && (
        <div className="wallet-dropdown-container">
          <p
            className="wallet-dropdown-item"
            onClick={() =>
              selectWallet("96ELyqufdPB46V9mzYmaihMMqPXJP7eXJF6WCmuLnq2C")
            }
          >
            96ELyqufdPB46V9mzYmaihMMqPXJP7eXJF6WCmuLnq2C
          </p>
          <p
            className="wallet-dropdown-item"
            onClick={() =>
              selectWallet("Fb4ECLa5HjoBqQASRJ7Kc6XmryzxoHgZD4zwYN5oD6bn")
            }
          >
            Fb4ECLa5HjoBqQASRJ7Kc6XmryzxoHgZD4zwYN5oD6bn
          </p>
          <p
            className="wallet-dropdown-item"
            onClick={() =>
              selectWallet("CKojTApWctPEfatkX3AqQLQQjTqNorBnCpLxLMwM7ENi")
            }
          >
            CKojTApWctPEfatkX3AqQLQQjTqNorBnCpLxLMwM7ENi
          </p>
        </div>
      )}
    </div>
  );
};

export default WalletSelection;
