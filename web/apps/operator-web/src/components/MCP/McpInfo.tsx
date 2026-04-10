import { useMemo } from 'react';
import { Collapse } from 'antd';
import './style.less';
import JsonschemaTab from '../MyOperator/JsonschemaTab';
import { EditOutlined, InteractionOutlined, ProfileOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

export default function McpInfo({ selectedTool, onUpdateInputs }: any) {
  const jsonschemaTool = useMemo(
    () => ({
      ...selectedTool,
      metadata: {
        api_spec: {
          request_body: {
            content: {
              'application/json': selectedTool?.inputSchema,
            },
          },
          $defs: selectedTool?.inputSchema?.$defs,
        },
      },
    }),
    [selectedTool]
  );

  return (
    <div className="operator-info">
      <Collapse ghost defaultActiveKey={'1'} expandIconPosition="end" className="operator-details-collapse">
        <Panel
          key="1"
          header={
            <span>
              <ProfileOutlined /> 工具信息 <EditOutlined />
            </span>
          }
        >
          <div style={{ padding: '0 16px' }}>
            <div className="operator-info-title">工具名称</div>
            <div className="operator-info-desc">{selectedTool?.name}</div>
            <div className="operator-info-title">工具描述</div>
            <div className="operator-info-desc">{selectedTool?.description || '暂无描述'}</div>
            {/* <div className='operator-info-title'>
                MCP规则
              </div> */}
            {/* <div className='operator-info-desc'>
                {selectedTool?.name}
              </div> */}
          </div>
        </Panel>
        <Panel
          key="2"
          header={
            <span>
              <InteractionOutlined /> 输入
            </span>
          }
          forceRender
        >
          <JsonschemaTab
            operatorInfo={jsonschemaTool}
            showIn={false}
            type="Inputs"
            onTableDataChange={onUpdateInputs}
          />
        </Panel>
      </Collapse>
    </div>
  );
}
