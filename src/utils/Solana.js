import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export function isValidBase58PrivateKey(base58String) {
  try {
    const secretKey = bs58.decode(base58String);
    const keypair = Keypair.fromSecretKey(secretKey);
    return keypair.secretKey.length === 64; // Solana private keys are 64 bytes long
  } catch (error) {
    return false;
  }
}

export function getPublicKeyFromPrivateKey(base58PrivateKey) {
  try {
    const secretKey = bs58.decode(base58PrivateKey);
    const keypair = Keypair.fromSecretKey(secretKey);
    return keypair.publicKey.toBase58();
  } catch (error) {
    throw new Error("Invalid private key");
  }
}
