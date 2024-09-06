# Bun wallet

This is a web-based wallet for Jito bundles on Solana. It allows users to select their wallet and sign transactions for Jito bundles from a web app.

Browser extension wallets are great, but they have a few downsides:

1. They are not accessible from mobile devices
2. They have an installation step that may be a barrier to entry for some users
3. Multiple wallets get messy and can cause conflicts

AND the main thing

4. They don't have a good way to sign transactions for Jito bundles.

I wanted to design a new approach to see if there was a better way.

Bun is web based, encrypts and stores all of your keys locally. Can be cleared any time. And communicates via local storage messages.

DISCLAIMER: This is a proof of concept and is not yet ready for production use. A security audit is needed before it can be used safely.
