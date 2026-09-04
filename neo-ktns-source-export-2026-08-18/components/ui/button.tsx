import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export const buttonStyles = (variant: ButtonProps["variant"] = "primary") =>
  cn(
    "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-50",
    variant === "primary" && "bg-[var(--copper-action)] text-white shadow-[0_8px_22px_rgba(181,106,60,.16)] hover:bg-[#9e5933] active:bg-[#8d4f2e]",
    variant === "secondary" && "border border-[var(--border)] bg-[color:var(--surface)]/80 text-[var(--foreground)] hover:border-gold hover:bg-[var(--surface)]",
    variant === "ghost" && "text-[var(--foreground)] hover:bg-[var(--surface)]",
  );

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonStyles(variant), className)} {...props} />;
}

export function ButtonLink({ href, children, className, variant = "primary" }: React.PropsWithChildren<{ href: string; className?: string; variant?: ButtonProps["variant"] }>) {
  return <Link className={cn(buttonStyles(variant), className)} href={href}>{children}</Link>;
}
