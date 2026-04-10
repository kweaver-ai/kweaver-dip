import { Empty } from "antd";
import type { EmptyProps } from "antd";

export interface EmptyAdapterProps extends EmptyProps {}

export function EmptyAdapter(props: EmptyAdapterProps) {
  return <Empty {...props} />;
}
