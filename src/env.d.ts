/// <reference types="vite/client" />

// Augment Vite's ImportMetaEnv with project-specific PUBLIC_ variables.
// Add every PUBLIC_* key defined in .env here so import.meta.env is fully typed.
interface ImportMetaEnv {
  readonly PUBLIC_API_URL: string;
}
