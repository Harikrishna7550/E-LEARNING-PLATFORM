import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

let mockAuthValue = { isAuthenticated: false, user: null };
jest.mock("../../src/context/AuthContext", () => ({
  useAuth: () => mockAuthValue,
}));

import ProtectedRoute from "../../src/routes/ProtectedRoute";

const renderAt = (initialEntry) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard/student" element={<div>Student Dashboard</div>} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <div>Admin Area</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

describe("Integration: ProtectedRoute", () => {
  it("14. redirects unauthenticated users to /login", () => {
    mockAuthValue = { isAuthenticated: false, user: null };
    renderAt("/admin");
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Admin Area")).not.toBeInTheDocument();
  });

  it('15. redirects an authenticated user with the wrong role to their own dashboard', () => {
    mockAuthValue = { isAuthenticated: true, user: { role: "student" } };
    renderAt("/admin");
    expect(screen.getByText("Student Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Admin Area")).not.toBeInTheDocument();
  });
});
