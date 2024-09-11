import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
  useState,
} from "react";
import {
  isValidBase58PrivateKey,
  getPublicKeyFromPrivateKey,
} from "../utils/Solana";
import {
  encryptData,
  decryptData,
  hashPassword,
  verifyPassword,
  deriveKeyFromPassword,
  encryptMasterKey,
  decryptMasterKey,
  generateTemporaryKey,
  decryptTempKey,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from "../utils/Encrypt";

const IndexedDBContext = createContext(null);

export class Account {
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

export class Bundle {
  constructor(bundleID, signerAccount, totalValue, status, metadata) {
    this.bundleID = bundleID;
    this.signerAccount = signerAccount;
    this.totalValue = totalValue;
    this.status = status;
    this.metadata = metadata;
  }
}

export function useIndexedDB() {
  const context = useContext(IndexedDBContext);
  if (context === null) {
    throw new Error("useIndexedDB must be used within an IndexedDBProvider");
  }
  return context;
}

export function IndexedDBProvider({ children }) {
  const dbRef = useRef(null);
  const dbInitializedRef = useRef(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [firstLogin, setFirstLogin] = useState(false);

  const initDB = useCallback(() => {
    if (!dbInitializedRef.current) {
      dbInitializedRef.current = new Promise((resolve) => {
        const request = indexedDB.open("BUN");

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains("auth")) {
            console.log("creating stores");
            db.createObjectStore("auth", { keyPath: "topic" });
            db.createObjectStore("bundles", { keyPath: "id" });
            db.createObjectStore("accounts", { keyPath: "publicKey" });
            db.createObjectStore("domains", { keyPath: "domain" });
            setFirstLogin(true);
          }
        };

        request.onsuccess = () => {
          dbRef.current = request.result;
          console.log("Database initialized successfully");
          resolve(true);
        };

        request.onerror = () => {
          console.error("Failed to initialize database");
          resolve(false);
        };
      });
    }
    return dbInitializedRef.current;
  }, []);

  useEffect(() => {
    initDB();
  }, [initDB]);

  const getAll = useCallback(async (storeName) => {
    await dbInitializedRef.current;
    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Error fetching ${storeName}`));
    });
  }, []);

  const add = useCallback(async (storeName, item) => {
    await dbInitializedRef.current;
    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error(`Error adding item to ${storeName}`));
    });
  }, []);

  const get = useCallback(async (storeName, key) => {
    await dbInitializedRef.current;
    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error(`Error getting item from ${storeName}`));
    });
  }, []);

  const update = useCallback(async (storeName, item) => {
    await dbInitializedRef.current;
    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error(`Error updating item in ${storeName}`));
    });
  }, []);

  const remove = useCallback(async (storeName, key) => {
    await dbInitializedRef.current;
    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Error deleting item from ${storeName}`));
    });
  }, []);

  const createDomain = useCallback(
    async (domain) => {
      return add("domains", domain);
    },
    [add]
  );

  const readDomain = useCallback(
    async (domainId) => {
      return get("domains", domainId);
    },
    [get]
  );

  const deleteDomain = useCallback(
    async (domainId) => {
      return remove("domains", domainId);
    },
    [remove]
  );

  const addAccount = useCallback(
    async (privateKey) => {
      if (!isValidBase58PrivateKey(privateKey)) {
        throw new Error("Invalid Solana private key");
      }

      const publicKey = getPublicKeyFromPrivateKey(privateKey);
      const masterKey = sessionStorage.getItem("master");
      const encryptionData = await encryptData(privateKey, masterKey);

      const newAccount = new Account(
        publicKey,
        encryptionData.encryptedPrivateKey,
        encryptionData.keyEncryptionSalt,
        encryptionData.keyEncryptionIV
      );

      await add("accounts", newAccount);
      setSelectedAccount(newAccount);
      setAccounts([...accounts, newAccount]);
      localStorage.setItem("selectedAccount", newAccount.publicKey);

      return newAccount;
    },
    [add]
  );

  const getAccounts = useCallback(async () => {
    return getAll("accounts");
  }, [getAll]);

  const getBundles = useCallback(async () => {
    return getAll("bundles");
  }, [getAll]);

  const setSelectedAccountAndUpdateStorage = useCallback(
    async (publicKey) => {
      const account = await get("accounts", publicKey);
      if (account) {
        setSelectedAccount(account);
        localStorage.setItem("selectedAccount", publicKey);
      } else {
        throw new Error("Account not found");
      }
    },
    [get]
  );

  const decryptPrivateKey = useCallback(async (account) => {
    const masterKey = sessionStorage.getItem("master");
    return decryptData(account.decryptionData, masterKey);
  }, []);

  useEffect(() => {
    const loadSelectedAccount = async () => {
      const selectedPublicKey = localStorage.getItem("selectedAccount");
      if (selectedPublicKey) {
        try {
          await setSelectedAccountAndUpdateStorage(selectedPublicKey);
        } catch (error) {
          console.error("Error loading selected account:", error);
        }
      }
    };

    loadSelectedAccount();
  }, [setSelectedAccountAndUpdateStorage]);

  const fetchHomeData = useCallback(async () => {
    try {
      const accounts = await getAccounts();
      const bundles = await getBundles();
      setAccounts(accounts);
      setBundles(bundles);

      const selectedPublicKey = localStorage.getItem("selectedAccount");
      let selectedAccount = null;
      if (selectedPublicKey) {
        selectedAccount = accounts.find(
          (account) => account.publicKey === selectedPublicKey
        );
      } else {
        selectedAccount = accounts[0];
      }
      setSelectedAccount(selectedAccount);
    } catch (error) {
      console.error("Error fetching data from IndexedDB:", error);
    }
  }, [getAccounts, getBundles]);

  const register = useCallback(
    async (password) => {
      const crypto = window.crypto || window.msCrypto;
      try {
        const authSalt = crypto.getRandomValues(new Uint8Array(16));
        const passwordHash = await hashPassword(password, authSalt);
        const masterKey = crypto.getRandomValues(new Uint8Array(32));
        const keyEncryptionSalt = crypto.getRandomValues(new Uint8Array(16));
        const keyEncryptionKey = await deriveKeyFromPassword(
          password,
          keyEncryptionSalt
        );
        const { encryptedMasterKey, iv: keyEncryptionIV } =
          await encryptMasterKey(masterKey, keyEncryptionKey);

        const authData = {
          topic: "auth",
          auth: {
            salt: arrayBufferToBase64(authSalt),
            passwordHash: arrayBufferToBase64(passwordHash),
            passwordVersion: 1,
          },
          encryption: {
            encryptedMasterKey: arrayBufferToBase64(encryptedMasterKey),
            keyEncryptionIV: arrayBufferToBase64(keyEncryptionIV),
            keyEncryptionSalt: arrayBufferToBase64(keyEncryptionSalt),
          },
          meta: {
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            version: "1.0",
          },
        };

        await add("auth", authData);
        setMasterKeyForSession(masterKey);
        await storeTemporaryAccess(masterKey);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Registration failed:", error);
        throw error;
      }
    },
    [add]
  );

  const login = useCallback(
    async (password) => {
      try {
        const storedData = await get("auth", "auth");
        const isPasswordValid = await verifyPassword(password, storedData.auth);
        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        const derivedKey = await deriveKeyFromPassword(
          password,
          base64ToArrayBuffer(storedData.encryption.keyEncryptionSalt)
        );

        const masterKey = await decryptMasterKey(
          derivedKey,
          storedData.encryption
        );

        setMasterKeyForSession(masterKey);
        await updateLastLogin();
        await storeTemporaryAccess(masterKey);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Login failed:", error);
        throw error;
      }
    },
    [get]
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem("master");
    localStorage.removeItem("encryptedMasterKey");
    localStorage.removeItem("masterKeyExpiration");
    localStorage.removeItem("tempKey");
    setIsLoggedIn(false);
    setSelectedAccount(null);
  }, []);

  const checkIfLoggedIn = useCallback(async () => {
    const storedMasterKey = await getStoredMasterKey();
    if (storedMasterKey) {
      setMasterKeyForSession(storedMasterKey);
      setIsLoggedIn(true);
    }
  }, []);

  const storeTemporaryAccess = useCallback(async (masterKey) => {
    const tempKey = await generateTemporaryKey();
    const encryptedData = await encryptData(
      masterKey,
      arrayBufferToBase64(tempKey)
    );
    const expirationTime = Date.now() + 30 * 60 * 1000;

    localStorage.setItem("encryptedMasterKey", JSON.stringify(encryptedData));
    localStorage.setItem("masterKeyExpiration", expirationTime.toString());
    localStorage.setItem("tempKey", arrayBufferToBase64(tempKey));
  }, []);

  const getStoredMasterKey = useCallback(async () => {
    const expirationTime = parseInt(
      localStorage.getItem("masterKeyExpiration") || "0",
      10
    );
    if (Date.now() > expirationTime) {
      localStorage.removeItem("encryptedMasterKey");
      localStorage.removeItem("masterKeyExpiration");
      localStorage.removeItem("tempKey");
      return null;
    }
    const encryptedData = JSON.parse(
      localStorage.getItem("encryptedMasterKey") || "null"
    );
    const tempKey = localStorage.getItem("tempKey");

    if (!encryptedData || !tempKey) {
      return null;
    }

    return await decryptTempKey(encryptedData, tempKey);
  }, []);

  const setMasterKeyForSession = useCallback((masterKey) => {
    const encodedMasterKey = arrayBufferToBase64(masterKey);
    sessionStorage.setItem("master", encodedMasterKey);
  }, []);

  const updateLastLogin = useCallback(async () => {
    const authData = await get("auth", "auth");
    if (authData) {
      authData.meta.lastLogin = new Date().toISOString();
      await update("auth", authData);
    }
  }, [get, update]);

  useEffect(() => {
    checkIfLoggedIn();
  }, [checkIfLoggedIn]);

  const value = {
    initDB,
    getAll,
    add,
    get,
    update,
    remove,
    createDomain,
    readDomain,
    deleteDomain,
    addAccount,
    getAccounts,
    getBundles,
    accounts,
    bundles,
    setSelectedAccountAndUpdateStorage,
    decryptPrivateKey,
    selectedAccount,
    fetchHomeData,
    register,
    login,
    logout,
    checkIfLoggedIn,
    isLoggedIn,
    setIsLoggedIn,
    firstLogin,
    setMasterKeyForSession,
    getStoredMasterKey,
  };

  return (
    <IndexedDBContext.Provider value={value}>
      {children}
    </IndexedDBContext.Provider>
  );
}
