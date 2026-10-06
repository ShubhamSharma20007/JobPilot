export function notifyExtensionLoggedIn() {
  window.postMessage({ source: "jobpilot-web", type: "LOGIN_SUCCESS" }, window.location.origin)
}