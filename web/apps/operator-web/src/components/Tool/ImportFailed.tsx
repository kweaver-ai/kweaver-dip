import { useMemo } from 'react';
import { Modal, Table } from 'antd';
import { useMicroWidgetProps } from '@/hooks';
import { getConfig } from '@/utils/http';

const getContent = (dataSource: any[]) => {
  const columns = [
    {
      title: '名称',
      dataIndex: 'tool_name',
      key: 'tool_name',
    },
    {
      title: '失败原因',
      dataIndex: 'error_msg',
      key: 'description',
      render: (errorMsg: any) => errorMsg?.description,
    },
  ];
  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      size="small"
      style={{ wordBreak: 'break-all', margin: '20px 0' }}
    />
  );
};

export const showImportFailedData = (dataSource: any[]) => {
  Modal.info({
    icon: null,
    centered: true,
    maskClosable: false,
    width: 800,
    title: '导入失败列表',
    getContainer: () => getConfig('container'),
    closable: true,
    footer: null,
    content: getContent(dataSource),
  });
};

export default function ImportFailed({ closeModal, dataSource }: any) {
  const microWidgetProps = useMicroWidgetProps();
  const Content = useMemo(() => getContent(dataSource), [dataSource]);
  const handleCancel = () => {
    closeModal?.([]);
  };

  return (
    <Modal
      title="导入失败列表"
      centered
      open={true}
      onCancel={handleCancel}
      footer={null}
      width={800}
      getContainer={() => microWidgetProps.container}
      maskClosable={false}
    >
      {Content}
    </Modal>
  );
}
