declare module "bun-wallet-sdk" {
  export class Provider {
    connect(options?: { onlyIfTrusted?: boolean }): Promise<Object>;
    disconnect(): Promise<void>;
    signAndSendTransaction(transaction: string): Promise<string>;
    signAndSendBundle(bundle: string[]): Promise<string>;
    on(event: string, listener: Function): void;
  }

  export function getProvider(): Provider;
}
