import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import LoginForm from "../components/forms/LoginForm";
import { useAuth } from "../context/AuthContext";

// Login page - redirects logged-in users to their dashboard
export default function Login() {
  // Get current authentication state
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect to their dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/dashboard/${user.role}`, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <>
      <Navbar />
      <div className="auth-page py-5">
        <div className="container auth-container">
          <LoginForm />
        </div>
      </div>
    </>
  );
}
