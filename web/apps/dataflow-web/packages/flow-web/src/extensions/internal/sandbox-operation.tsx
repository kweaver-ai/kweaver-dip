import { forwardRef, useImperativeHandle, useRef } from "react";
import {
    ExecutorActionConfigProps,
    Validatable,
} from "../../components/extension";
import { Form, Select } from "antd";
import { FormItem } from "../../components/editor/form-item";
import {
    CustomInput,
    PythonEditor,
    ValidateParams,
    ParamType,
} from "../../components/internal-tool";

export interface InternalDefineParameters {
    target: string;
    value: any;
}

export const convertValueByType = (value: string, type?: string) => {
    if (typeof value === 'string' && /^\{\{__.*\}\}$/.test(value)) {
        return value;
    }
    switch (type) {
        case ParamType.Int:
            return parseInt(value);
        case ParamType.Array:
            try {
                return JSON.parse(value || "[]");
            } catch {
                return value;
            }
        case ParamType.Object:
            try {
                return JSON.parse(value || "{}");
            } catch {
                return value;
            }
        case ParamType.String:
        default:
            return value;
    }
};

export const SandboxOperation = forwardRef<
    Validatable,
    ExecutorActionConfigProps<InternalDefineParameters>
>(
    (
        {
            t,
            parameters = {
                input_params: [],
                output_params: [],
            },
            onChange,
        }: ExecutorActionConfigProps,
        ref,
    ) => {
        const [form] = Form.useForm();
        const inputParams = Form.useWatch("input_params", form);

        useImperativeHandle(ref, () => {
            return {
                async validate() {
                    let inputRes = true;
                    let outputRes = true;
                    if (
                        typeof inputParamsRef?.current?.validate === "function"
                    ) {
                        inputRes = await inputParamsRef.current?.validate();
                    }
                    if (!inputRes || !outputRes) {
                        return false;
                    }

                    return form.validateFields().then(
                        () => true,
                        () => false,
                    );
                },
            };
        });

        const inputParamsRef = useRef<ValidateParams>(null);

        return (
            <Form
                form={form}
                layout="vertical"
                initialValues={parameters}
                onFieldsChange={() => {
                    const inputParams = form.getFieldValue("input_params") || [];
                    const eventObj:any = {};
                    inputParams.forEach((param:any) => {
                        if (param.key) {
                            eventObj[param.key] = convertValueByType(param.value, param.type);
                        }
                    });
                    onChange({
                        ...form.getFieldsValue(),
                        event: eventObj,
                    });
                }}
            >
                <FormItem
                    label={t("language")}
                    name="language"
                    initialValue="python"
                    rules={[
                        {
                            required: true,
                            message: t("emptyMessage"),
                        },
                    ]}
                >
                    <Select
                        placeholder={t("select.placeholder")}
                        disabled
                        options={[{ label: "Python", value: "python" }]}
                    />
                </FormItem>
                <FormItem label={t("py3.input")} name="input_params">
                    <CustomInput
                        key="input_params"
                        ref={inputParamsRef}
                        t={t}
                        type="input"
                    />
                </FormItem>
                <FormItem
                    required
                    label={t("py3.code")}
                    name="code"
                    rules={[
                        {
                            required: true,
                            message: t("emptyMessage"),
                        },
                    ]}
                >
                    <PythonEditor
                        t={t}
                        inputParams={inputParams}
                        codeTemplate={"def handler(event):\n      return {}"}
                        pythonType={"sandbox"}
                    />
                </FormItem>
            </Form>
        );
    },
);
