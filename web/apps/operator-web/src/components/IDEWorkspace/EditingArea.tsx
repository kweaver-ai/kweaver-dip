import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Radio, Button, message, Input, Modal, Segmented } from 'antd';
import classNames from 'classnames';
import { type EventSourceMessage } from '@microsoft/fetch-event-source';
import AIGenIcon from '@/assets/icons/ai-gen.svg';
import CodeIcon from '@/assets/icons/code.svg';
import MetadataIcon from '@/assets/icons/metadata.svg';
import { postAIGenCode } from '@/apis/agent-operator-integration';
import { AIGenTypeEnum } from '@/apis/agent-operator-integration/type';
import { streamingOutHttp } from '@/utils/http';
import { PythonEditor } from '@/components/CodeEditor';
import { OperatorTypeEnum } from '@/components/OperatorList/types';
import { useMicroWidgetProps } from '@/hooks';
import Metadata from './Metadata';
import { filterInvalidParams, addParamId } from './utils';
import { type ToolDetail } from './types';
import styles from './EditingArea.module.less';

enum TabEnum {
  Code = 'code',
  Metadata = 'metadata',
}

interface EditingAreaProps {
  operatorType: OperatorTypeEnum.Tool | OperatorTypeEnum.Operator; // 算子类型：工具 or 算子
  value: ToolDetail;
  onChange: (value: Partial<ToolDetail>) => void;
  depPanelVisible: boolean;
}

const EditingArea = forwardRef(({ operatorType, value, onChange, depPanelVisible }: EditingAreaProps, ref) => {
  const microWidgetProps = useMicroWidgetProps();
  const metadataRef = useRef<{ validate: () => Promise<boolean>; validateInputsOnly: () => boolean }>(null);
  const hideAILoadingMessageRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null); // 用于取消流式请求

  const [activeTab, setActiveTab] = useState<TabEnum>(TabEnum.Code);
  const [aiCodeGenerating, setAICodeGenerating] = useState<boolean>(false); // AI生成代码进行中
  const [showAIConfirm, setShowAIConfirm] = useState<boolean>(false); // 展示ai生成代码的确认弹窗
  const [query, setQuery] = useState<string>(''); // AI生成代码的描述
  const [aiMetadataGenerating, setAIMetadataGenerating] = useState<boolean>(false); // AI生成元数据进行中

  useEffect(() => {
    return () => {
      hideAILoadingMessageRef.current?.();
      abortControllerRef.current?.abort();
    };
  }, []);

  const validate = async () => {
    // 当元数据校验不通过，需要切换到元数据的tab
    const validateResult = await metadataRef.current?.validate?.();

    if (!validateResult) {
      setActiveTab(TabEnum.Metadata);
    }

    return validateResult;
  };
  // 仅校验输入参数
  const validateInputsOnly = () => {
    const isValid = metadataRef.current?.validateInputsOnly?.();
    if (!isValid) {
      setActiveTab(TabEnum.Metadata);
    }
    return isValid;
  };

  useImperativeHandle(ref, () => ({
    validate,
    validateInputsOnly,
  }));

  // AI生成代码
  const handleAIGenCode = async (query: string) => {
    hideAILoadingMessageRef.current = message.loading({
      content: 'AI 生成代码中...',
    });
    setAICodeGenerating(true);
    let hasError = false;
    let streamCode = '';

    streamingOutHttp({
      url: `/api/agent-operator-integration/v1/ai_generate/function/${AIGenTypeEnum.PythonFunctionGenerator}`,
      method: 'POST',
      body: {
        query,
        stream: true,
      },
      onOpen: (controller, response) => {
        abortControllerRef.current = controller;

        if (!response.ok) {
          hasError = true;
        }
      },
      onMessage: (event: EventSourceMessage) => {
        if (event.data) {
          // 跳过特殊标记
          if (event.data === '[DONE]') return;

          const parsedData = JSON.parse(event.data);
          const { choices } = parsedData;

          if (event.event === 'error' || !choices) {
            // 当 event.event 为 error 或 choices为空时，抛出错误
            throw new Error(event.data, { cause: parsedData });
          }

          const addedContent = choices?.[0]?.delta?.content || '';
          streamCode = streamCode + addedContent;
          onChange({ code: streamCode });
        }
      },
      onError: (error: any) => {
        hasError = true;
        hideAILoadingMessageRef.current?.();
        setAICodeGenerating(false);
        message.error(error?.description || error?.cause?.description || '未知错误');
      },
      onClose: () => {
        // 设置AI生成代码状态为false
        setAICodeGenerating(false);
        // 清理引用
        abortControllerRef.current = null;

        if (streamCode) {
          // 最后结束时，再设置代码
          setTimeout(() => {
            onChange({ code: streamCode });
          }, 0);
        }

        if (!hasError) {
          hideAILoadingMessageRef.current?.();
          message.success('AI 生成成功');
        }
      },
    });
  };

  // AI生成元数据
  const handleAIGenMetadata = async () => {
    if (!value.code) {
      message.info('请先填写代码');
      return;
    }

    hideAILoadingMessageRef.current = message.loading({
      content: 'AI 生成元数据中...',
    });
    setAIMetadataGenerating(true);

    try {
      const {
        content: { name, description, use_rule, inputs, outputs },
      } = await postAIGenCode({
        type: AIGenTypeEnum.MetadataParamGenerator,
        code: value.code,
        inputs: filterInvalidParams(value.inputs),
        outputs: filterInvalidParams(value.outputs),
      });

      onChange({
        name,
        description,
        use_rule,
        inputs: addParamId(inputs),
        outputs: addParamId(outputs),
      });
      message.success('AI 生成成功');
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    } finally {
      hideAILoadingMessageRef.current?.();
      setAIMetadataGenerating(false);
    }
  };

  return (
    <div className="dip-h-100 dip-flex-column dip-gap-16 dip-overflow-hidden">
      <div
        className="dip-mt-12 dip-pr-32 dip-flex-space-between"
        style={depPanelVisible ? { paddingLeft: 32 } : { paddingLeft: 64 }}
      >
        <Segmented
          options={[
            {
              value: TabEnum.Code,
              label: (
                <div className="dip-flex-align-center">
                  <CodeIcon className="dip-font-16 dip-mr-8" />
                  代码
                </div>
              ),
            },
            {
              value: TabEnum.Metadata,
              label: (
                <div className="dip-flex-align-center">
                  <MetadataIcon className="dip-font-16 dip-mr-8" />
                  元数据
                </div>
              ),
            },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
        {activeTab === TabEnum.Code ? (
          <Button
            icon={<AIGenIcon className="dip-font-16" />}
            type="text"
            disabled={aiMetadataGenerating} // 当ai生成元数据进行中时，禁用ai生成代码
            loading={aiCodeGenerating}
            onClick={() => setShowAIConfirm(true)}
            className={styles['ai-btn']}
          >
            <span className={styles['text']}>AI生成代码</span>
          </Button>
        ) : (
          <Button
            icon={<AIGenIcon className="dip-font-16" />}
            type="text"
            disabled={aiCodeGenerating} // 当ai生成代码进行中时，禁用ai生成元数据
            loading={aiMetadataGenerating}
            onClick={handleAIGenMetadata}
            className={styles['ai-btn']}
          >
            <span className={styles['text']}>AI生成元数据</span>
          </Button>
        )}
      </div>
      <div className="dip-flex-1 dip-overflowY-auto">
        {activeTab === TabEnum.Code && (
          <PythonEditor
            options={{
              readOnly: aiCodeGenerating, // 当ai生成代码进行中时，禁用编辑
            }}
            value={value.code}
            onChange={code => onChange({ code })}
          />
        )}

        <Metadata
          ref={metadataRef}
          disabled={aiMetadataGenerating}
          style={activeTab === TabEnum.Metadata ? {} : { display: 'none' }}
          operatorType={operatorType}
          value={value as any}
          onChange={onChange}
        />
      </div>

      {showAIConfirm && (
        <Modal
          open
          centered
          title="使用 AI 生成代码"
          width={448}
          getContainer={() => microWidgetProps?.container}
          onCancel={() => setShowAIConfirm(false)}
          footer={() => (
            <Button
              icon={<AIGenIcon className="dip-font-16" />}
              type="text"
              disabled={!query}
              onClick={() => {
                handleAIGenCode(query);
                setShowAIConfirm(false);
              }}
              className={classNames(styles['ai-btn'], styles['ai-btn-in-drawer'])}
              style={!query ? { opacity: 0.35 } : {}}
            >
              <span className={styles['text']}>AI生成代码</span>
            </Button>
          )}
        >
          <Input.TextArea
            className="dip-mt-8 dip-mb-8"
            autoSize={{ minRows: 5, maxRows: 5 }}
            placeholder="描述工具的用途，如：创建一个自动获取网络资讯的工具，能够根据用户输入的关键词，实时抓取相关新闻摘要，并整理为简洁的列表形式输出"
            onChange={e => {
              setQuery(e.target.value);
            }}
          />
        </Modal>
      )}
    </div>
  );
});

export default EditingArea;
