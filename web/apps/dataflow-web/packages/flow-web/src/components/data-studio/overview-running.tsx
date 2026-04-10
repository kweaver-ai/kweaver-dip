import { Card, Table, Tooltip } from "antd";
import styles from "./index.module.less";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { formatNumber } from "../../utils/format-number";
import { memo, useContext, useEffect, useState } from "react";
import { API, MicroAppContext, useTranslate } from "@applet/common";
import { useHandleErrReq } from "../../utils/hooks";

export const OverviewRunning = memo(({ trigger,random }: any) => {
  const t = useTranslate('dataStudio');
  const columns = [
    {
      title: t('overviewRunning.processName'),
      dataIndex: "name",
      key: "name",
    },
    {
      title: t('overviewRunning.totalRuns'),
      dataIndex: "status_summary",
      key: "total",
      render: (status_summary: any) => formatNumber(status_summary?.total),
    },
    {
      title: t('overviewRunning.successRate'),
      dataIndex: "metric",
      key: "success_rate",
      render: (metric: any) => `${metric?.success_rate}%`,
    },
    {
      title: t('overviewRunning.successCount'),
      dataIndex: "status_summary",
      key: "success",
      render: (status_summary: any) => formatNumber(status_summary?.success),
    },
    {
      title: t('overviewRunning.runningCount'),
      dataIndex: "status_summary",
      key: "running",
      render: (status_summary: any) => formatNumber(status_summary?.running),
    },
    {
      title: t('overviewRunning.failedCount'),
      dataIndex: "status_summary",
      key: "failed",
      render: (status_summary: any) => formatNumber(status_summary?.failed),
    },
    {
      title: t('overviewRunning.avgDuration'),
      dataIndex: "metric",
      key: "avg_run_duration",
      render: (metric: any) => `${metric?.avg_run_duration}s`,
    },
    {
      title: t('overviewRunning.creator'),
      dataIndex: "creator",
      key: "creator",
    },
  ];
  const [recentlyList, setRecentlyList] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const { prefixUrl } = useContext(MicroAppContext);
  const handleErr = useHandleErrReq();

  const getRecently = async () => {
    setRecentlyList([]);
    setLoading(true);
    try {
      const { data } = await API.axios.get(
        `${prefixUrl}/api/automation/v1/observability/recent`,
        {
          params: {
            trigger,
            type: "data-flow",
          },
        }
      );
      setRecentlyList(data || []);
    } catch (error: any) {
      handleErr({ error: error?.response });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRecently();
  }, [trigger,random]);

  return (
    <Card className={styles["data-studio-card"]}>
      <div className={styles["data-studio-card-title"]}>
        {t('overviewRunning.runningNow')}
        <Tooltip
          placement="top"
          title={t('overviewRunning.runningNowTooltip')}
        >
          <QuestionCircleOutlined className={styles["data-studio-card-icon"]} />
        </Tooltip>
      </div>
      <Table
        dataSource={recentlyList}
        columns={columns}
        pagination={false}
        loading={loading}
        size="small"
      />
    </Card>
  );
});
