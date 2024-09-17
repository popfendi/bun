import React from "react";
import ConnectDetails from "../components/ConnectDetails";
import BundleDetails from "../components/BundleDetails";
import TransactionDetails from "../components/TransactionDetails";

const RequestPage = ({ requestDetails, onSign, onReject, selectedAccount }) => {
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
        return <ConnectDetails requestDetails={requestDetails} />;
      case "signAndSendBundle":
        return <BundleDetails requestDetails={requestDetails} />;
      case "signAndSendTransaction":
        return (
          <TransactionDetails
            requestDetails={requestDetails}
            selectedAccount={selectedAccount}
          />
        );
    }
  };

  return (
    <div className="request-page-container">
      <h2 className="request-page-title">{handleTitle()}</h2>
      <div className="request-details-container">{handleDetails()}</div>
      <button onClick={() => onSign(requestDetails)}>Confirm</button>
      <button onClick={() => onReject(requestDetails)}>Reject</button>
    </div>
  );
};

export default RequestPage;
