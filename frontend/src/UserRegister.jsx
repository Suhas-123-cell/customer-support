import React, { useState } from "react";
import FormInput from "./FormInput";
import "./UserRegister.css";

function UserRegister() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "",
    department: "",
    companyCode: "",
    profilePic: null,
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [modal, setModal] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false);

  function validate() {
    var newErrors = {};
    // Full name can be anything, just check if it's provided
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    
    // Company code validation - should start with company name followed by a number
    if (!form.companyCode.trim()) {
      newErrors.companyCode = "Company code is required";
    } else {
      // Check if it contains at least one letter followed by at least one number
      if (!/^[a-zA-Z]+[0-9]+$/.test(form.companyCode)) {
        newErrors.companyCode = "Company code must start with company name followed by a number (e.g., acme123)";
      }
    }
    
    // Email validation - should be in format user@company.com
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      // Basic email format validation
      if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) {
        newErrors.email = "Invalid email format";
      } else {
        // Extract company name from company code (letters only)
        const companyName = form.companyCode.match(/^[a-zA-Z]+/);
        if (companyName && companyName[0]) {
          // Check if email domain starts with the company name
          const emailDomain = form.email.split('@')[1];
          if (!emailDomain.startsWith(companyName[0].toLowerCase())) {
            newErrors.email = `Email domain must match company name: user@${companyName[0].toLowerCase()}.com`;
          }
        }
      }
    }
    
    if (!form.role) newErrors.role = "Role is required";
    if (!form.password) newErrors.password = "Password is required";
    if (!form.confirmPassword) newErrors.confirmPassword = "Confirm your password";
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!form.terms) newErrors.terms = "You must accept the terms";
    return newErrors;
  }

  function handleChange(e) {
    var name = e.target.name;
    var value = e.target.type === "checkbox" ? e.target.checked : e.target.type === "file" ? e.target.files[0] : e.target.value;
    setForm(function (prev) { return { ...prev, [name]: value }; });
  }

  function handleBlur(e) {
    setErrors(function (prev) { return { ...prev, [e.target.name]: undefined }; });
  }

  function showModal(message, type) {
    setModal({ show: true, message: message, type: type });
    setTimeout(function () { setModal({ show: false, message: "", type: "" }); }, 3500);
  }

  function handleSubmit(e) {
    e.preventDefault();
    var validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setLoading(true);
    
    // Demo mode - always succeed with a delay to simulate network request
    setTimeout(() => {
      // Check if the email is already used by a demo account
      if (form.email === 'admin@example.com' || form.email === 'user@example.com' || form.email === 'agent@example.com') {
        showModal("This email is already registered. Please use a different email or login with this account.", "error");
        setLoading(false);
        return;
      }
      
      // Check if company code is valid (for demo, we'll accept any non-empty code)
      if (!form.companyCode.trim()) {
        showModal("Invalid company code. Please enter a valid company code.", "error");
        setLoading(false);
        return;
      }
      
      // Success case
      showModal("Account created successfully! You can now login with your credentials.", "success");
      
      // Clear the form
      setForm({
        fullName: "",
        email: "",
        role: "",
        department: "",
        companyCode: "",
        profilePic: null,
        password: "",
        confirmPassword: "",
        terms: false,
      });
      
      setLoading(false);
    }, 1000);
  }

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="register-title">Create User Account</div>
        <div className="register-grid">
          <FormInput 
            label="Full Name" 
            name="fullName" 
            value={form.fullName} 
            onChange={handleChange} 
            onBlur={handleBlur} 
            required 
            error={errors.fullName} 
          />
          <FormInput 
            label="Email Address" 
            name="email" 
            type="email" 
            value={form.email} 
            onChange={handleChange} 
            onBlur={handleBlur} 
            required 
            error={errors.email} 
            helperText={form.companyCode ? `Format: user@${form.companyCode.match(/^[a-zA-Z]+/)?.[0]?.toLowerCase() || 'company'}.com` : "Format: user@company.com"}
            placeholder={form.companyCode ? `user@${form.companyCode.match(/^[a-zA-Z]+/)?.[0]?.toLowerCase() || 'company'}.com` : "user@company.com"}
          />
          <FormInput 
            label="Role" 
            name="role" 
            type="select" 
            value={form.role} 
            onChange={handleChange} 
            onBlur={handleBlur} 
            options={["Admin", "Agent", "Customer"]} 
            required 
            error={errors.role} 
          />
          <FormInput 
            label="Department" 
            name="department" 
            value={form.department} 
            onChange={handleChange} 
            onBlur={handleBlur} 
            placeholder="Optional" 
          />
          <FormInput 
            label="Company Code / ID" 
            name="companyCode" 
            value={form.companyCode} 
            onChange={handleChange} 
            onBlur={(e) => {
              handleBlur(e);
              // Update email placeholder when company code changes
              if (form.email && form.email.includes('@')) {
                const username = form.email.split('@')[0];
                const companyName = e.target.value.match(/^[a-zA-Z]+/)?.[0]?.toLowerCase();
                if (companyName) {
                  const newEmail = `${username}@${companyName}.com`;
                  setForm(prev => ({ ...prev, email: newEmail }));
                }
              }
            }} 
            required 
            error={errors.companyCode}
            helperText="Format: company name followed by a number (e.g., acme123)"
          />
          <FormInput label="Profile Picture" name="profilePic" type="file" accept="image/*" onChange={handleChange} onBlur={handleBlur} />
          <FormInput label="Password" name="password" type="password" value={form.password} onChange={handleChange} onBlur={handleBlur} required error={errors.password} />
          <FormInput label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur} required error={errors.confirmPassword} />
          <div className="form-group form-checkbox">
            <input id="terms" name="terms" type="checkbox" checked={form.terms} onChange={handleChange} className="form-checkbox-input" required />
            <label htmlFor="terms" className="form-label form-checkbox-label">
              I agree to the <a href="#" className="form-link">Terms and Conditions</a>
            </label>
          </div>
          {errors.terms && <div className="form-error">{errors.terms}</div>}
        </div>
        <div className="form-actions">
          <button type="submit" className="form-button" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </div>
        {modal.show && (
          <div className={`form-modal ${modal.type === "success" ? "form-modal-success" : "form-modal-error"}`}>{modal.message}</div>
        )}
      </form>
    </div>
  );
}

export default UserRegister; 