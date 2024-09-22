import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import * as buffer from "buffer";
import { MessageProvider } from "./context/MessageContext";
import { IndexedDBProvider } from "./context/IndexeDBContext";
import { SolanaProvider } from "./context/SolanaContext";
window.Buffer = buffer.Buffer;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <IndexedDBProvider>
      <MessageProvider>
        <SolanaProvider>
          <App />
        </SolanaProvider>
      </MessageProvider>
    </IndexedDBProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
