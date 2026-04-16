export function getApiBaseUrl(): string {
  const signalingUrl = import.meta.env.VITE_SIGNALING_URL
  if (signalingUrl) {
    return signalingUrl.replace(/^ws(s?):/, 'http$1:').replace(/\/ws$/, '')
  }
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
  return `${protocol}//${window.location.hostname}:8080`
}
