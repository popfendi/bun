import {
  Keypair,
  Message,
  Transaction,
  SystemProgram,
  PublicKey,
} from "@solana/web3.js";
import bs58 from "bs58";

export const LAMPORTS_PER_SOL = 1000000000;

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

export function b58ToTransaction(b58String) {
  let decoded = bs58.decode(b58String);

  let message = Message.from(decoded);
  return Transaction.populate(message);
}

export function parseTransferSolInstruction(instruction) {
  if (!instruction.programId.equals(SystemProgram.programId)) {
    return { isTransfer: false };
  }

  if (instruction.data.length !== 12) {
    return { isTransfer: false };
  }

  if (instruction.data.readUInt32LE(0) != 2) {
    return { isTransfer: false };
  }

  let amount = instruction.data.readBigUInt64LE(4);
  let from = instruction.keys[0].pubkey;
  let to = instruction.keys[1].pubkey;

  return {
    isTransfer: true,
    amount: Number(amount) / LAMPORTS_PER_SOL,
    from: from,
    to: to,
  };
}

export async function getActualFee(connection, transaction) {
  const message = transaction.compileMessage();
  const fee = await connection.getFeeForMessage(message);

  return fee.value;
}

export async function simulateTransaction(connection, transaction, signer) {
  const simulation = await connection.simulateTransaction(
    transaction,
    [signer],
    [signer.publicKey]
  );

  if (simulation.value.err) {
    throw new Error(
      `Simulation failed: ${JSON.stringify(simulation.value.err)}`
    );
  }

  return simulation.value;
}

export async function getBalanceDifference(connection, transaction, signer) {
  try {
    const initialBalance = await connection.getBalance(signer);
    const simulation = await simulateTransaction(
      connection,
      transaction,
      signer
    );

    const finalBalance = simulation.accounts[0].lamports;
    const balanceDifference = finalBalance - initialBalance;

    return balanceDifference;
  } catch (error) {
    throw new Error(`Failed transaction: ${error.message}`);
  }
}

export async function getBalance(connection, account) {
  console.log("getBalance");
  try {
    const publicKey = new PublicKey(account);
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    const roundedSolBalance = solBalance.toFixed(5);
    const finalBalance =
      solBalance.toString().length > roundedSolBalance.length
        ? roundedSolBalance
        : solBalance;
    return finalBalance;
  } catch (error) {
    throw new Error(`Failed balance fetch: ${error.message}`);
  }
}
