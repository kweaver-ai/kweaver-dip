/// <reference types="@testing-library/jest-dom/vitest" />

declare module 'js-cookie'

declare interface Window {
  __APP_RUNTIME_CONFIG__?: {
    PUBLIC_ENABLED_MODULES?: string
  }
}
