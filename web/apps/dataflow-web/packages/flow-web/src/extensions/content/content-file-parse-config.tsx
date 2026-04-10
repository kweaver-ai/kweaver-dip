import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { Form, Input, Select, Radio, Switch, Tooltip } from "antd";
import { DefaultOptionType } from "antd/lib/select";
import useSWR from "swr";
import { API, AsFileSelect } from "@applet/common";
import {
  ExecutorActionConfigProps,
  Validatable,
} from "../../components/extension";
import { FormItem } from "../../components/editor/form-item";
import styles from "./content-file-parse-config.module.less";
import EditorWithMentions from "../ai/editor-with-mentions";
import ModelSettingsPopover, { ModelSettings } from "../ai/settings-popover";
import { SettingOutlined } from "@ant-design/icons";
import { useExtensionTranslateFn } from "../../components/extension-provider/extension-context";

enum SourceTypeEnum {
  Docid = "docid",
  Url = "url",
}

export enum SliceVectorEnum {
  None = "none",
  Slice = "slice", // 仅分片
  SliceVector = "slice_vector", // 分片+向量化
}

export interface ContentFileParseParameters {
  source_type: SourceTypeEnum; // 必填，输入类型
  docid?: string; // 文件 gns ，当 source_type 为 file 时必填
  version?: string; // 文件版本，选填，默认最新版本
  url?: string; // 资源下载链接，当source_type 为url 时必填
  filename?: string; // 文件名，当source_type 为url时必填
  slice_vector: SliceVectorEnum;
  model?: string; // 模型, slice_vector 为 slice_vector 时 必填
  multimodal_prompt_template?: string;
  multimodal_enabled?: boolean;
}

export const ContentFileParseConfig = forwardRef<
  Validatable,
  ExecutorActionConfigProps<ContentFileParseParameters>
>(({ t, parameters = {}, onChange }, ref) => {
  const { slice_vector } = parameters;
  const [form] = Form.useForm<ContentFileParseParameters>();
  const extensionTranslateFn = useExtensionTranslateFn();
  const aiTranslateFn = (key: string, defaultValue?: any, values?: any) => {
    return extensionTranslateFn("ai", key, defaultValue, values);
  };
  const initialSettings = {
    temperature: 1,
    top_p: 1,
    max_tokens: 1000,
    top_k: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  };
  const [settings, setSettings] = useState<ModelSettings>({
    ...initialSettings,
    ...parameters,
  });

  const { data: smallModels } = useSWR<DefaultOptionType[]>(
    "/api/mf-model-manager/v1/small-model/list?page=1&size=1000",
    async (url) => {
      try {
        const { data } = await API.axios.get(url);
        if (Array.isArray(data?.data)) {
          return data.data.map((item: any) => ({
            label: item.model_name,
            value: item.model_name,
            model_type: item.model_type,
          }));
        }
      } catch (e) {}

      return [];
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    },
  );

  // 过滤出 embedding 模型
  const embeddingModelOptions = useMemo(
    () =>
      smallModels?.filter((item: any) => item.model_type === "embedding") || [],
    [smallModels],
  );

  const sliceVectorOptions = useMemo(() => {
    const renderLabel = ({
      label,
      description,
    }: {
      label: string;
      description: string;
    }) => (
      <div style={{ marginBottom: 8 }} className={styles["slice-config-item"]}>
        <span className={styles["label"]}>{label}</span>
        <Tooltip title={description}>
          <div className={styles["description"]}>{description}</div>
        </Tooltip>
      </div>
    );
    return [
      {
        value: SliceVectorEnum.None,
        label: renderLabel({
          label: t("noSliceVector", "不分片且不向量化"),
          description: t(
            "noSliceVectorDescription",
            "仅输出文件解析后的结构化信息",
          ),
        }),
      },
      {
        value: SliceVectorEnum.Slice,
        label: renderLabel({
          label: t("slice", "仅切片不向量化"),
          description: t(
            "sliceDescription",
            "同时输出文件解析后的结构化信息和切片结果",
          ),
        }),
      },
      {
        value: SliceVectorEnum.SliceVector,
        label: renderLabel({
          label: t("sliceAndVector", "切片且向量化"),
          description: t(
            "sliceAndVectorDescription",
            "同时输出文件解析后的结构化信息和切片向量化的结果",
          ),
        }),
      },
    ];
  }, [t]);

  useImperativeHandle(ref, () => {
    return {
      validate() {
        return form.validateFields().then(
          () => true,
          () => false,
        );
      },
    };
  });

  useLayoutEffect(() => {
    form.setFieldsValue({
      source_type: SourceTypeEnum.Docid,
      slice_vector: SliceVectorEnum.None,
      ...parameters,
    });
  }, [form, parameters]);

  const textAreaContent = (data: any, itemName: string) => {
    form.setFieldValue(itemName, data);
  };

  const { data: modelOptions } = useSWR<DefaultOptionType[]>(
    "/api/mf-model-manager/v1/llm/list?page=1&size=1000&model_type=vu",
    async (url) => {
      try {
        const { data } = await API.axios.get(url);
        if (Array.isArray(data?.data)) {
          return data.data.map((item: any) => ({
            label: item.model_name,
            value: item.model_name,
            model_type: item.model_type,
          }));
        }
      } catch (e) {}

      return [];
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    },
  );
  const handleModelSettingsUpdate = (settings: ModelSettings) => {
    setSettings(settings);
    onChange({ ...form.getFieldsValue(), ...settings });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={parameters}
      onFieldsChange={() =>
        onChange({
          ...form.getFieldsValue(),
          source_type: SourceTypeEnum.Docid,
        })
      }
    >
      <FormItem
        required
        label={t("extractFile", "文件")}
        name="docid"
        allowVariable
        type="asFile"
        rules={[
          {
            required: true,
            message: t("emptyMessage", "此项不能为空"),
          },
        ]}
      >
        <AsFileSelect
          readOnly
          title={t("fileSelectTitle")}
          multiple={false}
          omitUnavailableItem
          selectType={1}
          placeholder={t("selectVariablePlaceholder", "请选择变量")}
          selectButtonText={t("select")}
          supportExtensions={["pdf", "jpg", "jpeg", "png"]}
        />
      </FormItem>

      <FormItem
        required
        name="slice_vector"
        label={t("sliceVectorConfig", "解析配置")}
      >
        <Radio.Group
          options={sliceVectorOptions}
          className={styles["slice-config-radio-group"]}
        />
      </FormItem>

      {/* 当开启“分片+向量化”时才显示模型选择 */}
      {slice_vector === SliceVectorEnum.SliceVector && (
        <FormItem
          name="model"
          rules={[
            {
              required: true,
              message: t("emptyMessage"),
            },
          ]}
          type="string"
          style={{ paddingLeft: 24, marginTop: "-24px" }}
        >
          <Select
            options={embeddingModelOptions}
            placeholder={t("modelPlaceholder", "请选择")}
          />
        </FormItem>
      )}
      <FormItem
        label={t("sliceVectorConfigMore", "解析高级配置")}
        className={styles["slice_vector_config"]}
      >
        <FormItem
          name="multimodal_enabled"
          valuePropName="checked"
          className={styles["multimodal_enabled"]}
        >
          <Switch size="small" className={styles["switch"]} />
        </FormItem>
        <FormItem className={styles["multimodal_enabled_des"]}>
          {t("sliceVectorConfigMoreDesc")}
        </FormItem>
      </FormItem>
      {parameters?.multimodal_enabled && (
        <div className={styles["multimodal"]}>
          <FormItem noStyle>
            <FormItem
              label={t("multimodal", "多模态大模型")}
              name="multimodal_model_name"
              rules={[
                {
                  required: true,
                  message: t("emptyMessage"),
                },
              ]}
              style={{ width: "380px", display: "inline-block" }}
            >
              <Select
                options={modelOptions}
                placeholder={t("modelPlaceholder", "请选择")}
              />
            </FormItem>
            <ModelSettingsPopover
              t={aiTranslateFn}
              initialSettings={settings}
              onSettingsChange={(settings) =>
                handleModelSettingsUpdate(settings)
              }
            >
              <SettingOutlined
                className="dip-c-subtext"
                style={{
                  fontSize: "16px",
                  margin: "34px 0 0 12px",
                }}
              />
            </ModelSettingsPopover>
          </FormItem>
          <FormItem
            name="multimodal_prompt_template"
            label={t("promptWords", "提示词")}
          >
            <EditorWithMentions
              onChange={textAreaContent}
              parameters={
                parameters?.multimodal_prompt_template ||
                t(
                  "imageDescriptionPrompt",
                  "请详细描述这张图片的内容,包括: \n 1. 主要对象和场景 \n 2. 颜色和布局 \n 3. 图片类型(照片、图表、示意图等) \n 4. 其他重要细节 \n \n 请用简洁、准确的语言描述,不超过200字。",
                )
              }
              itemName="multimodal_prompt_template"
            />
          </FormItem>
        </div>
      )}
    </Form>
  );
});
