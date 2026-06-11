import { forwardRef, useCallback } from "react";
import { type VariantProps } from "class-variance-authority";
import { LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth.ts";
import { Button, buttonVariants } from "@/components/ui/button.tsx";

export interface SignInButtonProps
  extends
    Omit<React.ComponentProps<"button">, "onClick">,
    VariantProps<typeof buttonVariants> {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  showIcon?: boolean;
  signInText?: string;
  signOutText?: string;
  asChild?: boolean;
}

/**
 * A button that navigates to the login page or signs the user out.
 */
export const SignInButton = forwardRef<HTMLButtonElement, SignInButtonProps>(
  (
    {
      onClick,
      disabled,
      showIcon = true,
      signInText = "Sign In",
      signOutText = "Sign Out",
      className,
      variant,
      size,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const { isAuthenticated, signin, signout } = useAuth();

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (isAuthenticated) {
          void signout();
        } else {
          signin();
        }
      },
      [isAuthenticated, signout, signin, onClick],
    );

    const buttonText = isAuthenticated ? signOutText : signInText;
    const icon = isAuthenticated ? (
      <LogOut className="size-4" />
    ) : (
      <LogIn className="size-4" />
    );

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        disabled={disabled}
        variant={variant}
        size={size}
        className={className}
        asChild={asChild}
        aria-label={
          isAuthenticated
            ? "Sign out of your account"
            : "Sign in to your account"
        }
        {...props}
      >
        {showIcon && icon}
        {buttonText}
      </Button>
    );
  },
);

SignInButton.displayName = "SignInButton";
