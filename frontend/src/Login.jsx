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
      localStorage.setItem("accessToken", "demo_token_for_admin");
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
      localStorage.setItem("accessToken", "demo_token_for_user");
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
      localStorage.setItem("accessToken", "demo_token_for_agent");
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
    try {
      console.log(`Attempting to login with email: ${email}`);
      
      // Get base URL from environment variables or use current origin
      const BASE_URL = import.meta.env.VITE_API_URL || 
                     (window.location.origin !== 'null' ? window.location.origin : 'http://localhost:8000');
      
      // Use the JSON login endpoint
      const loginUrl = `${BASE_URL}/api/json-login`;
      console.log(`Login URL: ${loginUrl}`);
      
      // Prepare JSON data
      const jsonData = {
        username: email,
        password: password
      };
      
      // Log detailed request information
      console.log("Making login request with:");
      console.log("- URL:", loginUrl);
      console.log("- Method: POST");
      console.log("- Headers:", { "Content-Type": "application/json" });
      console.log("- Body:", JSON.stringify(jsonData));
      
      // Make the request
      const res = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonData)
      });

      console.log(`Login response status: ${res.status}`);
      
      // Handle errors
      if (!res.ok) {
        try {
          const errorText = await res.text();
          console.error('Login error response:', errorText);
          throw new Error("Login failed. Please check your credentials.");
        } catch (e) {
          throw new Error(`Login failed with status ${res.status}. Please try again.`);
        }
      }
      
      // Parse the response
      const data = await res.json();
      console.log('Login response data:', data);

      // Store the token data
      localStorage.setItem("accessToken", data.access_token);
      localStorage.setItem("tokenType", data.token_type);
      const userRole = data.role ? data.role.trim() : "";
      localStorage.setItem("role", userRole);
      localStorage.setItem("company_id", "1"); // Default company ID
      
      console.log(`User role: ${userRole}`);
      
      // Redirect based on role
      if (userRole.toLowerCase() === "admin") {
        navigate("/company-config");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      console.error('Login error:', err);
      setError("❌ " + (err.message || "Invalid email or password. Please try again or use one of the demo accounts."));
    } finally {
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