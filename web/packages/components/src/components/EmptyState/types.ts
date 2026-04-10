import type { ReactNode } from "react";

export interface EmptyStateProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  image?: ReactNode;
  className?: string;
}
