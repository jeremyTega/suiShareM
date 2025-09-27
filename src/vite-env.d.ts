/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NETWORK: string;
  readonly VITE_PACKAGE_ID: string;
  readonly VITE_PRIVATE_KEY: string;
  readonly VITE_ACTIVE_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
