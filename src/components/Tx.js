import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

async function createAndPrintTransferTx() {
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  const fromPubkey = new PublicKey("key1");
  const toPubkey = new PublicKey("key2");

  const amount = 0.1 * LAMPORTS_PER_SOL;

  const { blockhash } = await connection.getLatestBlockhash();

  let transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: amount,
    })
  );

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  const serializedTransaction = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });

  const base64Transaction = serializedTransaction.toString("base64");

  console.log("Unsigned Transaction (base64):");
  console.log(base64Transaction);

  console.log("\nTransaction details:");
  const txBuffer = Buffer.from(base64Transaction, "base64");

  const tx = Transaction.from(txBuffer);
  console.log(tx);
}
