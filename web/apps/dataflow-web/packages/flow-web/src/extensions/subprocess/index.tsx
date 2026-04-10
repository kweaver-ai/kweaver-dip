import { Extension } from "../../components/extension";
import zhCN from "./locales/zh-cn.json";
import zhTW from "./locales/zh-tw.json";
import enUS from "./locales/en-us.json";
import viVN from "./locales/vi-vn.json";
import SubprocessSvg from "./assets/subprocess.svg";
import WorkflowSvg from "./assets/workflow.svg";
import DataflowSvg from "./assets/dataflow.svg";
import { AutoflowExecutorConfig } from "./autoflow-executor-config";

const SubprocessExtension: Extension = {
  name: "subprocess",
  executors: [
    {
      name: "subprocessName",
      description: "subprocessDes",
      icon: SubprocessSvg,
      actions: [
        {
          name: "workflowName",
          description: "workflowDes",
          icon: WorkflowSvg,
          outputs(step: any) {
            if (Array.isArray(step.parameters?.fields)) {
              return [
                ...step.parameters.fields.map((field: any) => {
                    return {
                        key: `.outputs.${field.key}`,
                        name: field.key,
                        type: field.type,
                        isCustom: true,
                    };
                }),
              ];
            }
            return [
              {
                key: ".outputs",
                name: "outputs",
                type: "array",
              },
            ];
          },
          operator: "@subflow/call/workflow",
          components: {
            Config: AutoflowExecutorConfig('workflow'),
          },
        },
        {
          name: "dataflowName",
          description: "dataflowDes",
          icon: DataflowSvg,
          operator: "@subflow/call/dataflow",
          components: {
            Config: AutoflowExecutorConfig('dataflow'),
          },
        },
      ],
    },
  ],
  translations: {
    zhCN,
    zhTW,
    enUS,
    viVN,
  },
};

export default SubprocessExtension;
