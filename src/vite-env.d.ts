/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_USE_MOCK?: boolean;
    readonly VITE_DO_NOT_UPDATE?: boolean;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
