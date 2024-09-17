import "./App.css";
import { useEffect, useState, useContext } from "react";
import { MessageContext } from "./context/MessageContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import RequestPage from "./pages/RequestPage";
import { useIndexedDB } from "./context/IndexeDBContext";

function App() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const {
    readDomain,
    createDomain,
    deleteDomain,
    selectedAccount,
    setSelectedAccount,
    isLoggedIn,
    setIsLoggedIn,
    firstLogin,
    checkDataLoaded,
    onLoadAccount,
  } = useIndexedDB();
  const { on, off, sendMessage } = useContext(MessageContext);

  useEffect(() => {
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

    const handleConnect = async (params, event, id) => {
      await checkDataLoaded();
      if (params.onlyIfTrusted) {
        const domain = await readDomain(event.origin);
        if (domain) {
          sendMessage(
            {
              method: "connect",
              data: { account: onLoadAccount.current },
              requestId: id,
              status: "success",
            },
            event.origin,
            event.source
          );
        } else {
          sendMessage(
            {
              method: "connect",
              data: {
                error: { code: 4001, message: "User rejected the request." },
              },
              requestId: id,
              status: "rejected",
            },
            event.origin,
            event.source
          );
        }
      } else {
        setPendingRequests((prevRequests) => [
          ...prevRequests,
          { method: "connect", params, event, requestId: id },
        ]);
      }
    };

    const handleDisconnect = (params, event, id) => {
      // remove origin from connected list and state
      // send disconnect to origin
      sendMessage(
        {
          method: "disconnect",
          data: {},
          requestId: id,
          status: "success",
        },
        event.origin,
        event.source
      );
    };

    const handleSignAndSendTx = (params, event, id) => {
      // check if origin is connected
      // get tx from params
      // parse tx, prompt user to sign
      // sign tx
      // send tx  and wait on status
      // return tx id to origin
      setPendingRequests((prevRequests) => [
        ...prevRequests,
        { method: "signAndSendTransaction", params, event, requestId: id },
      ]);
    };

    const handleSignAndSendBundle = (params, event, id) => {
      // check if origin is connected
      // get bundle from params
      // parse bundle, prompt user to sign
      // sign bundle
      // send bundle to jito and wait on status
      // return bundle id to origin
      setPendingRequests((prevRequests) => [
        ...prevRequests,
        { method: "signAndSendBundle", params, event, requestId: id },
      ]);
    };

    on("PopupLoaded", handlePopupLoaded);
    on("connect", handleConnect);
    on("disconnect", handleDisconnect);
    on("signAndSendBundle", handleSignAndSendBundle);
    on("signAndSendTransaction", handleSignAndSendTx);

    return () => {
      off("PopupLoaded", handlePopupLoaded);
      off("connect", handleConnect);
      off("disconnect", handleDisconnect);
      off("signAndSendBundle", handleSignAndSendBundle);
      off("signAndSendTransaction", handleSignAndSendTx);
    };
  }, [on, off, sendMessage]);

  const handleSign = async (request) => {
    switch (request.method) {
      case "connect":
        const domain = await readDomain(request.event.origin);
        if (!domain) {
          await createDomain({ domain: request.event.origin });
        }
        sendMessage(
          {
            method: "connect",
            data: { account: selectedAccount.publicKey },
            requestId: request.requestId,
            status: "success",
          },
          request.event.origin,
          request.event.source
        );
        break;
      case "signAndSendBundle":
        sendMessage(
          {
            event: "signAndSendBundleResponse",
            data: {},
            requestId: request.requestId,
            status: "success",
          },
          request.event.origin,
          request.event.source
        );
        break;
      case "signAndSendTransaction":
        sendMessage(
          {
            event: "signAndSendTransactionResponse",
            data: {},
            requestId: request.requestId,
            status: "success",
          },
          request.event.origin,
          request.event.source
        );
        break;
    }
    setPendingRequests((prevRequests) => prevRequests.slice(1));
  };

  const handleReject = (request) => {
    switch (request.method) {
      case "connect":
        sendMessage(
          {
            method: "connect",
            data: {
              error: { code: 4001, message: "User rejected the request." },
            },
            requestId: request.requestId,
            status: "rejected",
          },
          request.event.origin,
          request.event.source
        );
        break;

      case "signAndSendBundle":
        sendMessage(
          {
            event: "signAndSendBundleResponse",
            data: {
              error: { code: 4001, message: "User rejected the request." },
            },
            requestId: request.requestId,
            status: "rejected",
          },
          request.event.origin,
          request.event.source
        );
        break;
      case "signAndSendTransaction":
        sendMessage(
          {
            event: "signAndSendTransactionResponse",
            data: {
              error: { code: 4001, message: "User rejected the request." },
            },
            requestId: request.requestId,
            status: "rejected",
          },
          request.event.origin,
          request.event.source
        );
        break;
    }
    setPendingRequests((prevRequests) => prevRequests.slice(1));
  };

  return (
    <div className="App">
      <p className="logo-text">BUN</p>
      {isLoggedIn ? (
        pendingRequests.length > 0 ? (
          <RequestPage
            requestDetails={pendingRequests[0]}
            onSign={handleSign}
            onReject={handleReject}
          />
        ) : (
          <Home
            selectedAccount={selectedAccount}
            setSelectedAccount={setSelectedAccount}
          />
        )
      ) : (
        <Login firstLogin={firstLogin} setLoggedIn={setIsLoggedIn} />
      )}
    </div>
  );
}

export default App;
