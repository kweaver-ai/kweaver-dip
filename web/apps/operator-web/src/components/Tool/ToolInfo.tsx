import { useMemo, useEffect, useState } from 'react';
import { Collapse, Switch } from 'antd';
import './style.less';
import MethodTag from '../OperatorList/MethodTag';
import JsonschemaTab from '../MyOperator/JsonschemaTab';
import { EditOutlined, InteractionOutlined, ProfileOutlined } from '@ant-design/icons';
import { ToolStatusEnum } from '../OperatorList/types';

const { Panel } = Collapse;

const isNotExistTip = '无法获取，底层算子已被删除';
const errorStyle = { color: 'red' };

export default function ToolInfo({ selectedTool, onUpdateInputs }: any) {
  const [activeKey, setActiveKey] = useState<string[]>(['1']);
  const isExist = useMemo(() => Boolean(selectedTool?.metadata?.version), [selectedTool?.metadata?.version]);

  useEffect(() => {
    if (!isExist) {
      // 工具不存在，只显示信息，所以要默认展开信息Panel
      setActiveKey(['1']);
    }
  }, [isExist]);

  const onChange = (checked: boolean) => {
    console.log(`switch to ${checked}`);
  };

  return (
    <div className="operator-info">
      <Collapse
        ghost
        activeKey={activeKey}
        expandIconPosition="end"
        className="operator-details-collapse"
        onChange={setActiveKey}
      >
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
            <div className="operator-info-title">工具规则</div>
            <div className="operator-info-desc">{selectedTool?.use_rule || '暂无规则'}</div>
            <div className="operator-info-title">Server URL</div>
            <div className="operator-info-desc" style={isExist ? {} : errorStyle}>
              {isExist ? selectedTool?.metadata?.server_url : isNotExistTip}
            </div>
            <div className="operator-info-title">工具路径</div>
            <div className="operator-info-desc" style={isExist ? {} : errorStyle}>
              {isExist ? selectedTool?.metadata?.path : isNotExistTip}
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{ marginRight: '50px' }}>
                <span style={{ marginRight: '6px', color: '#00000072' }}>请求方法</span>
                {isExist ? (
                  <MethodTag status={selectedTool?.metadata?.method} />
                ) : (
                  <div style={errorStyle}>{isNotExistTip}</div>
                )}
              </div>
              <div>
                <span style={{ marginRight: '6px', color: '#00000072' }}>工具状态</span>
                {isExist ? (
                  <>
                    <Switch
                      size="small"
                      value={selectedTool?.status !== ToolStatusEnum.Disabled}
                      onChange={onChange}
                      style={{ marginRight: '6px' }}
                    />
                    {selectedTool?.status === ToolStatusEnum.Disabled ? '未启用' : '已启用'}
                  </>
                ) : (
                  <div style={errorStyle}>{isNotExistTip}</div>
                )}
              </div>
            </div>
          </div>
        </Panel>
        {isExist && (
          <Panel
            key="2"
            header={
              <span>
                <InteractionOutlined /> 输入输出
              </span>
            }
            forceRender
          >
            <JsonschemaTab operatorInfo={selectedTool} type="Inputs" onTableDataChange={onUpdateInputs} />
            <JsonschemaTab operatorInfo={selectedTool} type="Outputs" />
          </Panel>
        )}
      </Collapse>
    </div>
  );
}
