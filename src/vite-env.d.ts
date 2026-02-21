/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_GATEWAY_URL?: string;
  readonly VITE_AI_GATEWAY_KEY?: string;
  readonly VITE_IRL_FEEDBACK_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
