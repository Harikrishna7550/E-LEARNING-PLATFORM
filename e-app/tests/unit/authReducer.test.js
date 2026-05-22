import { authReducer, initialAuthState } from "../../src/context/authReducer";

describe("Unit: authReducer", () => {
  it("1. LOGIN action sets isAuthenticated and user", () => {
    const next = authReducer(initialAuthState, {
      type: "LOGIN",
      payload: { user: { id: "u1", role: "student" } },
    });
    expect(next.isAuthenticated).toBe(true);
    expect(next.user).toEqual({ id: "u1", role: "student" });
    expect(next.error).toBeNull();
    expect(next.loading).toBe(false);
  });

  it("2. LOGOUT action resets the auth state to logged-out defaults", () => {
    const next = authReducer(
      { ...initialAuthState, isAuthenticated: true, user: { id: "u1" } },
      { type: "LOGOUT" },
    );
    expect(next.isAuthenticated).toBe(false);
    expect(next.user).toBeNull();
    expect(next.loading).toBe(false);
  });

  it("3. SET_ERROR stores the error message and turns off loading", () => {
    const next = authReducer(
      { ...initialAuthState, loading: true, message: "previous" },
      { type: "SET_ERROR", payload: "Boom" },
    );
    expect(next.error).toBe("Boom");
    expect(next.loading).toBe(false);
    expect(next.message).toBeNull();
  });

  it("4. SET_MESSAGE stores a success message and clears any error", () => {
    const next = authReducer(
      { ...initialAuthState, error: "oops" },
      { type: "SET_MESSAGE", payload: "All good" },
    );
    expect(next.message).toBe("All good");
    expect(next.error).toBeNull();
  });

  it("5. SET_USERS replaces the users list and ends loading", () => {
    const users = [{ id: "1" }, { id: "2" }];
    const next = authReducer(
      { ...initialAuthState, loading: true },
      { type: "SET_USERS", payload: users },
    );
    expect(next.users).toEqual(users);
    expect(next.loading).toBe(false);
  });
});
