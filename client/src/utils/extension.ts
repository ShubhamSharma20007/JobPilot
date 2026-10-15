export function notifyExtensionLoggedIn() {
  window.postMessage(
    { source: 'jobpilot-web', type: 'LOGIN_SUCCESS' },
    window.location.origin
  );
}

export function notifyExtensionLoggedOut() {
  window.postMessage(
    { source: 'jobpilot-web', type: 'LOGOUT_SUCCESS' },
    window.location.origin
  );
}

export function closeSidePanel() {
  window.postMessage({ source: 'jobpilot-web', type: 'CLOSE_PANEL' }, window.location.origin)
}
