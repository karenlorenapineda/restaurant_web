import { forwardRef } from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
} from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      loading = false,
      disabled,
      type = "button",
      className = "",
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={`ui-button ui-button--${variant} ${className}`}
      >
        {loading && <span aria-hidden="true" className="ui-spinner" />}
        {children}
      </button>
    );
  },
);
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className = "", ...props },
  ref,
) {
  return (
    <input
      {...props}
      ref={ref}
      aria-invalid={invalid || props["aria-invalid"]}
      className={`ui-control ${className}`}
    />
  );
});
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ invalid = false, className = "", ...props }, ref) {
    return (
      <select
        {...props}
        ref={ref}
        aria-invalid={invalid || props["aria-invalid"]}
        className={`ui-control ${className}`}
      />
    );
  },
);
