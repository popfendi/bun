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

Modal.setAppElement("#root");

class Account {
  constructor(
    publicKey,
    encryptedPrivateKey,
    keyEncryptionSalt,
    keyEncryptionIV
  ) {
    this.publicKey = publicKey;
    this.decryptionData = {
      encryptedPrivateKey: encryptedPrivateKey,
      keyEncryptionSalt: keyEncryptionSalt,
      keyEncryptionIV: keyEncryptionIV,
    };
  }
}

class Bundle {
  constructor(bundleID, signerAccount, totalValue, status, metadata) {
    this.bundleID = bundleID;
    this.signerAccount = signerAccount;
    this.totalValue = totalValue;
    this.status = status;
    this.metadata = metadata;
  }
}

const Home = (props) => {
  const [accounts, setAccounts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accountsTx = props.db.transaction("accounts", "readonly");
        const accountsStore = accountsTx.objectStore("accounts");
        const accountsRequest = accountsStore.getAll();

        accountsRequest.onsuccess = () => {
          setAccounts(accountsRequest.result);
          const selectedPublicKey = localStorage.getItem("selectedAccount");
          const selectedAccount = accountsRequest.result.find(
            (account) => account.publicKey === selectedPublicKey
          );
          setSelectedAccount(selectedAccount);
        };

        accountsRequest.onerror = () => {
          console.error("Error fetching accounts");
        };

        const bundlesTx = props.db.transaction("bundles", "readonly");
        const bundlesStore = bundlesTx.objectStore("bundles");
        const bundlesRequest = bundlesStore.getAll();

        bundlesRequest.onsuccess = () => {
          setBundles(bundlesRequest.result);
        };

        bundlesRequest.onerror = () => {
          console.error("Error fetching bundles");
        };
      } catch (error) {
        console.error("Error fetching data from IndexedDB:", error);
      }
    };

    fetchData();
  }, [props.db]);

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

  const addAccount = async (privateKey) => {
    const publicKey = getPublicKeyFromPrivateKey(privateKey);
    const masterKey = sessionStorage.getItem("master");
    const encryptionData = await encryptData(privateKey, masterKey);
    const newAccount = new Account(
      publicKey,
      encryptionData.encryptedPrivateKey,
      encryptionData.keyEncryptionSalt,
      encryptionData.keyEncryptionIV
    );
    await addAndSelectAccount(newAccount);
  };

  const decryptTest = async () => {
    const masterKey = sessionStorage.getItem("master");
    const decrypted = await decryptData(
      selectedAccount.decryptionData,
      masterKey
    );
    console.log(decrypted);
  };

  const addAndSelectAccount = async (account) => {
    const updatedAccounts = [...accounts, account];
    setAccounts(updatedAccounts);
    setSelectedAccount(account);

    const transaction = props.db.transaction(["accounts"], "readwrite");
    const accountsStore = transaction.objectStore("accounts");
    accountsStore.add(account);

    localStorage.setItem("selectedAccount", account.publicKey);

    transaction.oncomplete = () => {
      console.log("New account added and selected in IndexedDB");
    };

    transaction.onerror = (event) => {
      console.error(
        "Error updating IndexedDB with new account:",
        event.target.error
      );
    };
  };

  const setSelectedAccountAndUpdateStorage = (account) => {
    const foundAccount = accounts.find((acc) => acc.publicKey === account);
    if (foundAccount) {
      setSelectedAccount(foundAccount);
    } else {
      console.error("Account not found");
    }
    localStorage.setItem("selectedAccount", account);
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
