// src/components/shared/Button.jsx
import React from "react";
import { triggerHapticFeedback } from "../../utils/formatters";

const Button = ({
  children,
  variant = "default",
  tone = null,
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
  hapticFeedback = false,
  ...props
}) => {
  // Build className based on props
  const getButtonClassName = () => {
    let classes = ["cosmic-button"];

    // Variant classes
    if (variant === "primary") {
      classes.push("cosmic-button--primary");
    }

    // Tone classes (overrides variant)
    if (tone) {
      classes.push(`cosmic-button--${tone}`);
    }

    // Size classes
    if (size !== "md") {
      classes.push(`cosmic-button--${size}`);
    }

    // Add custom className
    if (className) {
      classes.push(className);
    }

    return classes.join(" ");
  };

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }

    // Trigger haptic feedback if enabled
    if (hapticFeedback) {
      triggerHapticFeedback();
    }

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={getButtonClassName()}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="spinner spinner--sm" aria-hidden="true" />}
      {children}
    </button>
  );
};

// Pre-configured button variants for convenience
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;

export const FusionButton = (props) => (
  <Button tone="fusion" hapticFeedback {...props} />
);

export const GentleButton = (props) => (
  <Button tone="gentle" hapticFeedback {...props} />
);

export const IntenseButton = (props) => (
  <Button tone="intense" hapticFeedback {...props} />
);

export const SmallButton = (props) => <Button size="sm" {...props} />;

export const LargeButton = (props) => <Button size="lg" {...props} />;

export default Button;
