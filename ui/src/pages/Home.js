import WalletSelection from "../components/WalletSelection";
import BalanceDisplay from "../components/BalanceDisplay";
import HoverToReveal from "../components/HoverToReveal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faPlus } from "@fortawesome/free-solid-svg-icons";
import TxHistory from "../components/TxHistory";
import { useState, useEffect } from "react";
import Modal from "react-modal";
import { isValidBase58PrivateKey, createNewAccount } from "../utils/Solana";
import { useIndexedDB } from "../context/IndexeDBContext";

Modal.setAppElement("#root");

const Home = () => {
  const {
    addAccount,
    selectedAccount,
    setSelectedAccountAndUpdateStorage,
    fetchHomeData,
    fetchAccountData,
    accounts,
    txs,
  } = useIndexedDB();
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState("");
  const [newAccountPrivateKey, setNewAccountPrivateKey] = useState("");

  useEffect(() => {
    fetchHomeData();
  }, []);

  useEffect(() => {
    fetchAccountData(selectedAccount);
  }, [selectedAccount]);

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

  const createAccount = () => {
    const account = createNewAccount();
    addAccount(account);
    setNewAccountPrivateKey(account);
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
        <button>
          <FontAwesomeIcon icon={faGear} />
        </button>
        <p className="bundle-history-title">History</p>
        <button
          onClick={openAddAccountModal}
          className={accounts.length === 0 ? "pulse-green" : ""}
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
      <hr className="home-divider" />
      <TxHistory txs={txs} />
      <Modal
        isOpen={isAddAccountModalOpen}
        onRequestClose={closeAddAccountModal}
        contentLabel="Add Account Modal"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <button onClick={createAccount}>Create Account</button>
        {newAccountPrivateKey && <HoverToReveal text={newAccountPrivateKey} />}
        <p className="modal-info">OR</p>
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
