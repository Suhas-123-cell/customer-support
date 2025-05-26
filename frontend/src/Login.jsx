import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // For navigation after login

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Demo mode - check for predefined accounts
    if (email === 'admin@example.com' && password === 'admin123') {
      console.log('Using admin login');
      // Store token data
      localStorage.setItem("accessToken", "mock_token_for_testing");
      localStorage.setItem("tokenType", "bearer");
      localStorage.setItem("role", "Admin");
      localStorage.setItem("company_id", "1");
      
      // Simulate network delay
      setTimeout(() => {
        // Redirect to admin page
        navigate("/dashboard");
        setLoading(false);
      }, 800);
      return;
    } 
    
    if (email === 'user@example.com' && password === 'user123') {
      console.log('Using user login');
      // Store token data
      localStorage.setItem("accessToken", "mock_token_for_testing");
      localStorage.setItem("tokenType", "bearer");
      localStorage.setItem("role", "Customer");
      localStorage.setItem("company_id", "1");
      
      // Simulate network delay
      setTimeout(() => {
        // Redirect to dashboard
        navigate("/dashboard");
        setLoading(false);
      }, 800);
      return;
    } 
    
    if (email === 'agent@example.com' && password === 'agent123') {
      console.log('Using agent login');
      // Store token data
      localStorage.setItem("accessToken", "mock_token_for_testing");
      localStorage.setItem("tokenType", "bearer");
      localStorage.setItem("role", "Agent");
      localStorage.setItem("company_id", "1");
      
      // Simulate network delay
      setTimeout(() => {
        // Redirect to dashboard with agent view
        navigate("/dashboard");
        setLoading(false);
      }, 800);
      return;
    }

    // For all other accounts, try to authenticate with the backend
    const formData = new URLSearchParams();
    formData.append("username", email); // Backend expects 'username' for email
    formData.append("password", password);

    try {
      console.log(`Attempting to login with email: ${email}`);
      
      // Get API URL from environment variables or use current origin
      const API_URL = import.meta.env.VITE_API_URL || 
                     (window.location.origin !== 'null' ? window.location.origin : 'http://localhost:8000');
      
      const loginUrl = `${API_URL}/api/users/login`;
      console.log(`Login URL: ${loginUrl}`);
      console.log(`Request body: username=${email}, password=${password.substring(0, 1)}***`);
      
      const res = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      console.log(`Login response status: ${res.status}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Login error response:', errorData);
        throw new Error(errorData.detail || "Login failed. Please check your credentials.");
      }
      
      const data = await res.json();
      console.log('Login response data:', data);

      // Store the token (e.g., in localStorage)
      localStorage.setItem("accessToken", data.access_token);
      localStorage.setItem("tokenType", data.token_type);
      const userRole = data.role ? data.role.trim() : "";
      localStorage.setItem("role", userRole);
      
      // Extract company_id from JWT token if possible
      try {
        const tokenParts = data.access_token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('Token payload:', payload);
          if (payload.company_id) {
            localStorage.setItem("company_id", payload.company_id);
          }
        }
      } catch (tokenErr) {
        console.error('Error parsing token:', tokenErr);
      }
      
      console.log(`User role: ${userRole}`);
      
      // Redirect based on role (case-insensitive)
      if (userRole.toLowerCase() === "admin") {
        navigate("/company-config");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      console.error('Login error:', err);
      setError("❌ " + (err.message || "Invalid email or password. Please try again or use one of the demo accounts."));
      setLoading(false);
    }
  };

  return (
    <div className="page-bg">
      <div className="form-container">
        <h2 className="form-title">User Login</h2>
        <form onSubmit={handleSubmit} className="form-fields">
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@company.com"
            />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
            />
          </div>
          <button
            type="submit"
            className="form-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="form-loading">Logging in...</span>
            ) : (
              "Login"
            )}
          </button>
          {error && <div className="form-error">{error}</div>}
        </form>
        <div style={{textAlign: "center", marginTop: "1rem"}}>
            <p>Don't have an account? <a href="/register-user">Register User</a></p>
            <p>Register a new company? <a href="/register-company">Register Company</a></p>
            <div style={{marginTop: "1rem", padding: "10px", backgroundColor: "#e3f2fd", borderRadius: "4px"}}>
              <p><strong>Demo Accounts:</strong></p>
              <p>Admin: admin@example.com / admin123</p>
              <p>User: user@example.com / user123</p>
              <p>Agent: agent@example.com / agent123</p>
            </div>
        </div>
      </div>
    </div>
  );
} 