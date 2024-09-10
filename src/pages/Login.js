import { useState, useEffect } from "react";
import {
  hashPassword,
  deriveKeyFromPassword,
  encryptMasterKey,
  decryptMasterKey,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  verifyPassword,
  generateTemporaryKey,
  encryptData,
  decryptTempKey,
} from "../utils/Encrypt";

const crypto = window.crypto || window.msCrypto;

const Login = (props) => {
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (props.firstLogin) {
        register();
      } else {
        login();
      }
    }
  };

  async function checkIfLoggedIn() {
    const storedMasterKey = await getStoredMasterKey();
    if (storedMasterKey) {
      console.log("setting master key for session");
      setMasterKeyForSession(storedMasterKey);

      props.setLoggedIn(true);
      return;
    }
  }

  useEffect(() => {
    if (!props.firstLogin) {
      checkIfLoggedIn();
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [password]);

  async function register() {
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

      await storeAuthData(authData);

      setMasterKeyForSession(masterKey);
      await storeTemporaryAccess(masterKey);
      props.setLoggedIn(true);
    } catch (error) {
      console.error("Registration failed:", error);
    }
  }

  async function login() {
    try {
      const storedData = await retrieveAuthData();

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
      props.setLoggedIn(true);
    } catch (error) {
      console.error("Login failed:", error);
      setLoginError(true);
    }
  }

  async function storeTemporaryAccess(masterKey) {
    const tempKey = await generateTemporaryKey();
    const encryptedData = await encryptData(
      masterKey,
      arrayBufferToBase64(tempKey)
    );

    const expirationTime = Date.now() + 30 * 60 * 1000;

    localStorage.setItem("encryptedMasterKey", JSON.stringify(encryptedData));
    localStorage.setItem("masterKeyExpiration", expirationTime.toString());
    localStorage.setItem("tempKey", arrayBufferToBase64(tempKey));
  }

  async function getStoredMasterKey() {
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
  }

  async function storeAuthData(authData) {
    const tx = props.db.transaction("auth", "readwrite");
    const store = tx.objectStore("auth");
    store.add(authData);
  }

  function setMasterKeyForSession(masterKey) {
    const encodedMasterKey = arrayBufferToBase64(masterKey);
    sessionStorage.setItem("master", encodedMasterKey);
  }

  async function retrieveAuthData() {
    return new Promise((resolve, reject) => {
      const tx = props.db.transaction("auth", "readonly");
      const store = tx.objectStore("auth");
      const getRequest = store.get("auth");

      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(getRequest.result);
        } else {
          reject("No auth record found");
        }
      };

      getRequest.onerror = () => {
        reject("Error retrieving auth record");
      };
    });
  }

  async function updateLastLogin() {
    const tx = props.db.transaction("auth", "readwrite");
    const store = tx.objectStore("auth");
    const getRequest = store.get("auth");

    getRequest.onsuccess = () => {
      if (getRequest.result) {
        const authData = getRequest.result;
        authData.meta.lastLogin = new Date().toISOString();
        const putRequest = store.put(authData);

        putRequest.onsuccess = () => {
          console.log("Last login time updated successfully");
        };

        putRequest.onerror = () => {
          console.error("Error updating last login time");
        };
      } else {
        console.error("No auth record found to update last login time");
      }
    };

    getRequest.onerror = () => {
      console.error(
        "Error retrieving auth record for updating last login time"
      );
    };
  }

  return (
    <div className="login-container">
      <input
        className="login-container-inner"
        type="password"
        placeholder="password"
        onChange={handlePasswordChange}
      />
      <button
        onClick={props.firstLogin ? register : login}
        className="login-button"
      >
        {props.firstLogin ? "register" : "login"}
      </button>
      <p
        className="login-text"
        style={{
          color: loginError ? "var(--color-red)" : "var(--color-dark-blue)",
        }}
      >
        {loginError
          ? "Invalid password"
          : "All data is encrypted and stored locally."}
      </p>
    </div>
  );
};

export default Login;
