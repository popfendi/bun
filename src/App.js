import "./App.css";
import { useEffect, useState, useContext } from "react";
import { MessageContext } from "./context/MessageContext";
import Login from "./pages/Login";
import Home from "./pages/Home";

function App() {
  const [db, setDb] = useState(null);
  const [firstLogin, setFirstLogin] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const { on, sendMessage } = useContext(MessageContext);

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

  /*useEffect(() => {
    on("PopupLoaded", (params, event) => {
      console.log("PopupLoaded event received with params:", params);

      
      sendMessage(
        { event: "PopupLoadedAck", data: { version: "1.0.0" } },
        event.origin,
        event.source
      );
    });
  }, [on, sendMessage]); */

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
