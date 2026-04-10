import { Typography } from "antd";
import { CardAdapter } from "../../_adapters/antd/CardAdapter";
import type { PageContainerProps } from "./types";

export function PageContainer({
  title,
  description,
  extra,
  children,
  className,
  style
}: PageContainerProps) {
  return (
    <CardAdapter className={className} style={style}>
      {title || description || extra ? (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16
            }}
          >
            <div>
              {title ? <Typography.Title level={4}>{title}</Typography.Title> : null}
              {description ? (
                <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  {description}
                </Typography.Paragraph>
              ) : null}
            </div>
            {extra ? <div>{extra}</div> : null}
          </div>
        </div>
      ) : null}
      {children}
    </CardAdapter>
  );
}

export type { PageContainerProps } from "./types";
