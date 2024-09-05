import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLayerGroup,
  faHourglassHalf,
} from "@fortawesome/free-solid-svg-icons";

const BundleLabel = (props) => {
  return (
    <div className="bundle-label-container">
      {props.status === "pending" ? (
        <FontAwesomeIcon icon={faHourglassHalf} />
      ) : (
        <FontAwesomeIcon icon={faLayerGroup} />
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

export default BundleLabel;
