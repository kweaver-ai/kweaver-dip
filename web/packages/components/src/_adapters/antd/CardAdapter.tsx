import { Card } from "antd";
import type { CardProps } from "antd";

export interface CardAdapterProps extends CardProps {}

export function CardAdapter(props: CardAdapterProps) {
  return <Card bordered={false} {...props} />;
}
