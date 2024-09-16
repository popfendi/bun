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
  extractPublicKey,
  verifyPassword,
  deriveKeyFromPassword,
  encryptMasterKey,
  decryptMasterKey,
  generateTemporaryKey,
  decryptTempKey,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from "../utils/Encrypt";
import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

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
  const dataLoadedRef = useRef(null);
  const onLoadAccount = useRef(null);
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
          const transaction = request.result.transaction("auth", "readonly");
          const store = transaction.objectStore("auth");
          const countRequest = store.count();

          countRequest.onsuccess = () => {
            if (countRequest.result === 0) {
              setFirstLogin(true);
            }
          };

          countRequest.onerror = () => {
            console.error("Error checking auth store count");
          };
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
      const masterKey = await getSigningKey();
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
    if (!dataLoadedRef.current) {
      dataLoadedRef.current = new Promise(async (resolve) => {
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
          onLoadAccount.current = selectedAccount.publicKey;
          resolve(true);
        } catch (error) {
          console.error("Error fetching data from IndexedDB:", error);
          resolve(false);
        }
      });
    }
    return dataLoadedRef.current;
  }, [getAccounts, getBundles]);

  // was having issus with postmessage not waiting for data before trying to handle.
  const checkDataLoaded = async () => {
    return new Promise(async (resolve) => {
      // wait until dbInitializedRef.current is a promise and resolved
      while (
        !dbInitializedRef.current ||
        !(dbInitializedRef.current instanceof Promise)
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      await dbInitializedRef.current;

      // wait until dataLoadedRef.current is a promise and resolved
      while (
        !dataLoadedRef.current ||
        !(dataLoadedRef.current instanceof Promise)
      ) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      await dataLoadedRef.current;

      resolve(true);
    });
  };

  const register = useCallback(async () => {
    const crypto = window.crypto || window.msCrypto;
    try {
      const id = crypto.getRandomValues(new Uint8Array(32));

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const challengeBuffer = isoBase64URL.fromBuffer(challenge);
      const publicKeyCredentialCreationOptions = {
        challenge: challengeBuffer.toString(),
        rp: {
          name: "BUN",
          id: window.location.hostname,
        },
        user: {
          name: "BUN",
          displayName: "BUN",
          id: arrayBufferToBase64(id),
        },
        pubKeyCredParams: [
          { alg: -8, type: "public-key" }, // Ed25519
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "required",
          requireResidentKey: true,
        },
        timeout: 60000,
      };
      const credential = await startRegistration(
        publicKeyCredentialCreationOptions
      );

      const publicKey = extractPublicKey(credential.response.attestationObject);

      const masterKey = crypto.getRandomValues(new Uint8Array(32));
      const keyEncryptionSalt = crypto.getRandomValues(new Uint8Array(16));
      const keyEncryptionKey = await deriveKeyFromPassword(
        arrayBufferToBase64(credential.rawId),
        keyEncryptionSalt
      );

      const { encryptedMasterKey, iv: keyEncryptionIV } =
        await encryptMasterKey(masterKey, keyEncryptionKey);

      const authData = {
        topic: "auth",
        auth: {
          publicKey: arrayBufferToBase64(publicKey),
          counter: 0,
          passwordVersion: 2,
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

      await storeTemporaryAccess(masterKey);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  }, [add]);

  const login = useCallback(async () => {
    try {
      const storedData = await get("auth", "auth");

      const crypto = window.crypto || window.msCrypto;
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const challengeBuffer = isoBase64URL.fromBuffer(challenge);

      const publicKeyCredentialRequestOptions = {
        challenge: challengeBuffer,
        rpId: window.location.hostname,
        userVerification: "required",
        timeout: 60000,
      };
      const assertion = await startAuthentication(
        publicKeyCredentialRequestOptions
      );

      if (assertion.response.authenticatorData) {
        // Extract counter from authenticator data
        const dataView = new DataView(
          isoBase64URL.toBuffer(assertion.response.authenticatorData).buffer
        );
        const counter = dataView.getUint32(33);

        // verify counter if not 0 (prevent replay attacks) (some authenticators don't return a counter, in which case will always be 0)
        if (counter !== 0) {
          if (counter <= storedData.auth.counter) {
            throw new Error("Potential replay attack detected");
          }
          storedData.auth.counter = counter;
          await add("auth", storedData);
        }
      }

      const keyEncryptionKey = await deriveKeyFromPassword(
        arrayBufferToBase64(assertion.rawId),
        base64ToArrayBuffer(storedData.encryption.keyEncryptionSalt)
      );

      const masterKey = await decryptMasterKey(
        keyEncryptionKey,
        storedData.encryption
      );

      await updateLastLogin();
      await storeTemporaryAccess(masterKey);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }, [get]);

  const getSigningKey = useCallback(async () => {
    try {
      const storedData = await get("auth", "auth");

      const crypto = window.crypto || window.msCrypto;
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const challengeBuffer = isoBase64URL.fromBuffer(challenge);

      const publicKeyCredentialRequestOptions = {
        challenge: challengeBuffer,
        rpId: window.location.hostname,
        userVerification: "required",
        timeout: 60000,
      };
      const assertion = await startAuthentication(
        publicKeyCredentialRequestOptions
      );

      if (assertion.response.authenticatorData) {
        // Extract counter from authenticator data
        const dataView = new DataView(
          isoBase64URL.toBuffer(assertion.response.authenticatorData).buffer
        );
        const counter = dataView.getUint32(33);

        // verify counter if not 0 (prevent replay attacks) (some authenticators don't return a counter, in which case will always be 0)
        if (counter !== 0) {
          if (counter <= storedData.auth.counter) {
            throw new Error("Potential replay attack detected");
          }
          storedData.auth.counter = counter;
          await add("auth", storedData);
        }
      }

      const keyEncryptionKey = await deriveKeyFromPassword(
        arrayBufferToBase64(assertion.rawId),
        base64ToArrayBuffer(storedData.encryption.keyEncryptionSalt)
      );

      const masterKey = await decryptMasterKey(
        keyEncryptionKey,
        storedData.encryption
      );

      return masterKey;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }, [get]);

  const logout = useCallback(() => {
    sessionStorage.removeItem("master");
    localStorage.removeItem("encryptedMasterKey");
    localStorage.removeItem("masterKeyExpiration");
    localStorage.removeItem("tempKey");
    setIsLoggedIn(false);
    setSelectedAccount(null);
  }, []);

  const checkIfLoggedIn = useCallback(async () => {
    const logged = await getIsLoggedIn();
    if (logged) {
      setIsLoggedIn(true);
    }
  }, []);

  const storeTemporaryAccess = useCallback(async (masterKey) => {
    const expirationTime = Date.now() + 30 * 60 * 1000;

    localStorage.setItem("loginExpiration", expirationTime.toString());
  }, []);

  const getIsLoggedIn = useCallback(async () => {
    const expirationTime = parseInt(
      localStorage.getItem("loginExpiration") || "0",
      10
    );
    if (Date.now() > expirationTime) {
      return false;
    }
    return true;
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
    checkDataLoaded,
    onLoadAccount,
    getSigningKey,
  };

  return (
    <IndexedDBContext.Provider value={value}>
      {children}
    </IndexedDBContext.Provider>
  );
}
