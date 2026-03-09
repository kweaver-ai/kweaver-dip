import { Typography } from "antd";
import { EmptyAdapter } from "../../_adapters/antd/EmptyAdapter";
import type { EmptyStateProps } from "./types";

export function EmptyState({
  title = "暂无数据",
  description = "当前没有可展示的内容。",
  action,
  image,
  className
}: EmptyStateProps) {
  return (
    <div className={className}>
      <EmptyAdapter image={image} description={false}>
        <Typography.Title level={5} style={{ marginBottom: 8 }}>
          {title}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {description}
        </Typography.Paragraph>
        {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
      </EmptyAdapter>
    </div>
  );
}

export type { EmptyStateProps } from "./types";
