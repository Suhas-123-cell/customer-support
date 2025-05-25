import React from "react";

function FormInput(props) {
  const {
    label,
    name,
    type = "text",
    value,
    onChange,
    onBlur,
    placeholder,
    error,
    options,
    accept,
    required,
    ...rest
  } = props;

  if (type === "select") {
    return (
      <div className="form-group">
        <label className="form-label" htmlFor={name}>
          {label} {required && <span className="form-required">*</span>}
        </label>
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`form-input${error ? " form-input-error" : ""}`}
          required={required}
          {...rest}
        >
          <option value="">Select {label}</option>
          {options &&
            options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
        </select>
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <div className="form-group">
        <label className="form-label" htmlFor={name}>
          {label} {required && <span className="form-required">*</span>}
        </label>
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`form-input${error ? " form-input-error" : ""}`}
          required={required}
          {...rest}
        />
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={name}>
        {label} {required && <span className="form-required">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={type === "file" ? undefined : value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`form-input${error ? " form-input-error" : ""}`}
        accept={accept}
        required={required}
        {...rest}
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default FormInput; 