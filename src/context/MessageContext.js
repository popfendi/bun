import React, { createContext, useEffect, useRef } from "react";

const MessageContext = createContext();

const MessageProvider = ({ children }) => {
  const listeners = useRef({});

  useEffect(() => {
    const handleMessage = (event) => {
      console.log("Message received:", event);

      const { method, params, requestId } = event.data;
      if (listeners.current[method]) {
        listeners.current[method].forEach((callback) =>
          callback(params, event, requestId)
        );
      }
    };

    window.addEventListener("message", handleMessage);

    if (window.opener) {
      window.opener.postMessage({ event: "BunWindowLoaded" }, "*");
    }

    const handleBeforeUnload = () => {
      if (window.opener) {
        window.opener.postMessage({ event: "BunWindowUnload" }, "*");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const on = (type, callback) => {
    if (!listeners.current[type]) {
      listeners.current[type] = [];
    }
    listeners.current[type].push(callback);
  };

  const off = (type, callback) => {
    if (!listeners.current[type]) return;
    listeners.current[type] = listeners.current[type].filter(
      (cb) => cb !== callback
    );
  };

  const sendMessage = (message, targetOrigin, targetWindow = window.opener) => {
    if (targetWindow) {
      targetWindow.postMessage(message, targetOrigin);
    } else {
      console.error("No target window to send message to.");
    }
  };

  return (
    <MessageContext.Provider value={{ on, off, sendMessage }}>
      {children}
    </MessageContext.Provider>
  );
};

export { MessageProvider, MessageContext };
