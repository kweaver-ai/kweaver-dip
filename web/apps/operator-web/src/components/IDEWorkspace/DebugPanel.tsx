import { type FC, useState } from 'react';
import { Button, Splitter, Empty, Spin, message, Tooltip } from 'antd';
import { CloseOutlined, CopyOutlined } from '@ant-design/icons';
import ReactJsonView from 'react-json-view';
import copy from 'clipboard-copy';
import PlayIcon from '@/assets/icons/play.svg';
import AutoGenIcon from '@/assets/icons/auto-gen.svg';
import { postFunctionExecute } from '@/apis/agent-operator-integration';
import { type FunctionDependency } from '@/apis/agent-operator-integration/type';
import { useJsonValidator } from '@/hooks';
import { JSONEditor } from '@/components/CodeEditor';
import styles from './DebugPanel.module.less';
import { generateParamValues } from './utils';
import { type ParamItem } from './Metadata/types';

interface TestCodeProps {
  inputs: ParamItem[]; // 输入参数数组
  code: string; // 代码字符串
  dependencies: FunctionDependency[];
  dependenciesUrl: string;
  onClose: () => void;
  onUpdateStdoutLines: (stdout: string) => void; // 更新控制台输出结果
  validateInputs: () => boolean; // 校验输入参数的合法性
}

const DebugPanel: FC<TestCodeProps> = ({
  inputs,
  code,
  onClose,
  onUpdateStdoutLines,
  validateInputs,
  dependencies,
  dependenciesUrl,
}) => {
  const [input, setInput] = useState('{}'); // 输入框里的json字符串
  const [output, setResult] = useState<{ stderr: string; result: any }>({
    stderr: '',
    result: null,
  });
  const [loading, setLoading] = useState(false);
  const isValid = useJsonValidator(input);

  const handleRun = async () => {
    setLoading(true);

    try {
      const { stdout, stderr, result } = await postFunctionExecute({
        code,
        event: JSON.parse(input),
        dependencies: dependencies || [],
        dependencies_url: dependenciesUrl,
      });
      if (stderr) {
        setResult({
          stderr,
          result: null,
        });
      } else {
        setResult({
          stderr: '',
          result,
        });
      }
      if (stdout) {
        // 更新控制台输出结果
        onUpdateStdoutLines(stdout);
      }
    } catch (ex: any) {
      if (ex?.description) {
        message.error(ex.description);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await copy(output.stderr || JSON.stringify(output.result));
      message.success('复制成功！');
    } catch {
      message.info('复制失败');
    }
  };

  // 自动生成输入
  const autoGenInputs = () => {
    if (validateInputs()) {
      setInput(JSON.stringify(generateParamValues(inputs), null, 4));
    }
  };

  return (
    <div className="dip-h-100 dip-flex-column dip-overflow-hidden" style={{ backgroundColor: 'rgb(247, 247, 250)' }}>
      <div
        style={{ height: '56px', borderBottom: 'solid 1px rgb(229, 230, 235)' }}
        className="dip-flex-space-between dip-pl-20 dip-pr-20 dip-flex-shrink-0"
      >
        <div className="dip-font-16 dip-c-bold dip-user-select-none">调试</div>
        <CloseOutlined onClick={onClose} />
      </div>

      <Splitter layout="vertical" className="dip-flex-1">
        <Splitter.Panel min={48} style={{ overflow: 'hidden' }}>
          <div className="dip-pl-20 dip-pr-20 dip-h-100 dip-flex-column" style={{ minHeight: '172px' }}>
            <div
              style={{ height: '48px', lineHeight: '48px' }}
              className="dip-c-bold dip-flex-space-between dip-user-select-none"
            >
              输入
              <Tooltip title="自动生成">
                <AutoGenIcon className="dip-pointer" onClick={autoGenInputs} />
              </Tooltip>
            </div>
            <JSONEditor
              height="calc(100% - 124px)"
              className={styles['input-editor']}
              value={input}
              onChange={setInput}
              options={{
                lineNumbers: 'off',
                lineDecorationsWidth: 0, // 设置装饰宽度为 0
                lineNumbersMinChars: 0, // 设置最小字符数为 0
              }}
            />
            <Button
              type="primary"
              icon={<PlayIcon />}
              className="dip-mt-20 dip-mb-24 dip-w-74"
              loading={loading}
              disabled={!isValid}
              onClick={handleRun}
            >
              运行
            </Button>
          </div>
        </Splitter.Panel>

        <Splitter.Panel min={48} style={{ overflow: 'hidden' }}>
          <div className="dip-pl-20 dip-pr-20 dip-h-100" style={{ minHeight: '172px' }}>
            <div style={{ height: '48px', lineHeight: '48px' }} className="dip-c-bold dip-user-select-none">
              输出
            </div>

            {/**加载中 */}
            {loading && <Spin style={{ height: 'calc(100% - 48px)' }} className="dip-flex-center" />}

            {/** 内容为空 */}
            {!output.stderr && !output.result && !loading && (
              <Empty
                style={{ height: 'calc(100% - 48px)' }}
                className="dip-flex-column-center"
                description="请点击运行按钮发送请求"
              />
            )}

            {/**运行完成 */}
            {!loading && Boolean(output.result || output.stderr) && (
              <>
                {output.result ? (
                  <ReactJsonView
                    src={output.result}
                    theme="rjv-default"
                    displayDataTypes={false}
                    displayObjectSize={false}
                    enableClipboard={false}
                    name={false}
                    collapsed={false}
                    style={{
                      padding: '16px',
                      fontSize: '13px',
                      border: 'solid 1px rgb(230, 229, 230)',
                      height: 'calc(100% - 124px)',
                      backgroundColor: 'rgb(240, 240, 245)',
                      borderRadius: '6px',
                      overflow: 'auto',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      border: 'solid 1px rgb(230, 229, 230)',
                      background: 'rgb(240, 240, 245)',
                      height: 'calc(100% - 124px)',
                      overflow: 'auto',
                      color: 'rgb(255, 68, 30)',
                    }}
                    className="dip-pt-12 dip-pr-12 dip-pb-12 dip-pl-12 dip-border-radius-6"
                  >
                    {output.stderr}
                  </div>
                )}

                <Button type="primary" icon={<CopyOutlined />} className="dip-mt-20" onClick={handleCopy}>
                  复制
                </Button>
              </>
            )}
          </div>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
};

export default DebugPanel;
