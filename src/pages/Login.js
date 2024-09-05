import { useState } from "react";

const crypto = window.crypto || window.msCrypto;

const Login = (props) => {
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

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
      props.setLoggedIn(true);
    } catch (error) {
      console.error("Login failed:", error);
      setLoginError(true);
    }
  }

  function timingSafeEqual(a, b) {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }

    return result === 0;
  }

  function base64ToArrayBuffer(base64) {
    var binaryString = atob(base64);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    console.log(salt);
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new Uint8Array([...salt, ...passwordData])
    );
    return new Uint8Array(hashBuffer);
  }

  async function decryptMasterKey(derivedKey, encryptionData) {
    const iv = base64ToArrayBuffer(encryptionData.keyEncryptionIV);
    const encryptedKey = base64ToArrayBuffer(encryptionData.encryptedMasterKey);
    const decryptedKey = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      derivedKey,
      encryptedKey
    );
    return new Uint8Array(decryptedKey);
  }

  async function deriveKeyFromPassword(password, salt) {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      passwordData,
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }

  async function verifyPassword(password, authData) {
    const salt = new Uint8Array(base64ToArrayBuffer(authData.salt));
    const passwordHash = await hashPassword(password, salt);
    return timingSafeEqual(
      passwordHash,
      new Uint8Array(base64ToArrayBuffer(authData.passwordHash))
    );
  }

  async function encryptMasterKey(masterKey, keyEncryptionKey) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedMasterKey = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      keyEncryptionKey,
      masterKey
    );
    return { encryptedMasterKey: new Uint8Array(encryptedMasterKey), iv };
  }

  function arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
  }

  async function storeAuthData(authData) {
    const tx = props.db.transaction("auth", "readwrite");
    const store = tx.objectStore("auth");
    store.add(authData);
  }

  function setMasterKeyForSession(masterKey) {
    console.log(masterKey);
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
