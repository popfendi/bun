import WalletSelection from "../components/WalletSelection";
import BalanceDisplay from "../components/BalanceDisplay";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faPlus } from "@fortawesome/free-solid-svg-icons";
import BundleHistory from "../components/BundleHistory";

const Home = () => {
  return (
    <div className="home-container">
      <WalletSelection />
      <BalanceDisplay />
      <div className="home-button-group">
        <button>
          <FontAwesomeIcon icon={faGear} />
        </button>
        <p className="bundle-history-title">Bundle History</p>
        <button>
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
      <hr className="home-divider" />
      <BundleHistory />
    </div>
  );
};

export default Home;
