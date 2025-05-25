import React, { useState } from "react";
import FormInput from "./FormInput";
import "./CompanyRegister.css";

function CompanyRegister() {
  const [form, setForm] = useState({
    companyName: "",
    companyEmail: "",
    phone: "",
    website: "",
    industry: "",
    description: "",
    logo: null,
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [modal, setModal] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false);

  function validate() {
    var newErrors = {};
    if (!form.companyName.trim()) newErrors.companyName = "Company name is required";
    if (!form.companyEmail.trim()) newErrors.companyEmail = "Email is required";
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.companyEmail))
      newErrors.companyEmail = "Invalid email format";
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
    
    // For demo purposes, simulate successful registration
    setTimeout(() => {
      showModal("Company registered successfully! You can now login with your company credentials.", "success");
      setForm({
        companyName: "",
        companyEmail: "",
        phone: "",
        website: "",
        industry: "",
        description: "",
        logo: null,
        password: "",
        confirmPassword: "",
        terms: false,
      });
      setLoading(false);
    }, 1500);
    
    // Uncomment the following code when backend is ready
    /*
    var formData = new FormData();
    formData.append("companyName", form.companyName);
    formData.append("companyEmail", form.companyEmail);
    formData.append("phone", form.phone);
    formData.append("website", form.website);
    formData.append("industry", form.industry);
    formData.append("description", form.description);
    if (form.logo) formData.append("logo", form.logo);
    formData.append("password", form.password);
    fetch("http://localhost:8000/companies/register", {
      method: "POST",
      body: formData,
    })
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function (text) {
            let data;
            try {
              data = text ? JSON.parse(text) : {};
            } catch {
              data = {};
            }
            throw new Error(data.detail || "Registration failed");
          });
        }
        return res.text();
      })
      .then(function () {
        showModal("Company registered successfully!", "success");
        setForm({
          companyName: "",
          companyEmail: "",
          phone: "",
          website: "",
          industry: "",
          description: "",
          logo: null,
          password: "",
          confirmPassword: "",
          terms: false,
        });
      })
      .catch(function (err) {
        showModal(err.message || "Network error. Please try again.", "error");
      })
      .finally(function () { setLoading(false); });
    */
  }

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="register-title">Register Company</div>
        <div className="register-grid">
          <FormInput label="Company Name" name="companyName" value={form.companyName} onChange={handleChange} onBlur={handleBlur} required error={errors.companyName} />
          <FormInput label="Company Email" name="companyEmail" type="email" value={form.companyEmail} onChange={handleChange} onBlur={handleBlur} required error={errors.companyEmail} />
          <FormInput label="Phone Number" name="phone" type="tel" value={form.phone} onChange={handleChange} onBlur={handleBlur} placeholder="Optional" />
          <FormInput label="Company Website" name="website" type="url" value={form.website} onChange={handleChange} onBlur={handleBlur} placeholder="Optional" />
          <FormInput label="Industry" name="industry" type="select" value={form.industry} onChange={handleChange} onBlur={handleBlur} options={["Tech", "Healthcare", "Retail", "Finance", "Other"]} />
          <FormInput label="Description" name="description" type="textarea" value={form.description} onChange={handleChange} onBlur={handleBlur} placeholder="Optional" />
          <FormInput label="Logo" name="logo" type="file" accept="image/*" onChange={handleChange} onBlur={handleBlur} />
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
            {loading ? "Registering..." : "Register Company"}
          </button>
        </div>
        {modal.show && (
          <div className={`form-modal ${modal.type === "success" ? "form-modal-success" : "form-modal-error"}`}>{modal.message}</div>
        )}
      </form>
    </div>
  );
}

export default CompanyRegister; 