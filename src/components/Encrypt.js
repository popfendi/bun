import React, { useState } from "react";

const EncryptionDecryptionDemo = () => {
  const [data, setData] = useState("");
  const [key, setKey] = useState("");
  const [encryptedResult, setEncryptedResult] = useState(null);
  const [decryptedData, setDecryptedData] = useState("");

  const encryptData = async () => {
    if (!data || !key) {
      alert("Please enter both data and key");
      return;
    }

    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(key),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
      );

      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedData = new TextEncoder().encode(data);
      const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        derivedKey,
        encodedData
      );

      const encryptedBase64 = btoa(
        String.fromCharCode(...new Uint8Array(encryptedData))
      );
      const ivBase64 = btoa(String.fromCharCode(...iv));
      const saltBase64 = btoa(String.fromCharCode(...salt));

      setEncryptedResult({
        encryptedData: encryptedBase64,
        iv: ivBase64,
        salt: saltBase64,
      });
      setDecryptedData("");
    } catch (error) {
      console.error("Encryption error:", error);
      alert("Encryption failed. Check console for details.");
    }
  };

  const decryptData = async () => {
    if (!encryptedResult || !key) {
      alert("Please encrypt data first and ensure key is entered");
      return;
    }

    try {
      const salt = Uint8Array.from(atob(encryptedResult.salt), (c) =>
        c.charCodeAt(0)
      );
      const iv = Uint8Array.from(atob(encryptedResult.iv), (c) =>
        c.charCodeAt(0)
      );
      const encryptedData = Uint8Array.from(
        atob(encryptedResult.encryptedData),
        (c) => c.charCodeAt(0)
      );

      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(key),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
      );

      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        derivedKey,
        encryptedData
      );

      const decryptedText = new TextDecoder().decode(decryptedBuffer);
      setDecryptedData(decryptedText);
    } catch (error) {
      console.error("Decryption error:", error);
      alert("Decryption failed. Check console for details.");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">Encryption/Decryption Demo</h2>
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="data"
        >
          Data:
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="data"
          type="text"
          value={data}
          onChange={(e) => setData(e.target.value)}
          placeholder="Enter data to encrypt/decrypt"
        />
      </div>
      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="key"
        >
          Key:
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="key"
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Enter encryption/decryption key"
        />
      </div>
      <div className="flex space-x-2 mb-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={encryptData}
        >
          Encrypt
        </button>
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={decryptData}
        >
          Decrypt
        </button>
      </div>
      {encryptedResult && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Encryption Result:</h3>
          <p className="text-sm break-all">
            <strong>Encrypted Data:</strong> {encryptedResult.encryptedData}
          </p>
          <p className="text-sm break-all">
            <strong>IV:</strong> {encryptedResult.iv}
          </p>
          <p className="text-sm break-all">
            <strong>Salt:</strong> {encryptedResult.salt}
          </p>
        </div>
      )}
      {decryptedData && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Decryption Result:</h3>
          <p className="text-sm break-all">
            <strong>Decrypted Data:</strong> {decryptedData}
          </p>
        </div>
      )}
    </div>
  );
};

export default EncryptionDecryptionDemo;
