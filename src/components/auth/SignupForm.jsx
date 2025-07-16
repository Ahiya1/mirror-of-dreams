import React, { useState, useEffect } from "react";
import { apiClient } from "../../services/api";

/**
 * Beautiful signup form component converted from HTML register page
 * @param {Object} props - Component props
 * @param {Function} props.onSuccess - Success callback
 * @param {Function} props.onSwitchToSignin - Switch to signin callback
 * @returns {JSX.Element} - Signup form component
 */
const SignupForm = ({ onSuccess, onSwitchToSignin }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [passwordHint, setPasswordHint] = useState({
    text: "Password must be at least 6 characters",
    isValid: false,
  });

  useEffect(() => {
    // Auto-focus name input with delay for smooth animation
    const timer = setTimeout(() => {
      const nameInput = document.getElementById("signup-name");
      if (nameInput) {
        nameInput.focus();
      }
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  /**
   * Handle form input changes
   * @param {Event} e - Input event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear messages when user types
    if (message.text) {
      setMessage({ text: "", type: "" });
    }

    // Handle password validation
    if (name === "password") {
      handlePasswordValidation(value);
    }
  };

  /**
   * Handle password validation with hints
   * @param {string} password - Password value
   */
  const handlePasswordValidation = (password) => {
    if (password.length === 0) {
      setPasswordHint({
        text: "Password must be at least 6 characters",
        isValid: false,
      });
    } else if (password.length >= 6) {
      setPasswordHint({
        text: "Strong password!",
        isValid: true,
      });
    } else {
      setPasswordHint({
        text: `${6 - password.length} more character${
          6 - password.length === 1 ? "" : "s"
        } needed`,
        isValid: false,
      });
    }
  };

  /**
   * Handle form submission
   * @param {Event} e - Submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    const { name, email, password, confirmPassword } = formData;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      showMessage("Please fill in all fields to continue", "error");
      return;
    }

    if (!validateEmail(email)) {
      showMessage("Please enter a valid email address", "error");
      return;
    }

    if (password.length < 6) {
      showMessage("Password must be at least 6 characters", "error");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Passwords do not match", "error");
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await apiClient.post("/api/auth", {
        action: "signup",
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password,
        tier: "free",
      });

      if (response.success) {
        showMessage(
          "Welcome to your consciousness journey! Your free account is ready.",
          "success"
        );
        onSuccess(response);
      } else {
        throw new Error(response.error || "Account creation failed");
      }
    } catch (error) {
      console.error("Signup error:", error);

      let errorMessage = "Something went wrong. Please try again.";

      if (error.status === 400) {
        errorMessage = error.message || "Invalid information provided.";
      } else if (error.status === 409) {
        errorMessage = "An account with this email already exists.";
      } else if (error.status === 429) {
        errorMessage = "Too many attempts. Please wait a moment and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      showMessage(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Show message to user
   * @param {string} text - Message text
   * @param {string} type - Message type (error/success)
   */
  const showMessage = (text, type) => {
    setMessage({ text, type });

    if (type === "error") {
      setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 5000);
    }
  };

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - Whether email is valid
   */
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Toggle confirm password visibility
   */
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  /**
   * Handle Enter key press for form submission
   * @param {Event} e - Keyboard event
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  return (
    <div className="signup-form-container">
      {/* Free Badge */}
      <div className="free-badge">
        <span>✨</span>
        <span>Free Forever</span>
      </div>

      {/* Messages */}
      {message.text && (
        <div
          className={`message ${message.type} ${message.text ? "show" : ""}`}
        >
          {message.text}
        </div>
      )}

      {/* Signup Form */}
      <div className="signup-form">
        {/* Name Field */}
        <div className="form-group">
          <label htmlFor="signup-name" className="form-label">
            Your name
          </label>
          <input
            type="text"
            id="signup-name"
            name="name"
            className="form-input"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            required
            autoComplete="name"
          />
        </div>

        {/* Email Field */}
        <div className="form-group">
          <label htmlFor="signup-email" className="form-label">
            Your email
          </label>
          <input
            type="email"
            id="signup-email"
            name="email"
            className="form-input"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            required
            autoComplete="email"
          />
        </div>

        {/* Password Field */}
        <div className="form-group">
          <label htmlFor="signup-password" className="form-label">
            Choose a password
          </label>
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              id="signup-password"
              name="password"
              className="form-input password-input"
              placeholder="Create a secure password"
              value={formData.password}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              required
              autoComplete="new-password"
              minLength="6"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={togglePasswordVisibility}
              aria-label="Toggle password visibility"
            >
              <span>{showPassword ? "🙈" : "👁️"}</span>
            </button>
          </div>
          <div
            className={`password-hint ${passwordHint.isValid ? "valid" : ""}`}
          >
            {passwordHint.text}
          </div>
        </div>

        {/* Confirm Password Field */}
        <div className="form-group">
          <label htmlFor="signup-confirm-password" className="form-label">
            Confirm password
          </label>
          <div className="password-container">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="signup-confirm-password"
              name="confirmPassword"
              className="form-input password-input"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              required
              autoComplete="new-password"
              minLength="6"
              style={{
                borderColor:
                  formData.confirmPassword.length > 0 &&
                  formData.password !== formData.confirmPassword
                    ? "rgba(239, 68, 68, 0.4)"
                    : "",
              }}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={toggleConfirmPasswordVisibility}
              aria-label="Toggle password visibility"
            >
              <span>{showConfirmPassword ? "🙈" : "👁️"}</span>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          className="submit-button"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="button-loading">
              <div className="loading-spinner"></div>
              <span>Creating your sacred space...</span>
            </span>
          ) : (
            <span className="button-text">Create Free Account</span>
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="signup-footer">
        <p className="signin-text">Already have an account?</p>
        <button
          type="button"
          className="switch-link"
          onClick={onSwitchToSignin}
        >
          <span>🔑</span>
          <span>Sign in to your journey</span>
        </button>
      </div>

      {/* Component Styles */}
      <style jsx>{`
        .signup-form-container {
          display: flex;
          flex-direction: column;
          gap: clamp(0.7rem, 1.4vh, 1rem);
          width: 100%;
          position: relative;
        }

        .free-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          padding: clamp(0.25rem, 0.6vh, 0.4rem) clamp(0.6rem, 1.5vw, 0.9rem);
          background: linear-gradient(
            135deg,
            rgba(16, 185, 129, 0.12),
            rgba(5, 150, 105, 0.08)
          );
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 50px;
          color: rgba(110, 231, 183, 0.9);
          font-size: clamp(0.6rem, 1.2vw, 0.7rem);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: clamp(0.2rem, 0.4vh, 0.3rem);
          animation: badgeGlow 4s ease-in-out infinite;
          align-self: center;
        }

        @keyframes badgeGlow {
          0%,
          100% {
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
          }
          50% {
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
          }
        }

        .signup-form {
          display: flex;
          flex-direction: column;
          gap: clamp(0.8rem, 1.6vh, 1.1rem);
          width: 100%;
          position: relative;
        }

        .form-group {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: clamp(0.2rem, 0.4vh, 0.3rem);
        }

        .form-label {
          font-size: clamp(0.7rem, 1.4vw, 0.8rem);
          color: rgba(255, 255, 255, 0.8);
          font-weight: 400;
          letter-spacing: 0.3px;
          margin-bottom: clamp(0.1rem, 0.2vh, 0.15rem);
        }

        .form-input {
          width: 100%;
          padding: clamp(0.8rem, 1.5vh, 1rem) clamp(1rem, 2vw, 1.2rem);
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.06) 0%,
            rgba(255, 255, 255, 0.03) 100%
          );
          backdrop-filter: blur(15px) saturate(120%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: clamp(8px, 1.6vw, 12px);
          color: #fff;
          font-size: clamp(0.8rem, 1.6vw, 0.95rem);
          font-family: inherit;
          transition: all 0.4s ease;
          font-weight: 300;
          outline: none;
          -webkit-tap-highlight-color: transparent;
          position: relative;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .form-input:focus {
          border-color: rgba(147, 51, 234, 0.4);
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(147, 51, 234, 0.04) 100%
          );
          box-shadow: 0 0 25px rgba(147, 51, 234, 0.15),
            0 4px 20px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px) scale(1.01);
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
          font-style: italic;
          font-weight: 300;
        }

        .password-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-input {
          padding-right: clamp(2.8rem, 6vw, 3.8rem);
        }

        .password-toggle {
          position: absolute;
          right: clamp(0.8rem, 1.8vw, 1rem);
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          padding: clamp(0.35rem, 0.7vh, 0.45rem);
          border-radius: clamp(6px, 1.2vw, 8px);
          transition: all 0.3s ease;
          font-size: clamp(0.8rem, 1.8vw, 1rem);
          display: flex;
          align-items: center;
          justify-content: center;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          width: clamp(2rem, 4vw, 2.5rem);
          height: clamp(2rem, 4vw, 2.5rem);
        }

        .password-toggle:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.18);
          color: rgba(255, 255, 255, 0.9);
          transform: translateY(-50%) scale(1.05);
        }

        .password-toggle:active {
          transform: translateY(-50%) scale(0.95);
        }

        .password-hint {
          font-size: clamp(0.6rem, 1.2vw, 0.7rem);
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          margin-top: clamp(0.15rem, 0.3vh, 0.2rem);
          transition: all 0.3s ease;
        }

        .password-hint::before {
          content: "💡";
          font-size: 0.8em;
          opacity: 0.7;
        }

        .password-hint.valid {
          color: rgba(110, 231, 183, 0.8);
        }

        .password-hint.valid::before {
          content: "✅";
        }

        .submit-button {
          width: 100%;
          padding: clamp(0.9rem, 1.8vh, 1.2rem);
          background: linear-gradient(
            135deg,
            rgba(147, 51, 234, 0.15) 0%,
            rgba(99, 102, 241, 0.12) 50%,
            rgba(147, 51, 234, 0.15) 100%
          );
          backdrop-filter: blur(15px);
          border: 1px solid rgba(147, 51, 234, 0.3);
          border-radius: clamp(8px, 1.6vw, 12px);
          color: rgba(196, 181, 253, 0.95);
          font-size: clamp(0.8rem, 1.7vw, 0.95rem);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.4s ease;
          letter-spacing: 0.5px;
          position: relative;
          overflow: hidden;
          outline: none;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          margin-top: clamp(0.2rem, 0.5vh, 0.4rem);
          min-height: clamp(40px, 6vh, 50px);
          box-shadow: 0 6px 25px rgba(147, 51, 234, 0.12);
        }

        .submit-button::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            45deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }

        .submit-button:hover::before {
          transform: translateX(100%);
        }

        .submit-button:hover:not(:disabled) {
          background: linear-gradient(
            135deg,
            rgba(147, 51, 234, 0.22) 0%,
            rgba(99, 102, 241, 0.18) 50%,
            rgba(147, 51, 234, 0.22) 100%
          );
          border-color: rgba(147, 51, 234, 0.45);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 35px rgba(147, 51, 234, 0.2);
          color: rgba(196, 181, 253, 1);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .submit-button:active:not(:disabled) {
          transform: translateY(-1px) scale(0.98);
        }

        .button-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(0.4rem, 1vw, 0.6rem);
        }

        .loading-spinner {
          width: clamp(12px, 2.5vw, 16px);
          height: clamp(12px, 2.5vw, 16px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          border-top-color: rgba(255, 255, 255, 0.8);
          animation: elegantSpin 1.2s ease-in-out infinite;
        }

        @keyframes elegantSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .signup-footer {
          width: 100%;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(0.4rem, 0.8vh, 0.6rem);
          margin-top: clamp(0.6rem, 1.2vh, 0.9rem);
        }

        .signin-text {
          color: rgba(255, 255, 255, 0.6);
          font-size: clamp(0.7rem, 1.4vw, 0.8rem);
          line-height: 1.2;
          font-weight: 300;
          margin-bottom: clamp(0.15rem, 0.3vh, 0.2rem);
        }

        .switch-link {
          display: inline-flex;
          align-items: center;
          gap: clamp(0.3rem, 0.8vw, 0.5rem);
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: clamp(8px, 1.6vw, 12px);
          padding: clamp(0.6rem, 1.2vh, 0.8rem) clamp(1.1rem, 2.5vw, 1.5rem);
          transition: all 0.4s ease;
          font-weight: 400;
          font-size: clamp(0.7rem, 1.4vw, 0.8rem);
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          white-space: nowrap;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }

        .switch-link::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            45deg,
            transparent,
            rgba(255, 255, 255, 0.08),
            transparent
          );
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }

        .switch-link:hover::before {
          transform: translateX(100%);
        }

        .switch-link:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.95);
          transform: translateY(-2px) scale(1.02);
        }

        .message {
          padding: clamp(0.6rem, 1.2vh, 0.8rem);
          border-radius: clamp(8px, 1.5vw, 10px);
          font-size: clamp(0.7rem, 1.4vw, 0.8rem);
          text-align: center;
          opacity: 0;
          transform: translateY(-15px);
          transition: all 0.4s ease;
          font-weight: 300;
          margin-bottom: clamp(0.5rem, 1vh, 0.7rem);
          position: relative;
          backdrop-filter: blur(15px);
        }

        .message.show {
          opacity: 1;
          transform: translateY(0);
        }

        .message.error {
          background: linear-gradient(
            135deg,
            rgba(239, 68, 68, 0.12) 0%,
            rgba(239, 68, 68, 0.08) 100%
          );
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: rgba(252, 165, 165, 0.95);
        }

        .message.success {
          background: linear-gradient(
            135deg,
            rgba(34, 197, 94, 0.12) 0%,
            rgba(34, 197, 94, 0.08) 100%
          );
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: rgba(110, 231, 183, 0.95);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .form-input {
            padding: clamp(0.7rem, 1.3vh, 0.9rem);
          }

          .password-toggle {
            width: clamp(1.8rem, 3.5vw, 2.2rem);
            height: clamp(1.8rem, 3.5vw, 2.2rem);
            right: clamp(0.6rem, 1.4vw, 0.9rem);
          }

          .password-input {
            padding-right: clamp(2.5rem, 5vw, 3.2rem);
          }
        }

        @media (max-width: 480px) {
          .form-input {
            padding: clamp(0.6rem, 1.2vh, 0.8rem);
          }

          .submit-button {
            padding: clamp(0.8rem, 1.5vh, 1rem);
          }
        }

        /* Focus indicators */
        .form-input:focus-visible,
        .submit-button:focus-visible,
        .switch-link:focus-visible,
        .password-toggle:focus-visible {
          outline: 2px solid rgba(147, 51, 234, 0.6);
          outline-offset: 2px;
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .form-input,
          .submit-button,
          .switch-link,
          .message,
          .free-badge {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SignupForm;
