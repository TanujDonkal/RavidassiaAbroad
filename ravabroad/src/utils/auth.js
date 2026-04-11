const USER_STORAGE_KEY = "user";

function dispatchAuthUpdated() {
  window.dispatchEvent(new Event("auth-updated"));
}

export function getStoredUser() {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

export function setStoredUser(user) {
  if (!user) {
    clearStoredAuth({ notify: false });
    return;
  }
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  dispatchAuthUpdated();
}

export function clearStoredAuth({ notify = true } = {}) {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem("token");
  if (notify) {
    dispatchAuthUpdated();
  }
}

export function isAuthenticated() {
  return Boolean(getStoredUser()?.id);
}
