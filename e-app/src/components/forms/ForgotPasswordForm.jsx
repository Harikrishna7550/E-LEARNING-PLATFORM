import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useDebouncedCallback, makeInputValidator } from "../../utils/formValidation";

// ForgotPasswordForm - handles forgot password flow with OTP verification
export default function ForgotPasswordForm({ onBack }) {
  const [step, setStep] = useState("email"); // "email", "otp", or "reset"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const { sendForgotPasswordOtp, verifyForgotPasswordOtp, resetPassword, error, message, loading } = useAuth();

  const validateField = (name, value) => {
    switch (name) {
      case "email":
        if (!value.trim()) {
          return "Email is required.";
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Please enter a valid email address.";
        }
        return "";
      case "otp":
        if (!value.trim()) {
          return "OTP is required.";
        }
        if (value.trim().length !== 6) {
          return "OTP must be 6 digits.";
        }
        return "";
      case "newPassword":
        if (!value) {
          return "New password is required.";
        }
        if (value.length < 6) {
          return "Password must be at least 6 characters.";
        }
        if (/^\s*\d/.test(value)) {
          return "Password cannot start with a digit.";
        }
        if (!/(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(value)) {
          return "Password must include letters, digits, and a special character.";
        }
        return "";
      case "confirmPassword":
        if (!value) {
          return "Please confirm your password.";
        }
        if (value !== newPassword) {
          return "Passwords do not match.";
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

  const handleInputChange = (name, value, setter) => {
    setter(value);
    setTouched((prev) => ({ ...prev, [name]: true }));
    runInputValidation(name, value);
  };

  const collectErrors = (fields) => {
    const newErrors = {};
    fields.forEach(([name, value]) => {
      const fieldError = validateField(name, value);
      if (fieldError) newErrors[name] = fieldError;
    });
    return newErrors;
  };

  // Handle email submission - send OTP
  const handleSendOTP = (e) => {
    e.preventDefault();
    const newErrors = collectErrors([["email", email]]);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    sendForgotPasswordOtp({ email }).then((success) => {
      if (success) {
        setStep("otp");
      }
    });
  };

  // Handle OTP verification
  const handleVerifyOTP = (e) => {
    e.preventDefault();
    const newErrors = collectErrors([["otp", otp]]);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    verifyForgotPasswordOtp({ email, otp }).then((success) => {
      if (success) {
        setStep("reset");
      }
    });
  };

  // Handle password reset
  const handleResetPassword = (e) => {
    e.preventDefault();
    const newErrors = collectErrors([
      ["newPassword", newPassword],
      ["confirmPassword", confirmPassword],
    ]);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    resetPassword({ email, otp, newPassword }).then((success) => {
      if (success) {
        // Reset form and go back to login
        setStep("email");
        setEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          onBack();
        }, 2000); // Give user 2 seconds to see the success message
      }
    });
  };

  // Step 1: Email verification
  if (step === "email") {
    return (
      <form className="card p-4 shadow auth-card" onSubmit={handleSendOTP}>
        <div className="auth-card-header">
          <span className="auth-card-badge">Recover Access</span>
          <h3>Forgot Password?</h3>
          <p>Enter your registered email to receive an OTP for password reset.</p>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="mb-3">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-envelope"></i>
            </span>
            <input
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              placeholder="Enter your registered email"
              type="email"
              value={email}
              onChange={(e) => handleInputChange("email", e.target.value, setEmail)}
              onBlur={(e) => handleBlur("email", e.target.value)}
              required
            />
          </div>
          {errors.email && <span className="text-danger small d-block mt-2">{errors.email}</span>}
        </div>

        <button 
          className="btn btn-success mt-3 w-100 auth-action-btn"
          disabled={loading}
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>

        <button
          type="button"
          className="btn btn-link mt-2 w-100 auth-action-muted"
          onClick={onBack}
        >
          Back to Login
        </button>
      </form>
    );
  }

  // Step 2: OTP verification
  if (step === "otp") {
    return (
      <form className="card p-4 shadow auth-card" onSubmit={handleVerifyOTP}>
        <div className="auth-card-header">
          <span className="auth-card-badge">Verify</span>
          <h3>Verify OTP</h3>
          <p>Enter the 6-digit code sent to your email.</p>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <p className="small text-muted">OTP sent to: <strong>{email}</strong></p>

        <div className="mb-3">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-shield-lock"></i>
            </span>
            <input
              className={`form-control ${errors.otp ? "is-invalid" : ""}`}
              placeholder="Enter OTP"
              type="text"
              value={otp}
              onChange={(e) => handleInputChange("otp", e.target.value, setOtp)}
              onBlur={(e) => handleBlur("otp", e.target.value)}
              maxLength="6"
              required
            />
          </div>
          {errors.otp && <span className="text-danger small d-block mt-2">{errors.otp}</span>}
        </div>

        <button 
          className="btn btn-primary mt-3 w-100"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <button
          type="button"
          className="btn btn-link mt-2 w-100 auth-action-muted"
          onClick={() => {
            setStep("email");
            setOtp("");
            setErrors({});
          }}
        >
          Back to Email
        </button>
      </form>
    );
  }

  // Step 3: Reset password
  if (step === "reset") {
    return (
      <form className="card p-4 shadow auth-card" onSubmit={handleResetPassword}>
        <div className="auth-card-header">
          <span className="auth-card-badge">Reset</span>
          <h3>Set New Password</h3>
          <p>Enter your new password to regain access to your account.</p>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="mb-3">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-lock"></i>
            </span>
            <input
              className={`form-control ${errors.newPassword ? "is-invalid" : ""}`}
              placeholder="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => handleInputChange("newPassword", e.target.value, setNewPassword)}
              onBlur={(e) => handleBlur("newPassword", e.target.value)}
              required
            />
          </div>
          {errors.newPassword && <span className="text-danger small d-block mt-2">{errors.newPassword}</span>}
        </div>

        <div className="mb-3">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-lock-fill"></i>
            </span>
            <input
              className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
              placeholder="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value, setConfirmPassword)}
              onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
              required
            />
          </div>
          {errors.confirmPassword && <span className="text-danger small d-block mt-2">{errors.confirmPassword}</span>}
        </div>

        <button 
          className="btn btn-success mt-3 w-100 auth-action-btn"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <button
          type="button"
          className="btn btn-link mt-2 w-100 auth-action-muted"
          onClick={() => {
            setStep("otp");
            setNewPassword("");
            setConfirmPassword("");
            setErrors({});
          }}
        >
          Back to OTP Verification
        </button>
      </form>
    );
  }
}

//this component is used in Login.jsx
