import { Messenger } from "./messenger.js";
import { BUN_URL } from "./utils/constants.js";
import { v4 as uuidv4 } from "uuid";

class Provider {
  constructor() {
    this.publicKey = null;
    this.isConnected = false;
    this.events = {};
    this.messenger = Messenger.getInstance(BUN_URL);
  }

  /**
   * Connects the provider.
   * @param {Object} [options={}] - Optional parameters for connection.
   * @param {boolean} [options.onlyIfTrusted=false] - If true, only connects if trusted.
   * @returns {Promise<Object>} - Resolves to the response object or rejects with an error.
   */
  async connect(options = {}) {
    return new Promise(async (resolve, reject) => {
      let message = {
        method: "connect",
        params: options,
        requestId: uuidv4(),
      };
      try {
        const response =
          await this.messenger.postRequestAndWaitForResponse(message);

        if (response.status !== "success") {
          return reject(new Error(`Connection failed: ${response.data.error}`));
        }
        this.isConnected = true;
        this.publicKey = response.data.account;
        this._emitEvent("accountChanged", this.publicKey);
        resolve(response.data.account);
      } catch (error) {
        reject(new Error(`Connection failed: ${error.message}`));
      }
    });
  }

  /**
   * Disconnects the provider.
   * @returns {Promise<void>} - Resolves when the provider is disconnected.
   */
  async disconnect() {
    return new Promise((resolve) => {
      this.isConnected = false;
      this.publicKey = null;
      this._emitEvent("disconnect");
      resolve();
    });
  }

  /**
   * Signs and sends a transaction.
   * @param {string} transaction - The base 58 encoded transaction string.
   * @returns {Promise<string>} - Resolves to the transaction signature or rejects with an error.
   * @throws {Error} - If not connected.
   */
  async signAndSendTransaction(transaction) {
    return new Promise(async (resolve, reject) => {
      if (!this.isConnected) {
        return reject(new Error("Not connected"));
      }

      let message = {
        method: "signAndSendTransaction",
        params: { message: transaction },
        requestId: uuidv4(),
      };
      try {
        const response =
          await this.messenger.postRequestAndWaitForResponse(message);

        if (response.status !== "success") {
          return reject(
            new Error(`Send transaction failed: ${response.data.error}`)
          );
        }
        resolve(response.data.signature);
      } catch (error) {
        reject(new Error(`Send transaction failed: ${error.message}`));
      }
    });
  }

  /**
   * Signs and sends a bundle of transactions. The bundle can contain the jito tip (should be the last instruction on the last transaction). If the tip is not included, the user sets the tip in the confirmation modal.
   * @param {string[]} transactions - An array of base 58 encoded transaction strings.
   * @returns {Promise<string>} - Resolves to the bundle ID or rejects with an error.
   * @throws {Error} - If not connected.
   */
  async signAndSendBundle(bundle) {
    return new Promise(async (resolve, reject) => {
      if (!this.isConnected) {
        return reject(new Error("Not connected"));
      }

      let message = {
        method: "signAndSendBundle",
        params: { message: bundle },
        requestId: uuidv4(),
      };
      try {
        const response =
          await this.messenger.postRequestAndWaitForResponse(message);

        if (response.status !== "success") {
          return reject(
            new Error(`Send bundle failed: ${response.data.error}`)
          );
        }
        resolve(response.data.bundleId);
      } catch (error) {
        reject(new Error(`Send bundle failed: ${error.message}`));
      }
    });
  }

  /**
   * Registers an event listener.
   * @param {string} event - The event name.
   * @param {Function} listener - The event listener function.
   */
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  /**
   * Emits an event to all registered listeners.
   * @param {string} event - The event name.
   * @param {*} data - The data to pass to the event listeners.
   * @private
   */
  _emitEvent(event, data) {
    if (this.events[event]) {
      this.events[event].forEach((listener) => listener(data));
    }
  }
}

export { Provider };
