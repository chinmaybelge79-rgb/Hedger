/// <reference types="vite/client" />

interface Window {
  __PREDICTION_ENABLED__?: boolean;
  __VALUATION_STATUS_ENABLED__?: boolean;
}

interface ImportMetaEnv {
  readonly VITE_PREDICTION_ENABLED?: string;
  readonly VITE_VALUATION_STATUS_ENABLED?: string;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
