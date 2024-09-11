import React from "react";
import ConnectDetails from "../components/ConnectDetails";

const RequestPage = ({ requestDetails, onSign, onReject }) => {
  const handleTitle = () => {
    switch (requestDetails.method) {
      case "connect":
        return "Connect Request";
      case "signTransaction":
        return "Bundle Request";
    }
  };

  return (
    <div className="request-page-container">
      <h2 className="request-page-title">{handleTitle()}</h2>
      <div className="request-details-container">
        <ConnectDetails requestDetails={requestDetails} />
      </div>
      <button onClick={() => onSign(requestDetails)}>Confirm</button>
      <button onClick={() => onReject(requestDetails)}>Reject</button>
    </div>
  );
};

export default RequestPage;
