/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
