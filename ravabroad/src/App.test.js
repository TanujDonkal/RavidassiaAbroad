import {
  clearStoredAuth,
  getStoredUser,
  isAuthenticated,
  setStoredUser,
} from "./utils/auth";

describe("auth storage helpers", () => {
  afterEach(() => {
    clearStoredAuth({ notify: false });
  });

  test("stores and reads the current user", () => {
    const user = { id: 7, name: "Tester", role: "user" };
    setStoredUser(user);

    expect(getStoredUser()).toEqual(user);
    expect(isAuthenticated()).toBe(true);
  });

  test("clears auth state safely", () => {
    setStoredUser({ id: 9, name: "Admin", role: "main_admin" });

    clearStoredAuth({ notify: false });

    expect(getStoredUser()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });
});
