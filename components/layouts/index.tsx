import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

/**
 * Consistent card component with responsive design
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  padding = "md",
}) => {
  const paddingClass = {
    sm: "p-4",
    md: "card-padding",
    lg: "p-6 sm:p-8",
  }[padding];

  return <div className={`card ${paddingClass} ${className}`}>{children}</div>;
};

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Consistent section component with optional header
 */
export const Section: React.FC<SectionProps> = ({
  children,
  title,
  subtitle,
  action,
  className = "",
}) => {
  return (
    <div className={`section-spacing ${className}`}>
      {(title || action) && (
        <div className="flex-responsive mb-4 sm:mb-6">
          {title && (
            <div className="flex-1">
              <h2 className="section-title">{title}</h2>
              {subtitle && <p className="page-subtitle mt-1">{subtitle}</p>}
            </div>
          )}
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

/**
 * Consistent button component with responsive design
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  onClick,
  type = "button",
  className = "",
}) => {
  const baseClass = variant === "primary" ? "btn-primary" : "btn-secondary";
  const sizeClass = {
    sm: "py-2 px-3 text-sm",
    md: "py-2.5 px-4 text-sm",
    lg: "py-3 px-6 text-base",
  }[size];
  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${sizeClass} ${widthClass} ${disabledClass} ${className} flex items-center justify-center gap-2`}
    >
      {children}
    </button>
  );
};

export { PageLayout } from "./PageLayout";
