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
    navigator.clipboard.writeText(walletAddress);
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
            onClick={() => selectWallet("WalletAddress1")}
          >
            WalletAddress1
          </p>
          <p
            className="wallet-dropdown-item"
            onClick={() => selectWallet("WalletAddress2")}
          >
            WalletAddress2
          </p>
          <p
            className="wallet-dropdown-item"
            onClick={() => selectWallet("WalletAddress3")}
          >
            WalletAddress3
          </p>
        </div>
      )}
    </div>
  );
};

export default WalletSelection;
