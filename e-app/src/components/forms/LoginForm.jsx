import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import ForgotPasswordForm from "./ForgotPasswordForm";

// Login form component - handles user login
export default function LoginForm() {
  // State to store email and password input
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
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
    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  useEffect(() => {
    clearError();
  }, [clearError]);

  // Handle form submission - validate and login user
  const validateForm = () => {
    const newErrors = {};
    if (!form.email) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!form.password) {
      newErrors.password = "Password is required.";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
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
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Email input field */}
      <div className="input-group mb-2">
        <span className="input-group-text">
          <i className="bi bi-envelope"></i>
        </span>
        <input
          className="form-control"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => {
            const value = e.target.value;
            setForm({ ...form, email: value });
            if (errors.email) {
              setErrors((prev) => ({ ...prev, email: "" }));
            }
            if (error) {
              clearError();
            }
          }}
          onBlur={(e) => handleBlur("email", e.target.value)}
          required
        />
      </div>
      {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}

      {/* Password input field */}
      <div className="input-group mb-2">
        <span className="input-group-text">
          <i className="bi bi-lock"></i>
        </span>
        <input
          className="form-control"
          placeholder="Password"
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={(e) => {
            const value = e.target.value;
            setForm({ ...form, password: value });
            if (errors.password) {
              setErrors((prev) => ({ ...prev, password: "" }));
            }
            if (error) {
              clearError();
            }
          }}
          onBlur={(e) => handleBlur("password", e.target.value)}
          required
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
        </button>
      </div>
      {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}

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

//this component is used in Login.jsx
