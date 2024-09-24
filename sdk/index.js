import { Provider } from "./src/provider.js";

let providerInstance = null;

function getProvider() {
  if (!providerInstance) {
    providerInstance = new Provider();
  }
  return providerInstance;
}

export { getProvider };
