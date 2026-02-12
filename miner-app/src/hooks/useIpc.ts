// Typed wrapper around window.electronAPI
export function useIpc() {
  return (window as unknown as { electronAPI?: unknown }).electronAPI;
}
