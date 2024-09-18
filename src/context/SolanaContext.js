import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { Connection } from "@solana/web3.js";
import {
  getActualFee,
  getBalance,
  getBalanceDiff,
  signAndSendTransaction,
  confirmTransaction,
} from "../utils/Solana";
import { conf } from "../config";
const SolanaContext = createContext();

const RATE_LIMITS = {
  MAX_REQUESTS: 100,
  MAX_REQUESTS_PER_RPC: 40,
  MAX_CONCURRENT_CONNECTIONS: 40,
  MAX_CONNECTION_RATE: 40,
  MAX_DATA: 100 * 1024 * 1024, // 100 MB
  TIME_WINDOW: 10000, // 10 seconds
};

export const SolanaProvider = ({ children }) => {
  const [connection] = useState(new Connection(conf.DEV_RPC_URL));
  const requestCountRef = useRef(0);
  const rpcRequestCountRef = useRef(0);
  const concurrentConnectionsRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      requestCountRef.current = 0;
      rpcRequestCountRef.current = 0;
      concurrentConnectionsRef.current = 0;
    }, RATE_LIMITS.TIME_WINDOW);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // rate limiter for solana mainnet rules.
  const rateLimit = async (fn, ...args) => {
    while (
      requestCountRef.current >= RATE_LIMITS.MAX_REQUESTS ||
      rpcRequestCountRef.current >= RATE_LIMITS.MAX_REQUESTS_PER_RPC ||
      concurrentConnectionsRef.current >= RATE_LIMITS.MAX_CONCURRENT_CONNECTIONS
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    requestCountRef.current += 1;
    rpcRequestCountRef.current += 1;
    concurrentConnectionsRef.current += 1;

    try {
      const result = await fn(...args);
      return result;
    } catch (e) {
      throw e;
    } finally {
      concurrentConnectionsRef.current -= 1;
    }
  };

  const getFeeForMessage = async (message, b58Tx) => {
    return rateLimit(getActualFee, connection, message, b58Tx);
  };

  const getUserBalance = async (publicKey) => {
    return rateLimit(getBalance, connection, publicKey);
  };

  const getRecentBlockhash = async () => {
    return rateLimit(async (connection) => {
      const { blockhash } = await connection.getLatestBlockhash("finalized");
      return blockhash;
    }, connection);
  };

  const getBalanceDifference = async (transaction, b58Tx, signer) => {
    return rateLimit(getBalanceDiff, connection, transaction, b58Tx, signer);
  };

  const sendTransaction = async (b58Tx, pk) => {
    return rateLimit(signAndSendTransaction, connection, b58Tx, pk);
  };

  const confirmTransactionBySignature = async (signature) => {
    return rateLimit(confirmTransaction, connection, signature);
  };

  return (
    <SolanaContext.Provider
      value={{
        connection,
        getFeeForMessage,
        getUserBalance,
        getRecentBlockhash,
        getBalanceDifference,
        sendTransaction,
        confirmTransactionBySignature,
      }}
    >
      {children}
    </SolanaContext.Provider>
  );
};

export const useSolana = () => useContext(SolanaContext);
