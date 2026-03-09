import type { CSSProperties, ReactNode } from "react";

export interface PageContainerProps {
  title?: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}
