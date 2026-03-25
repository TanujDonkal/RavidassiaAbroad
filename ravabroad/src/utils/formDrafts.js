const AUTH_REDIRECT_KEY = "post_auth_redirect";

export function saveFormDraft(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function loadFormDraft(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
}

export function clearFormDraft(key) {
  sessionStorage.removeItem(key);
}

export function setPostAuthRedirect(path) {
  sessionStorage.setItem(AUTH_REDIRECT_KEY, path);
}

export function getPostAuthRedirect() {
  return sessionStorage.getItem(AUTH_REDIRECT_KEY);
}

export function clearPostAuthRedirect() {
  sessionStorage.removeItem(AUTH_REDIRECT_KEY);
}
