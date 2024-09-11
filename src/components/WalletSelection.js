import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClone } from "@fortawesome/free-solid-svg-icons";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";

const WalletSelection = (props) => {
  const [walletAddress, setWalletAddress] = useState("No Accounts ");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (props.selectedAccount) {
      setWalletAddress(props.selectedAccount.publicKey);
    }
  }, [props.selectedAccount]);

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
    console.log(props.accounts);
    setShowDropdown(!showDropdown);
  };

  const selectWallet = (address) => {
    setWalletAddress(address);
    props.setSelectedAccount(address);
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
          {props.accounts.map((account) => (
            <p
              key={account.publicKey}
              className={`wallet-dropdown-item ${
                account.publicKey === props.selectedAccount.publicKey
                  ? "selected-account"
                  : ""
              }`}
              onClick={() => selectWallet(account.publicKey)}
            >
              {account.publicKey}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default WalletSelection;
