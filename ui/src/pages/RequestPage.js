import React, { useState, useEffect } from "react";
import ConnectDetails from "../components/ConnectDetails";
import BundleDetails from "../components/BundleDetails";
import TransactionDetails from "../components/TransactionDetails";
import Modal from "react-modal";

const RequestPage = ({ requestDetails, onSign, onReject, selectedAccount }) => {
  const [jitoTipAmount, setJitoTipAmount] = useState(0);
  const [recommendedJitoTip, setRecommendedJitoTip] = useState(0.01);
  const [tipModalOpen, setTipModalOpen] = useState(false);

  const openTipModal = () => {
    setTipModalOpen(true);
  };

  const closeTipModal = () => {
    setTipModalOpen(false);
  };

  const handleTitle = () => {
    switch (requestDetails.method) {
      case "connect":
        return "Connect Request";
      case "signAndSendBundle":
        return "Bundle Request";
      case "signAndSendTransaction":
        return "Transaction Request";
    }
  };

  const handleDetails = () => {
    switch (requestDetails.method) {
      case "connect":
        return (
          <ConnectDetails
            requestDetails={requestDetails}
            selectedAccount={selectedAccount}
          />
        );
      case "signAndSendBundle":
        return (
          <BundleDetails
            requestDetails={requestDetails}
            selectedAccount={selectedAccount}
            jitoTipAmount={jitoTipAmount}
            setJitoTipAmount={setJitoTipAmount}
          />
        );
      case "signAndSendTransaction":
        return (
          <TransactionDetails
            requestDetails={requestDetails}
            selectedAccount={selectedAccount}
          />
        );
    }
  };

  const handleOnSign = () => {
    if (requestDetails.method == "signAndSendBundle") {
      let newRequestDetails = requestDetails;
      newRequestDetails.params.jitoTipAmount = jitoTipAmount;
      onSign(newRequestDetails);
    } else {
      onSign(requestDetails);
    }
  };

  return (
    <div className="request-page-container">
      <h2 className="request-page-title">{handleTitle()}</h2>
      <div className="request-details-container">{handleDetails()}</div>
      {requestDetails.method == "signAndSendBundle" && (
        <button className="status-colour-pending" onClick={openTipModal}>
          Set Tip
        </button>
      )}
      {jitoTipAmount < 0.000001 &&
      requestDetails.method == "signAndSendBundle" ? (
        <button onClick={null} className="button-disabled" disabled>
          Confirm
        </button>
      ) : (
        <button onClick={() => handleOnSign()} className="status-colour-landed">
          Confirm
        </button>
      )}

      <button
        onClick={() => onReject(requestDetails)}
        className="status-colour-failed"
      >
        Reject
      </button>
      <Modal
        isOpen={tipModalOpen}
        onRequestClose={closeTipModal}
        contentLabel="jito top modal"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <input
          className="login-container-inner"
          type="number"
          placeholder="Tip Amount"
          onChange={(e) => setJitoTipAmount(e.target.value)}
          value={jitoTipAmount}
        />
        <p className="tip-modal-text">
          Recommended tip:{" "}
          <a
            className="reccomended-text"
            onClick={() => setJitoTipAmount(recommendedJitoTip)}
          >
            {recommendedJitoTip}
          </a>{" "}
          SOL
        </p>
        <p className="tip-modal-text">must be greater than 0.000001 SOL</p>
        <button onClick={closeTipModal}>Save</button>
      </Modal>
    </div>
  );
};

export default RequestPage;
