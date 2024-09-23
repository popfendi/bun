/* 
TO DO

provider class with following functions:

functions for each message case:
- connect
    - takes optional object with onlyIfTrusted prop
- disconnect

- signAndSendTransaction
    - takes base 58 encoded transaction string
- signAndSendBundle
    - takes array of base 58 encoded transaction strings

it also needs to have an event producer, for "accountChanged" or "disconnect" events

it needs to hold the following state:
- account PubKey
- isConnected

there needs to be a global function "getProvider" that returns the provider instance
*/
