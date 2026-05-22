import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockLogin = jest.fn();
const mockClearError = jest.fn();
const mockNavigate = jest.fn();
const mockToastSuccess = jest.fn();

jest.mock("../../src/context/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
    error: null,
    clearError: mockClearError,
  }),
}));

jest.mock("../../src/context/ToastContext", () => ({
  useToast: () => ({ success: mockToastSuccess, error: jest.fn() }),
}));

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

import LoginForm from "../../src/components/forms/LoginForm";

const renderForm = () =>
  render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>,
  );

describe("Integration: LoginForm", () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
    mockToastSuccess.mockReset();
  });

  it("12. shows an inline error when email is blurred with an invalid value", () => {
    renderForm();
    const email = screen.getByPlaceholderText("Email");
    fireEvent.change(email, { target: { value: "not-an-email" } });
    fireEvent.blur(email);
    expect(
      screen.getByText(/Please enter a valid email address./i),
    ).toBeInTheDocument();
  });

  it("13. submits credentials and navigates to the role dashboard on success", async () => {
    mockLogin.mockResolvedValue({ role: "student", id: "u1" });
    renderForm();

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Login$/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "secret123",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/student");
      expect(mockToastSuccess).toHaveBeenCalledWith("Login successful!");
    });
  });
});
