import {
    Button,
    Form,
    Input,
    message,
    Radio,
    RadioChangeEvent,
    Upload,
} from "antd";
import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import { FormItem } from "../../../editor/form-item";
import { API, useTranslate } from "@applet/common";
import { DocLibItem, DocLibList } from "../../../as-file-select/doclib-list";
// @ts-ignore
import { apis } from "@aishu-tech/components/dist/dip-components.full.js";
import { DocLibListNew } from "../../../as-file-select/doclib-list-new";
import _ from "lodash";
import { UploadFileList } from "./upload-file-list";
import { DataSourceOperatorEnum, ParametersModeEnum } from "./helper";
import { useHandleErrReq } from "../../../../utils/hooks";
import fileIcon from "../../assets/file.svg";
import s3Icon from "../../assets/s3.svg";
import fileActiveIcon from "../../assets/file-active.svg";
import s3ActiveIcon from "../../assets/s3-active.svg";
import styles from "./index.module.less";
interface Parameters {
    docids?: string[];
    docs?: DocLibItem[];
    depth?: number;
    sources?: any;
}

interface SelectDocLibProps {
    parameters: Parameters;
    onChange: (value: any, operator?: string) => void;
    dagsId?: any;
    currentSourceOperator?: string;
}

const SelectFileLib = forwardRef(
    (
        {
            parameters,
            onChange,
            dagsId,
            currentSourceOperator,
        }: SelectDocLibProps,
        ref,
    ) => {
        const { docs: docLibs = [] } = parameters;
        const t = useTranslate();
        const [form] = Form.useForm();
        const handleErr = useHandleErrReq();
        const [sources, setSources] = useState<any>(parameters?.sources || []);
        const apiId = dagsId || crypto.randomUUID();
        const fileInputRef = useRef<HTMLInputElement>(null);

        useImperativeHandle(ref, () => {
            return {
                validate() {
                    if (
                        currentSourceOperator ===
                        DataSourceOperatorEnum.S3DataFile
                    ) {
                        if (!sources.length) {
                            form?.validateFields();
                            return false;
                        }
                    } else {
                        if (!docLibs.length) {
                            form?.validateFields();
                            return false;
                        }
                    }

                    return true;
                },
            };
        });

        const docLibsArry = () => {
            const newDocLibs = _.map(docLibs, (item) => ({
                ...item,
                id: item?.docid || item?.id,
            }));
            return newDocLibs;
        };

        const selectFn = () => {
            apis.selectFn({
                title: "从文档中心选择文件",
                multiple: true,
                selectType: 2,
                onConfirm: (selections: any[]) => {
                    const newDocLibs = docLibsArry();
                    const docsArry = [...newDocLibs, ...selections];
                    const docs = _.uniqBy(docsArry, "id");
                    onChange({
                        depth: -1,
                        docs,
                        docids: docs.map(({ id }) => id),
                    });
                },
            });
        };

        const handleUploadClick = () => {
            fileInputRef.current?.click();
        };

        const customRequest = async (options: any) => {
            const { file, onSuccess, onError, onProgress } = options;

            const formData = new FormData();
            formData.append("file", file);

            try {
                const response = await API.axios.post(
                    `/api/automation/v1/data-flow/${apiId}/files/upload`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                        onUploadProgress: (progressEvent: any) => {
                            const percent = Math.round(
                                (progressEvent.loaded * 100) /
                                    progressEvent.total,
                            );
                            onProgress({ percent });
                        },
                    },
                );

                onSuccess(response.data);

                message.success(`${file.name} 上传成功`);
                const { key, name, size } = response.data;
                setSources((prevSources: any) => {
                    const files = [...prevSources, { key, name, size }];
                    const { operator, mode } = form.getFieldsValue();
                    onChange(
                        {
                            mode,
                            sources: files,
                        },
                        operator,
                    );
                    return files;
                });
                // getFiles();
            } catch (error: any) {
                onError(error);
                message.error(`${file.name} 上传失败: ${error.message}`);
            }
        };

        const props = {
            customRequest,
            multiple: true, // 允许多选
            // maxCount: 5, // 最多5个文件
            showUploadList: false,
            // accept: '.pdf,.doc', // 限制文件类型
            beforeUpload: (file: any) => {
                // 校验文件大小，不超过1G
                if (file.size > 1 * 1024 * 1024 * 1024) {
                    message.warning(`${file.name} ${t('err.fileSizeExceed.1g')}`);
                    return false;
                }
                return true;
            },
            onChange(info: any) {
                const { status, name } = info.file;
                if (status === "done") {
                    console.log("文件地址：", info.file);
                } else if (status === "error") {
                    console.error("上传错误：", info.file.error);
                }
            },
            defaultFileList: [],
        };

        const handleModeChange = ({ target: { value } }: RadioChangeEvent) => {
            onChange({}, value);
        };

        // const getFiles = async () => {
        //     try {
        //         const { data } = await API.axios.get(
        //             `/api/automation/v1/data-flow/${apiId}/files`,
        //         );
        //         const files = data?.files?.map(({ key, name, size }: any) => ({
        //             key,
        //             name,
        //             size,
        //         }));

        //         setSources(files || []);
        //         const { operator, mode } = form.getFieldsValue();
        //         onChange(
        //             {
        //                 mode,
        //                 sources: files,
        //             },
        //             operator,
        //         );
        //     } catch (error: any) {
        //         handleErr({ error: error?.response });
        //     }
        // };

        return (
            <div>
                <Form form={form} layout={"vertical"}>
                    <FormItem
                        name={"operator"}
                        label={t("datastudio.upload.source", "选择数据来源")}
                        initialValue={
                            currentSourceOperator ||
                            DataSourceOperatorEnum.AnyshareDataFile
                        }
                    >
                        <Radio.Group
                            onChange={handleModeChange}
                            style={{ marginBottom: 8 }}
                            className={styles["radio-group"]}
                        >
                            <Radio.Button
                                value={DataSourceOperatorEnum.AnyshareDataFile}
                            >
                                <div className={styles["radio-button"]}>
                                    <img
                                        className={styles["lib-icon"]}
                                        src={
                                            currentSourceOperator !==
                                            DataSourceOperatorEnum.S3DataFile
                                                ? fileActiveIcon
                                                : fileIcon
                                        }
                                        alt=""
                                    />
                                    <span>
                                        {t(
                                            "datastudio.upload.anyshareDataFile",
                                            "选择文档库已有文档",
                                        )}
                                    </span>
                                </div>
                            </Radio.Button>
                            <Radio.Button
                                value={DataSourceOperatorEnum.S3DataFile}
                            >
                                <div className={styles["radio-button"]}>
                                    <img
                                        className={styles["lib-icon"]}
                                        src={
                                            currentSourceOperator ===
                                            DataSourceOperatorEnum.S3DataFile
                                                ? s3ActiveIcon
                                                : s3Icon
                                        }
                                        alt=""
                                    />
                                    <span>
                                        {t(
                                            "datastudio.upload.s3DataFile",
                                            "上传本地文档至S3存储",
                                        )}
                                    </span>
                                </div>
                            </Radio.Button>
                        </Radio.Group>
                    </FormItem>
                    {currentSourceOperator ===
                    DataSourceOperatorEnum.S3DataFile ? (
                        <>
                            <FormItem
                                name={"sources"}
                                required
                                label={t(
                                    "datastudio.upload.file",
                                    "上传本地文档",
                                )}
                                rules={[
                                    {
                                        required: true,
                                        message: t("emptyMessage"),
                                    },
                                ]}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    multiple
                                    // accept=".pdf,.doc"
                                    style={{ display: "none" }}
                                    onChange={(e) => {
                                        const files = Array.from(
                                            e.target.files || [],
                                        );
                                        files.forEach((file) => {
                                            // 校验文件大小，不超过1G
                                            if (file.size > 1 * 1024 * 1024 * 1024) {
                                                message.warning(`${file.name} ${t('err.fileSizeExceed.1g')}`);
                                                return;
                                            }
                                            customRequest({
                                                file,
                                                onSuccess: (response: any) => {
                                                    console.log(
                                                        "Upload success:",
                                                        response,
                                                    );
                                                },
                                                onError: (error: any) => {
                                                    console.error(
                                                        "Upload error:",
                                                        error,
                                                    );
                                                },
                                                onProgress: (progress: any) => {
                                                    console.log(
                                                        "Upload progress:",
                                                        progress,
                                                    );
                                                },
                                            });
                                        });
                                        // Reset the input to allow selecting the same files again
                                        e.target.value = "";
                                    }}
                                />
                                {sources?.length > 0 ? (
                                    <UploadFileList
                                        data={sources}
                                        apiId={apiId}
                                        onAdd={() => handleUploadClick()}
                                        onChange={(files) => {
                                            const { operator, mode } =
                                                form.getFieldsValue();
                                            onChange(
                                                {
                                                    mode,
                                                    sources: files,
                                                },
                                                operator,
                                            );
                                            setSources(files);
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            display: "flex",
                                            marginBottom:
                                                sources?.length > 0 ? 8 : 0,
                                        }}
                                    >
                                        <Input
                                            style={{ marginRight: "8px" }}
                                            placeholder={t(
                                                "datastudio.upload.file.placeholder",
                                                "文档将上传到默认路径，暂不支持指定路径上传",
                                            )}
                                            disabled={sources?.length > 0}
                                        />
                                        <Upload {...props}>
                                            <Button>
                                                {t(
                                                    "datastudio.trigger.scope.select",
                                                    "选择",
                                                )}
                                            </Button>
                                        </Upload>
                                    </div>
                                )}
                            </FormItem>
                            <FormItem
                                name={"mode"}
                                initialValue={ParametersModeEnum.Upload}
                            ></FormItem>
                        </>
                    ) : (
                        <FormItem
                            name={"docids"}
                            required
                            label={t(
                                "datastudio.trigger.scope",
                                "选择数据范围",
                            )}
                            rules={[
                                {
                                    required: true,
                                    message: t("emptyMessage"),
                                },
                            ]}
                        >
                            {docLibs.length === 0 ? (
                                <div style={{ display: "flex" }}>
                                    <Input
                                        style={{ marginRight: "8px" }}
                                        placeholder={t(
                                            "datastudio.trigger.scope.placeholder",
                                            "请选择数据范围",
                                        )}
                                    />
                                    <Button onClick={() => selectFn()}>
                                        {t(
                                            "datastudio.trigger.scope.select",
                                            "选择",
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <DocLibListNew
                                    data={docLibsArry()}
                                    onAdd={() => selectFn()}
                                    onChange={(value: any) =>
                                        onChange({
                                            depth: -1,
                                            docs: value,
                                            docids: value.map(
                                                ({ id }: any) => id,
                                            ),
                                        })
                                    }
                                />
                            )}
                        </FormItem>
                    )}
                </Form>
                {/* {
                showPicker
                    ? (
                        <DocLibsPicker
                            zIndex={9999}
                            selections={formattedInput(docLibs)}
                            onRequestSelectionChange={
                                (selections: DocLibItemRequest[]) => {
                                    if (!!selections.length) {
                                        form.setFields([{ name: 'docids', errors: [] }]);
                                    }

                                    const value = formattedOutput(selections)

                                    onChange({
                                        depth: -1,
                                        docs: value,
                                        docids: value.map(({ docid }) => docid)
                                    })
                                    setShowPicker(false)
                                }
                            }
                            onRequestClose={() => setShowPicker(false)}
                            isOrganization={false}
                            disabledSpecialLibList={['user_doc_lib']}
                        />
                    )
                    : null
            } */}
            </div>
        );
    },
);

export { SelectFileLib };
