import type { PropsWithChildren } from "react";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className = "" }: CardProps) {
  return <section className={`app-card p-6 ${className}`}>{children}</section>;
}

export function GradientCard({ children, className = "" }: CardProps) {
  return <section className={`gradient-card p-6 ${className}`}>{children}</section>;
}
