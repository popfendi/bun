const ConnectDetails = ({ requestDetails }) => {
  return (
    <>
      <p className="request-details-text">
        <span className="connect-origin">{requestDetails.event.origin}</span>{" "}
        wants to connect.
      </p>
    </>
  );
};

export default ConnectDetails;
