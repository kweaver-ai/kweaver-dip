import { type FC, useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isEmpty } from 'lodash';
import classNames from 'classnames';
import ReactJson from 'react-json-view';
import copy from 'clipboard-copy';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { Button, Splitter, message, Table, Input, Checkbox, InputNumber, Spin, Empty } from 'antd';
import { CloseOutlined, CopyOutlined } from '@ant-design/icons';
import PlayIcon from '@/assets/icons/play.svg';
import { useMicroWidgetProps } from '@/hooks';
import { parseParamDefaultValue, getParamType } from '@/utils/operator';
import { validateJson } from '@/utils/validators';
import { ParamTypeEnum } from '@/utils/operator/types';
import { debugMcp, debugTool, operatorDebug } from '@/apis/agent-operator-integration';
import { OperatorTypeEnum, StreamModeType } from '@/components/OperatorList/types';
import { JSONEditor } from '@/components/CodeEditor';
import styles from './DebugPanel.module.less';

const { TextArea } = Input;

interface TestCodeProps {
  debugSettings: any;
  selectedTool: any;
  type: OperatorTypeEnum;
  parsedInputs: any[];
  showInBodyHeader: boolean; // 是否显示"body参数"header
  onClose: () => void;
}

const DebugPanel: FC<TestCodeProps> = ({
  debugSettings,
  selectedTool,
  type,
  parsedInputs,
  showInBodyHeader = true,
  onClose,
}) => {
  const microWidgetProps = useMicroWidgetProps();
  const [searchParams] = useSearchParams();
  const box_id = searchParams.get('box_id') || ''; // 从url中获取box_id

  const abortController: any = useRef(null); // 取消请求控制器
  const debugResultRef = useRef<any>(null); // 调试结果ref（用于流式输出过程中自动scroll到底部）
  const editorRef = useRef<any>(null); // 编辑器ref（用于获取编辑器高度）
  const scrollRef = useRef<any>(null); // 滚动元素ref(当鼠标悬浮在编辑器上空时，滚动无法触发父元素scroll，所以用scrollRef来滚动)

  // 将参数根据in 从parsedInputs中区分开
  const { pathParam, queryParam, headerParam, bodyParam } = useMemo(() => {
    if (!parsedInputs) {
      return { pathParam: [], queryParam: [], headerParam: [], bodyParam: [] };
    }

    return parsedInputs.reduce(
      (prev, cur) => {
        // 解析参数的默认值
        cur.value = parseParamDefaultValue(cur);
        if (cur.in && cur.in !== 'body') {
          if (Array.isArray(cur.value)) {
            cur.value = JSON.stringify(cur.value);
          } else if (typeof cur.value === 'object') {
            cur.value = JSON.stringify(cur.value, null, 4);
          }
        }

        if (cur.in === 'path') {
          prev.pathParam.push(cur);
        } else if (cur.in === 'query') {
          prev.queryParam.push(cur);
        } else if (cur.in === 'header') {
          prev.headerParam.push(cur);
        } else if (cur.in === 'body' || !cur.in) {
          prev.bodyParam.push(cur);
        } else {
          prev.otherParams.push(cur);
        }
        return prev;
      },
      { pathParam: [], queryParam: [], headerParam: [], bodyParam: [], otherParams: [] }
    );
  }, [parsedInputs]);
  const hasBodyParam = useMemo(() => bodyParam.length > 0, [bodyParam]); // 是否有body参数
  // 是否有输入参数
  const hasInputParam = useMemo(
    () => pathParam.length > 0 || queryParam.length > 0 || headerParam.length > 0 || bodyParam.length > 0,
    [pathParam, queryParam, headerParam, bodyParam]
  );

  const [loading, setLoading] = useState(false); // 是否请求发送中
  const [dataFormatJson, setDataFormatJson] = useState(true);
  const [debugResult, setDebugResult] = useState<any>(); // 调试结果
  const [errorParams, setErrorParams] = useState<Set<string>>(new Set()); // 错误参数
  const [resultPanelHeight, setResultPanelHeight] = useState<number | string>(48); // 结果面板高度
  const [paths, setPaths] = useState<any[]>(pathParam); // path参数，包含很多信息，用于UI展示
  const [querys, setQuerys] = useState<any[]>(queryParam);
  const [headers, setHeaders] = useState<any[]>(headerParam);
  const [body, setBody] = useState<any>(() => {
    const body = {};
    bodyParam.forEach((item: any) => {
      // @ts-ignore
      body[item.name] = item.value;
    });
    return JSON.stringify(body, null, 4);
  });
  const [streamEnded, setStreamEnded] = useState(true); // 流式请求是否已结束

  useEffect(() => {
    setDataFormatJson(!debugSettings?.stream);
  }, [debugSettings?.stream]);

  useEffect(() => {
    return () => {
      // 组件卸载时，取消请求
      abortController.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (debugSettings?.stream && debugResultRef.current) {
      // 流式传输，滚动到最底部
      debugResultRef.current.scrollTop = debugResultRef.current?.scrollHeight;
    }
  }, [debugResult]);

  useEffect(() => {
    if (hasBodyParam) {
      // 添加全局 wheel 事件监听(编辑器滚动不会触发父元素滚动，所以要这么处理)
      const handleWeel = e => {
        scrollRef.current.scrollTop += e.deltaY;
      };
      if (scrollRef.current) {
        scrollRef.current.addEventListener('wheel', handleWeel, { capture: true });
      }

      // 移除事件监听
      return () => {
        if (scrollRef.current) {
          scrollRef.current.removeEventListener('wheel', handleWeel, { capture: true });
        }
      };
    }
  }, [hasBodyParam]);

  // 更新输入参数的值
  const updateParamValue = (inType: string, key: string, value: any) => {
    switch (inType) {
      case 'path':
        setPaths(prev => prev.map(item => (item.key === key ? { ...item, value } : item)));
        break;
      case 'query':
        setQuerys(prev => prev.map(item => (item.key === key ? { ...item, value } : item)));
        break;
      case 'header':
        setHeaders(prev => prev.map(item => (item.key === key ? { ...item, value } : item)));
        break;
      case 'body':
        setBody(value);
        break;
      default:
        break;
    }

    setErrorParams(prev => {
      const newErrorParams = new Set(prev);
      newErrorParams.delete(key);
      return newErrorParams;
    });
  };

  // 校验输入参数的必填项以及json的合法性
  const validateInputs = () => {
    const newErrorParams = new Set<string>();
    let isValid = true;
    [...paths, ...querys, ...headers].forEach(item => {
      if (item.required && [null, undefined, ''].includes(item.value)) {
        isValid = false;
        newErrorParams.add(item.key);
      }

      if (item.value?.trim?.() && [ParamTypeEnum.Object, ParamTypeEnum.Array].includes(getParamType(item))) {
        if (!validateJson(item.value, true)) {
          isValid = false;
          newErrorParams.add(item.key);
        }
      }
    });

    if (hasBodyParam) {
      if (!validateJson(body)) {
        isValid = false;
        newErrorParams.add('body');
      }
    }

    setErrorParams(newErrorParams);

    if (!isValid) {
      message.info('请检查输入参数');
      return false;
    }

    return true;
  };

  const normalModeRun = async (requestBody: any) => {
    setLoading(true);
    setDebugResult(null);
    let mockResult: any = {};
    try {
      if (type === OperatorTypeEnum.MCP) {
        mockResult = await debugMcp(selectedTool?.mcp_id, selectedTool?.name, requestBody);
      } else if (type === OperatorTypeEnum.ToolBox) {
        mockResult = await debugTool(box_id, selectedTool?.tool_id, {
          ...requestBody,
          timeout: debugSettings.timeout,
        });
      } else {
        const { operator_id, version } = selectedTool;
        mockResult = await operatorDebug({ operator_id, version, ...requestBody });
      }

      setDebugResult(mockResult);
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    } finally {
      setLoading(false);
    }
  };

  // 解析SSE 流式传输
  const sseDebugRun = async (requestBody: any) => {
    setLoading(true);
    setDebugResult(null);
    setStreamEnded(false);

    const url = `/api/agent-operator-integration/v1/tool-box/${box_id}/tool/${selectedTool?.tool_id}/debug?stream=true&mode=sse`;
    const eventSource: any = await fetchEventSource(url, {
      method: 'post',
      headers: {
        Authorization: `Bearer ${microWidgetProps?.token?.getToken?.access_token}`,
      },
      body: JSON.stringify({
        ...requestBody,
        timeout: debugSettings.timeout,
      }),
      signal: abortController.current?.signal,
      openWhenHidden: true,
      onmessage(ev) {
        setLoading(false);
        const message = ev.data.trim();
        if (message && message !== '[DONE]') {
          const parsedData = JSON.parse(message);
          setDebugResult((prev: any) => [...(prev || []), parsedData]);
        }
      },
      onclose() {
        setLoading(false);
        setStreamEnded(true);
        abortController.current?.abort();
      },
      onerror(e) {
        setLoading(false);
        setStreamEnded(true);
        eventSource?.close();
        abortController.current?.abort();
        message.error('流式请求发生错误');
        throw new Error('Stop retrying');
      },
    });
  };

  // 解析HTTP Streaming（HTTP 流式传输）
  const httpDebugRun = async (requestBody: any) => {
    setLoading(true);
    setDebugResult(null);
    setStreamEnded(false);

    const response = await fetch(
      `/api/agent-operator-integration/v1/tool-box/${box_id}/tool/${selectedTool?.tool_id}/debug?stream=true&mode=http`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${microWidgetProps?.token?.getToken?.access_token}` },
        body: JSON.stringify({
          ...requestBody,
          timeout: debugSettings.timeout,
        }),
      }
    );
    const contentType = response.headers.get('Content-Type');

    if (contentType === 'application/json') {
      setLoading(false);
      setStreamEnded(true);
      setDataFormatJson(true);
      const result = await response.json();
      setDebugResult(result);
      return;
    }
    if (contentType === 'text/html') {
      setLoading(false);
      setStreamEnded(true);
      setDataFormatJson(true);
      const result = await response.text();
      setDebugResult({ body: result });
      return;
    }

    if (!response.body) {
      console.error('No readable stream found.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // 自定义递归函数 processText
    const processText = async ({ done, value }: any) => {
      if (done) {
        setLoading(false);
        setStreamEnded(true);
        return;
      }

      // 解码数据块
      const decodedChunk = decoder.decode(value, { stream: true });
      // 解析 JSON 数据
      try {
        setLoading(false);
        const dataMessages = decodedChunk.split(/(?=data: )/).filter(Boolean);
        dataMessages.forEach(message => {
          const jsonString = message.trim().replace(/^data: /, '');
          if (jsonString && jsonString !== '[DONE]') {
            // 确保非空
            const parsedData = JSON.parse(jsonString);
            setDebugResult((prev: any) => [...(prev || []), parsedData]);
          }
        });
      } catch (error) {
        console.error('Error parsing JSON:', error);
        message.error('接收数据格式错误');
      }
      // 递归读取下一个数据块
      const nextChunk = await reader.read();
      processText(nextChunk);
    };

    // 开始读取第一个数据块
    const firstChunk = await reader.read();
    processText(firstChunk);
  };

  // 处理运行按钮点击事件
  const handleRun = async () => {
    if (!validateInputs()) {
      return;
    }

    setResultPanelHeight('60%');

    const path = paths.reduce((acc, item) => ({ ...acc, [item.name]: item.value }), {});
    const header = headers.reduce((acc, item) => ({ ...acc, [item.name]: item.value }), {});
    const query = querys.reduce((acc, item) => ({ ...acc, [item.name]: item.value }), {});
    const requestBody =
      type === OperatorTypeEnum.MCP
        ? isEmpty(body)
          ? {}
          : JSON.parse(body)
        : {
            ...(isEmpty(path) ? {} : { path }),
            ...(isEmpty(header) ? {} : { header }),
            ...(isEmpty(query) ? {} : { query }),
            ...(isEmpty(body) ? {} : { body: JSON.parse(body) }),
          };

    if (debugSettings.stream && debugSettings.mode === StreamModeType.HTTP) {
      httpDebugRun(requestBody);
    } else if (debugSettings.stream && debugSettings.mode === StreamModeType.SSE) {
      sseDebugRun(requestBody);
    } else {
      normalModeRun(requestBody);
    }
  };

  // 计算并设置编辑器高度的核心函数
  function updateEditorHeight() {
    const model = editorRef.current.getModel();
    if (!model) return;

    // 获取内容行数
    const lineCount = model.getLineCount();
    // 获取每行的高度（默认~19px，可根据字体调整）
    const lineHeight = 19;
    // 计算基础高度 + 边距（可根据需要调整）
    const padding = 20; // 上下内边距
    const newHeight = lineCount * lineHeight + padding;

    // 设置最小高度，避免编辑器高度过小
    const minHeight = 40;
    const finalHeight = Math.max(newHeight, minHeight);

    // 更新编辑器容器高度
    editorRef.current.getDomNode().style.height = `${finalHeight}px`;
    // 触发编辑器布局更新
    editorRef.current.layout();
  }

  const handleCopy = async () => {
    try {
      let copyValue = debugResult;
      if (Array.isArray(debugResult)) {
        // 加两个空行，分隔不同的 JSON 数据
        copyValue = debugResult?.map((chunk: any) => `data: ${JSON.stringify(chunk, null, 2)}`).join('\n\n');
      } else if (typeof debugResult === 'object') {
        copyValue = JSON.stringify(debugResult, null, 2);
      }

      await copy(copyValue);
      message.success('复制成功！');
    } catch {
      message.info('复制失败');
    }
  };

  return (
    <div
      className={classNames('dip-h-100 dip-flex-column dip-overflow-hidden', styles['debug-panel'])}
      style={{ backgroundColor: 'rgb(247, 247, 250)' }}
    >
      <div
        style={{ height: '56px', borderBottom: 'solid 1px rgb(229, 230, 235)' }}
        className="dip-flex-space-between dip-pl-20 dip-pr-20 dip-flex-shrink-0"
      >
        <div className="dip-font-16 dip-c-bold dip-user-select-none">调试</div>
        <CloseOutlined onClick={onClose} />
      </div>

      <Splitter
        layout="vertical"
        style={{ height: 'calc(100% - 56px)' }}
        onResize={sizes => setResultPanelHeight(sizes[1])}
      >
        <Splitter.Panel min={48} style={{ overflow: 'hidden' }}>
          <div
            style={{ height: '48px', lineHeight: '48px' }}
            className="dip-c-bold dip-flex-space-between dip-user-select-none dip-pl-20"
          >
            输入
          </div>
          <div
            className="dip-pl-20 dip-pr-20 dip-flex-column"
            style={{ minHeight: hasInputParam ? '78px' : 'unset', overflowY: 'auto', maxHeight: 'calc(100% - 128px)' }}
            ref={scrollRef}
          >
            {[
              {
                label: 'path参数',
                params: paths,
              },
              {
                label: 'query参数',
                params: querys,
              },
              {
                label: 'header参数',
                params: headers,
              },
            ]
              .filter(item => item.params?.length > 0)
              .map(({ label, params }) => (
                <div className="dip-pl-20" key={label}>
                  <div className="dip-mt-10 dip-mb-10 dip-c-bold" style={{ marginLeft: '-10px' }}>
                    {label}：
                  </div>
                  <Table
                    showHeader={false}
                    className={styles['table']}
                    columns={[
                      {
                        title: '',
                        dataIndex: 'name',
                        key: 'name',
                        ellipsis: true,
                        width: '20%',
                        render: (name: string, record: any) => (
                          <div className={classNames(record.required ? 'dip-required' : '', 'dip-ellipsis')}>
                            {name}
                          </div>
                        ),
                      },
                      {
                        title: '',
                        dataIndex: 'value',
                        key: 'value',
                        render: (value: any, record: any) => {
                          switch (getParamType(record)) {
                            case ParamTypeEnum.String:
                              return (
                                <Input
                                  value={value}
                                  status={errorParams.has(record.key) ? 'error' : ''}
                                  onChange={val => updateParamValue(record.in, record.key, val.target.value)}
                                />
                              );

                            case ParamTypeEnum.Boolean:
                              return (
                                <Checkbox
                                  checked={value}
                                  onChange={val => updateParamValue(record.in, record.key, val.target.checked)}
                                />
                              );

                            case ParamTypeEnum.Integer:
                            case ParamTypeEnum.Number:
                              return (
                                <InputNumber
                                  value={value}
                                  status={errorParams.has(record.key) ? 'error' : ''}
                                  onChange={val => updateParamValue(record.in, record.key, val)}
                                />
                              );

                            case ParamTypeEnum.Object:
                              return (
                                <TextArea
                                  value={value}
                                  status={errorParams.has(record.key) ? 'error' : ''}
                                  rows={4}
                                  onChange={val => updateParamValue(record.in, record.key, val.target.value)}
                                />
                              );

                            case ParamTypeEnum.Array:
                              return (
                                <TextArea
                                  value={value}
                                  status={errorParams.has(record.key) ? 'error' : ''}
                                  rows={4}
                                  onChange={val => updateParamValue(record.in, record.key, val.target.value)}
                                />
                              );

                            default:
                              return value;
                          }
                        },
                      },
                    ]}
                    dataSource={params}
                    pagination={false}
                  />
                </div>
              ))}
            {hasBodyParam && (
              <div className={showInBodyHeader ? 'dip-pl-20' : ''}>
                {showInBodyHeader && (
                  <div className="dip-c-bold dip-mt-10 dip-mb-10" style={{ marginLeft: '-10px' }}>
                    body参数：
                  </div>
                )}
                <JSONEditor
                  className={classNames(styles['input-editor'], {
                    [styles['body-error']]: errorParams.has('body'),
                  })}
                  value={body}
                  onChange={val => {
                    updateParamValue('body', 'body', val);
                    updateEditorHeight();
                  }}
                  options={{
                    lineNumbers: 'off',
                    lineDecorationsWidth: 0, // 设置装饰宽度为 0
                    lineNumbersMinChars: 0, // 设置最小字符数为 0
                  }}
                  onMount={editor => {
                    editorRef.current = editor;
                    updateEditorHeight();
                  }}
                />
              </div>
            )}
          </div>

          <Button
            type="primary"
            icon={<PlayIcon />}
            className="dip-mt-20 dip-mb-24 dip-ml-20 dip-w-74 dip-flex-shrink-0"
            loading={loading}
            onClick={handleRun}
          >
            运行
          </Button>
        </Splitter.Panel>

        <Splitter.Panel min={48} size={resultPanelHeight} style={{ overflow: 'hidden' }}>
          <div
            style={{ height: '48px', lineHeight: '48px' }}
            className="dip-c-bold dip-flex-space-between dip-user-select-none dip-pl-20"
          >
            输出
          </div>
          <div className="dip-pl-20 dip-pr-20" style={{ minHeight: '150px', height: 'calc(100% - 68px)' }}>
            {debugResult ? (
              dataFormatJson ? (
                <>
                  <ReactJson
                    src={debugResult}
                    theme="rjv-default"
                    displayDataTypes={false}
                    displayObjectSize={false}
                    enableClipboard={false}
                    name={false}
                    collapsed={false}
                    style={{
                      backgroundColor: 'rgb(240, 240, 245)',
                      padding: '16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      border: 'solid 1px rgb(230, 229, 230)',
                      height: 'calc(100% - 48px)',
                      overflowY: 'auto',
                    }}
                  />
                  <Button type="primary" icon={<CopyOutlined />} className="dip-mt-20" onClick={handleCopy}>
                    复制
                  </Button>
                </>
              ) : (
                <>
                  <div
                    className="debug-result-stream dip-overflowY-auto"
                    style={{ height: 'calc(100% - 48px)' }}
                    ref={debugResultRef}
                  >
                    {debugResult?.map((chunk: any, index: number) => (
                      <div key={index} className="debug-result-stream-data">
                        data: {JSON.stringify(chunk, null, 2)}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="primary"
                    icon={<CopyOutlined />}
                    disabled={!streamEnded}
                    className="dip-mt-20"
                    onClick={handleCopy}
                  >
                    复制
                  </Button>
                </>
              )
            ) : loading ? (
              <div className="dip-w-100 dip-h-100 dip-flex-center">
                <Spin />
              </div>
            ) : (
              <Empty className="dip-flex-column-center dip-h-100" description="请点击运行按钮发送请求" />
            )}
          </div>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
};

export default DebugPanel;
