import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLayerGroup,
  faHourglassHalf,
  faDiamond,
} from "@fortawesome/free-solid-svg-icons";

const TxLabel = (props) => {
  return (
    <div className="bundle-label-container">
      {props.status === "pending" ? (
        <FontAwesomeIcon icon={faHourglassHalf} />
      ) : props.type === "bundle" ? (
        <FontAwesomeIcon icon={faLayerGroup} />
      ) : (
        <FontAwesomeIcon icon={faDiamond} />
      )}
      <div className="bundle-label-text-container">
        <div className="bundle-label-text-left">
          <p className="bundle-label-text-id">{props.id}</p>
          <p
            className={`bundle-label-text-status status-colour-${props.status}`}
          >
            {props.status}
          </p>
        </div>
        <div className="bundle-label-text-right">
          <p className="bundle-label-text-amount">
            {props.amount}
            <span className="symbol">SOL</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TxLabel;
