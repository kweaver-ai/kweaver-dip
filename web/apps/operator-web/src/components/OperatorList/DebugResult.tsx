import { useState } from 'react';
import { Button, Drawer } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { OperatorTypeEnum } from '@/components/OperatorList/types';
import ModelSettingsPopover from './settingsPopover';
import DebugPanel from './DebugPanel';
import './style.less';

export default function DebugResult({ selectedTool, type, parsedInputs }: any) {
  const [debugSettings, setDebugSettings] = useState<any>({});
  const [debugDrawerVisible, setDebugDrawerVisible] = useState(false); // 调试抽屉是否可见

  const handleModelSettingsUpdate = (settings: any) => {
    setDebugSettings(settings);
  };

  return (
    Boolean(selectedTool?.name) && (
      <div className="dip-pl-16 dip-mt-16 dip-mb-16">
        <Button type="primary" className="dip-w-74" onClick={() => setDebugDrawerVisible(true)}>
          调试
        </Button>
        {type === OperatorTypeEnum.ToolBox && (
          <ModelSettingsPopover onSettingsChange={settings => handleModelSettingsUpdate(settings)}>
            <SettingOutlined className="dip-c-subtext" style={{ fontSize: '16px', margin: '0 0 0 12px' }} />
          </ModelSettingsPopover>
        )}
        {debugDrawerVisible && (
          <Drawer
            title="调试"
            open={true}
            onClose={() => setDebugDrawerVisible(false)}
            width={800}
            styles={{
              header: {
                display: 'none',
              },
              body: {
                padding: '0',
              },
              footer: {
                display: 'none',
              },
            }}
            destroyOnHidden={true}
          >
            <DebugPanel
              selectedTool={selectedTool}
              type={type}
              showInBodyHeader={type !== OperatorTypeEnum.MCP}
              onClose={() => setDebugDrawerVisible(false)}
              parsedInputs={parsedInputs}
              debugSettings={debugSettings}
            />
          </Drawer>
        )}
      </div>
    )
  );
}
