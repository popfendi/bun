import "./App.css";
import { useEffect, useState, useContext } from "react";
import { MessageContext } from "./context/MessageContext";
import Login from "./pages/Login";
import Home from "./pages/Home";

function App() {
  const [db, setDb] = useState(null);
  const [firstLogin, setFirstLogin] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const { on, off, sendMessage } = useContext(MessageContext);

  const initDB = () => {
    return new Promise((resolve) => {
      let database;
      let request = indexedDB.open("BUN");

      request.onupgradeneeded = () => {
        database = request.result;

        if (!database.objectStoreNames.contains("auth")) {
          console.log("creating store");
          database.createObjectStore("auth", { keyPath: "topic" });
          database.createObjectStore("bundles", { keyPath: "id" });
          database.createObjectStore("accounts", { keyPath: "publicKey" });
          setFirstLogin(true);
        }
      };

      request.onsuccess = () => {
        setDb(request.result);
        console.log("store created");
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
        resolve(false);
      };
    });
  };

  useEffect(() => {
    initDB().then((success) => {
      if (success) {
        console.log("Database initialized successfully");
      } else {
        console.log("Failed to initialize database");
      }
    });

    const handleBeforeUnload = () => {
      sessionStorage.removeItem("master");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const handlePopupLoaded = (params, event, id) => {
      sendMessage(
        { event: "PopupLoadedAck", data: { version: "1.0.0" }, requestId: id },
        event.origin,
        event.source
      );
    };

    const handleConnect = (params, event, id) => {
      // check if params contains onlyIfTrusted prop, if true, check if origin is in connected list and connect or reject
      // if false, send reject { code: 4001, message: 'User rejected the request.' }
      // if params does not contain onlyIfTrusted prop
      // prompt user to connect
      // if user clicks cancel, send reject { code: 4001, message: 'User rejected the request.' }
      // if user clicks connect, send accept and public key and set connected to origin and persist origin in connected list
      sendMessage(
        { event: "connect", data: { account: "123456" }, requestId: id },
        event.origin,
        event.source
      );
    };

    const handleDisconnect = (params, event, id) => {
      // remove origin from connected list and state
      // send disconnect to origin
      sendMessage(
        { event: "disconnect", data: {}, requestId: id },
        event.origin,
        event.source
      );
    };

    const handleSignAndSendBundle = (params, event, id) => {
      // check if origin is connected
      // get bundle from params
      // parse bundle, prompt user to sign
      // sign bundle
      // send bundle to jito and wait on status
      // return bundle id to origin

      sendMessage(
        {
          event: "signAndSendBundle",
          data: { bundleId: "123456" },
          requestId: id,
        },
        event.origin,
        event.source
      );
    };

    on("PopupLoaded", handlePopupLoaded);
    on("connect", handleConnect);
    on("disconnect", handleDisconnect);
    on("signAndSendBundle", handleSignAndSendBundle);

    return () => {
      off("PopupLoaded", handlePopupLoaded);
      off("connect", handleConnect);
      off("disconnect", handleDisconnect);
      off("signAndSendBundle", handleSignAndSendBundle);
    };
  }, [on, off, sendMessage]);

  return (
    <div className="App">
      <p className="logo-text">BUN</p>
      {loggedIn ? (
        <Home db={db} />
      ) : (
        <Login
          firstLogin={firstLogin}
          db={db}
          setDb={setDb}
          setLoggedIn={setLoggedIn}
        />
      )}
    </div>
  );
}

export default App;
