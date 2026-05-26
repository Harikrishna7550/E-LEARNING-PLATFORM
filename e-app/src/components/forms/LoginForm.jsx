import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useDebouncedCallback, makeInputValidator } from "../../utils/formValidation";
import ForgotPasswordForm from "./ForgotPasswordForm";

// Login form component - handles user login
export default function LoginForm() {
  // State to store email and password input
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loginError, setLoginError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  // Get login function and error from auth context
  const { login, error, clearError } = useAuth();
  const toast = useToast();

  const validateField = (name, value) => {
    switch (name) {
      case "email":
        if (!value) {
          return "Email is required.";
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Please enter a valid email address.";
        }
        return "";
      case "password":
        if (!value) {
          return "Password is required.";
        }
        if (value.length < 6) {
          return "Password must be at least 6 characters.";
        }
        return "";
      default:
        return "";
    }
  };

  const handleBlur = (name, value) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const validateOnInput = makeInputValidator(validateField);

  const runInputValidation = useDebouncedCallback((name, value) => {
    setErrors((prev) => ({ ...prev, [name]: validateOnInput(name, value) }));
  }, 300);

  const handleFieldChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    runInputValidation(name, value);
    if (error) clearError();
    if (loginError) setLoginError("");
  };

  useEffect(() => {
    clearError();
  }, [clearError]);

  // Handle form submission - validate and login user
  const validateForm = () => {
    const newErrors = {};
    const emailErr = validateField("email", form.email);
    if (emailErr) newErrors.email = emailErr;
    const passwordErr = validateField("password", form.password);
    if (passwordErr) newErrors.password = passwordErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    login(form).then((user) => {
      // If login successful, redirect to user's dashboard based on role
      if (user) {
        toast.success("Login successful!");
        navigate(`/dashboard/${user.role}`);
      } else {
        setLoginError("Invalid email or password");
      }
    });
  };

  // If showing forgot password form, render it instead
  if (showForgotPassword) {
    return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <form className="card p-4 shadow auth-card" onSubmit={handleSubmit}>
      <div className="auth-card-header">
        <span className="auth-card-badge">Welcome Back</span>
        <h3>Login</h3>
        <p>Sign in to continue your learning journey with a premium experience.</p>
      </div>
      {/* Show error message if login fails */}
      {(loginError || error) && <div className="alert alert-danger">{loginError || "Invalid email or password"}</div>}

      {/* Email input field */}
      <div className="mb-3">
        <div className="input-group">
          <span className="input-group-text">
            <i className="bi bi-envelope"></i>
          </span>
          <input
            className={`form-control ${errors.email ? "is-invalid" : ""}`}
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            onBlur={(e) => handleBlur("email", e.target.value)}
            required
          />
        </div>
        {errors.email && <span className="text-danger small d-block mt-2">{errors.email}</span>}
      </div>

      {/* Password input field */}
      <div className="mb-3">
        <div className="input-group">
          <span className="input-group-text">
            <i className="bi bi-lock"></i>
          </span>
          <input
            className={`form-control ${errors.password ? "is-invalid" : ""}`}
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => handleFieldChange("password", e.target.value)}
            onBlur={(e) => handleBlur("password", e.target.value)}
            required
          />
          <button
            type="button"
            className="auth-toggle-btn"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
          </button>
        </div>
        {errors.password && <span className="text-danger small d-block mt-2">{errors.password}</span>}
      </div>

      {/* Forgot Password link */}
      <div className="text-end mb-2">
        <button
          type="button"
          className="btn btn-link btn-sm text-decoration-none p-0"
          onClick={() => setShowForgotPassword(true)}
        >
          Forgot Password?
        </button>
      </div>

      {/* Login button */}
      <button className="btn btn-success mt-3 w-100 auth-action-btn">Login</button>

      {/* Sign up link */}
      <div className="text-center mt-3">
        <p className="text-muted small">
          Don't have an account?{" "}
          <button
            type="button"
            className="btn btn-link btn-sm text-decoration-none auth-action-muted p-0"
            onClick={() => navigate("/signup")}
          >
            Create Account
          </button>
        </p>
      </div>
    </form>
  );
}
