import { Provider } from "./provider";

let providerInstance = null;

function getProvider() {
  if (!providerInstance) {
    providerInstance = new Provider();
  }
  return providerInstance;
}

export { getProvider };
