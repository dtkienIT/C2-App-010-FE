import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";

type CardProps = PropsWithChildren<ComponentPropsWithoutRef<"section"> & {
  className?: string;
}>;

export function Card({ children, className = "", ...props }: CardProps) {
  return <section className={`app-card p-6 ${className}`} {...props}>{children}</section>;
}

export function GradientCard({ children, className = "", ...props }: CardProps) {
  return <section className={`gradient-card p-6 ${className}`} {...props}>{children}</section>;
}
