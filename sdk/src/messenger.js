export class Messenger {
  static messengers = new Map();

  constructor(url) {
    this.url = new URL(url);
    this.popup = null;
    this.listeners = new Map();
  }

  static getInstance(url) {
    if (!this.messengers.has(url)) {
      this.messengers.set(url, new Messenger(url));
    }

    return this.messengers.get(url);
  }

  postMessage = async (message) => {
    const popup = await this.waitForPopupLoaded();
    popup.postMessage(message, this.url.origin);
  };

  postRequestAndWaitForResponse = async (request) => {
    const responsePromise = this.onMessage(
      ({ requestId }) => requestId === request.id
    );
    this.postMessage(request);
    return await responsePromise;
  };

  onMessage = async (predicate) => {
    return new Promise((resolve, reject) => {
      const listener = (event) => {
        if (event.origin !== this.url.origin) return;

        const message = event.data;
        if (predicate(message)) {
          resolve(message);
          window.removeEventListener("message", listener);
          this.listeners.delete(listener);
        }
      };

      window.addEventListener("message", listener);
      this.listeners.set(listener, { reject });
    });
  };

  disconnect = () => {
    if (this.popup) {
      this.popup.close();
      this.popup = null;
    }

    this.listeners.forEach(({ reject }, listener) => {
      reject(new Error("Request rejected"));
      window.removeEventListener("message", listener);
    });
    this.listeners.clear();
  };

  waitForPopupLoaded = async () => {
    if (this.popup && !this.popup.closed) {
      this.popup.focus();
      return this.popup;
    }

    this.popup = window.open(this.url);

    this.onMessage(({ event }) => event === "BunWindowUnload")
      .then(this.disconnect)
      .catch(() => {});

    return this.onMessage(({ event }) => event === "BunWindowLoaded")
      .then((message) => {
        this.postMessage({
          event: "PopupLoadedAck",
          data: { version: "1.0.0" },
        });
      })
      .then(() => {
        if (!this.popup) throw new Error("Popup failed to load");
        return this.popup;
      });
  };
}
