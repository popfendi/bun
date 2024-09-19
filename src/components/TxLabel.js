import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLayerGroup,
  faHourglassHalf,
  faDiamond,
} from "@fortawesome/free-solid-svg-icons";

const TxLabel = (props) => {
  return (
    <div className="tx-label-container">
      {props.status === "pending" ? (
        <FontAwesomeIcon icon={faHourglassHalf} />
      ) : props.type === "bundle" ? (
        <FontAwesomeIcon icon={faLayerGroup} />
      ) : (
        <FontAwesomeIcon icon={faDiamond} />
      )}
      <div className="tx-label-text-container">
        <div className="tx-label-text">
          <p className="tx-label-text-id">{props.id}</p>
          <p className={`tx-label-text-status status-colour-${props.status}`}>
            {props.status}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TxLabel;
