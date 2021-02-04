import type { ElectronApi } from "./electronApi";

declare global {
  interface Window {
    electronApi: ElectronApi;
  }
}
