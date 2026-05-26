import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useChatBot } from "../../context/ChatBotContext";
import { useDebouncedCallback, makeInputValidator } from "../../utils/formValidation";

// SignupForm - form for new users to create an account
export default function SignupForm() {
// Form data - name, email, password, role (student/instructor/admin)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("form"); // "form" or "otp"
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();
  // Get auth functions and state from auth context
  const { sendOTP, verifyOTP, error, message, loading, clearError } = useAuth();
  const toast = useToast();
  // Get chatbot function from chatbot context
  const { openChatBot } = useChatBot();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        if (!value.trim()) {
          return "Name is required.";
        }
        if (value.trim().length < 4) {
          return "Name must be at least 4 characters.";
        }
        if (!/^[A-Za-z\s]+$/.test(value.trim())) {
          return "Name must contain only letters and spaces.";
        }
        return "";
      case "email":
        if (!value.trim()) {
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
        if (value !== form.password) {
          return "Passwords do not match.";
        }
        return "";
      case "role":
        if (!["student", "instructor", "admin"].includes(value)) {
          return "Please select a valid role.";
        }
        return "";
      default:
        return "";
    }
  };

  const validateOnInput = makeInputValidator(validateField);

  const runInputValidation = useDebouncedCallback((name, value) => {
    setErrors((prev) => ({ ...prev, [name]: validateOnInput(name, value) }));
  }, 300);

  const handleFieldChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    runInputValidation(name, value);
    if (error) {
      clearError();
    }
  };

  const handleBlur = (name, value) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  // Handle form submission - send OTP
  const handleSendOTP = (e) => {
    e.preventDefault();
    const fields = ["name", "email", "password", "confirmPassword", "role"];
    const newErrors = {};
    fields.forEach((name) => {
      const fieldError = validateField(name, form[name]);
      if (fieldError) newErrors[name] = fieldError;
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    sendOTP(form).then((success) => {
      if (success) {
        setStep("otp");
      }
    });
  };

  // Handle OTP verification
  const handleVerifyOTP = (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setErrors({ otp: "OTP is required" });
      return;
    }
    setErrors({});
    verifyOTP({ email: form.email, otp }).then((user) => {
      if (user) {
        toast.success("User created successfully!");
        navigate(`/dashboard/${user.role}`);
      }
    });
  };

  if (step === "otp") {
    return (
      <form className="card p-4 shadow auth-card" onSubmit={handleVerifyOTP}>
        <div className="auth-card-header">
          <span className="auth-card-badge">Verify</span>
          <h3>Verify Your Email</h3>
          <p>Enter the 6-digit code from your inbox to unlock access.</p>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <p>Please enter the 6-digit OTP sent to {form.email}</p>

        <div className="input-group mb-2">
          <span className="input-group-text">
            <i className="bi bi-shield-lock"></i>
          </span>
          <input
            className="form-control"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength="6"
            required
          />
        </div>
        {errors.otp && <div className="text-danger">{errors.otp}</div>}

        <button className="btn btn-primary mt-3 w-100" disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <button
          type="button"
          className="btn btn-link mt-2 w-100"
          onClick={() => setStep("form")}
        >
          Back to Signup
        </button>
      </form>
    );
  }

  return (
    <form className="card p-4 shadow auth-card" onSubmit={handleSendOTP}>
      <div className="auth-card-header">
        <span className="auth-card-badge">Create Account</span>
        <h3>Signup</h3>
        <p>Register once and access stunning learning tools with premium design.</p>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="input-group mb-3">
        <span className="input-group-text">
          <i className="bi bi-person"></i>
        </span>
        <input
          className={`form-control ${errors.name ? "is-invalid" : ""}`}
          placeholder="Name"
          value={form.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          onBlur={(e) => handleBlur("name", e.target.value)}
          required
        />
      </div>
      {errors.name && <span className="text-danger small d-block mb-3">{errors.name}</span>}

      <div className="input-group mb-3">
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
      {errors.email && <span className="text-danger small d-block mb-3">{errors.email}</span>}

      <div className="input-group mb-3">
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
      {errors.password && <span className="text-danger small d-block mb-3">{errors.password}</span>}

      <div className="input-group mb-3">
        <span className="input-group-text">
          <i className="bi bi-lock-fill"></i>
        </span>
        <input
          className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
          placeholder="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          value={form.confirmPassword}
          onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
          onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
          required
        />
        <button
          type="button"
          className="auth-toggle-btn"
          onClick={() => setShowConfirmPassword((prev) => !prev)}
          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
        >
          <i className={showConfirmPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
        </button>
      </div>
      {errors.confirmPassword && <span className="text-danger small d-block mb-3">{errors.confirmPassword}</span>}

      <label className="auth-field-label" htmlFor="signup-role">I am signing up as</label>
      <div className="input-group mb-3">
        <span className="input-group-text">
          <i className="bi bi-person-badge"></i>
        </span>
        <select
          id="signup-role"
          className={`form-select auth-role-select ${errors.role ? "is-invalid" : ""}`}
          value={form.role}
          onChange={(e) => handleFieldChange("role", e.target.value)}
          onBlur={(e) => handleBlur("role", e.target.value)}
        >
          <option value="student">Student — Learn from courses</option>
          <option value="instructor">Instructor — Create &amp; teach courses</option>
          <option value="admin">Admin — Manage the platform</option>
        </select>
      </div>
      {errors.role && <span className="text-danger small d-block mb-3">{errors.role}</span>}

      <button className="btn btn-primary mt-3 w-100" disabled={loading}>
        {loading ? "Sending OTP..." : "Send OTP"}
      </button>
      <button 
        className="btn btn-link mt-2 w-100 auth-action-muted" 
        type="button" 
        onClick={openChatBot}
      >
        Need help?
      </button>
      <div className="text-center mt-3">
        <p className="text-muted small">
          Already have an account?{' '}
          <button
            type="button"
            className="btn btn-link btn-sm text-decoration-none auth-action-muted p-0"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </p>
      </div>
    </form>
  );
}


//this component used in singup.jsx page