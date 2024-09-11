import WalletSelection from "../components/WalletSelection";
import BalanceDisplay from "../components/BalanceDisplay";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faPlus } from "@fortawesome/free-solid-svg-icons";
import BundleHistory from "../components/BundleHistory";
import { useState, useEffect } from "react";
import Modal from "react-modal";
import {
  isValidBase58PrivateKey,
  getPublicKeyFromPrivateKey,
} from "../utils/Solana";
import { encryptData, decryptData } from "../utils/Encrypt";
import { useIndexedDB } from "../context/IndexeDBContext";

Modal.setAppElement("#root");

const Home = () => {
  const {
    getAccounts,
    getBundles,
    addAccount,
    selectedAccount,
    setSelectedAccount,
    setSelectedAccountAndUpdateStorage,
    fetchHomeData,
    accounts,
    bundles,
  } = useIndexedDB();
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState("");

  useEffect(() => {
    fetchHomeData();
  }, [getAccounts, getBundles, setSelectedAccount]);

  const openAddAccountModal = () => {
    setIsAddAccountModalOpen(true);
  };

  const closeAddAccountModal = () => {
    setIsAddAccountModalOpen(false);
  };

  const handleNewAccountInputChange = (e) => {
    setNewAccount(e.target.value);
  };

  const handleAddAccount = () => {
    if (isValidBase58PrivateKey(newAccount)) {
      addAccount(newAccount);
      setNewAccount("");
    } else {
      alert("Invalid Solana private key");
    }
    closeAddAccountModal();
  };

  const decryptTest = async () => {
    const masterKey = sessionStorage.getItem("master");
    const decrypted = await decryptData(
      selectedAccount.decryptionData,
      masterKey
    );
    console.log(decrypted);
  };

  return (
    <div className="home-container">
      <WalletSelection
        accounts={accounts}
        setSelectedAccount={setSelectedAccountAndUpdateStorage}
        selectedAccount={selectedAccount}
      />
      <BalanceDisplay selectedAccount={selectedAccount} />
      <div className="home-button-group">
        <button onClick={decryptTest}>
          <FontAwesomeIcon icon={faGear} />
        </button>
        <p className="bundle-history-title">Bundle History</p>
        <button
          onClick={openAddAccountModal}
          className={accounts.length === 0 ? "pulse-green" : ""}
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
      <hr className="home-divider" />
      <BundleHistory bundles={bundles} />
      <Modal
        isOpen={isAddAccountModalOpen}
        onRequestClose={closeAddAccountModal}
        contentLabel="Add Account Modal"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <p className="modal-title">add account</p>
        <input
          type="password"
          name="privateKey"
          placeholder="private key"
          value={newAccount}
          onChange={handleNewAccountInputChange}
        />
        <div className="add-modal-button-group">
          <button type="button" onClick={handleAddAccount}>
            Add
          </button>
          <button type="button" onClick={closeAddAccountModal}>
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Home;
