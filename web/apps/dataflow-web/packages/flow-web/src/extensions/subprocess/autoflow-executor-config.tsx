import { forwardRef, useContext, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Form, Input, InputNumber, Radio, Select, Space, Typography } from "antd";
import { API, AsPermSelect, DatePickerISO, MicroAppContext, useTranslate } from "@applet/common";
import styles from "./autoflow-actions.module.less";
import { ExecutorActionConfigProps } from "../../components/extension";
import { DescriptionType } from "../../components/form-item-description";
import { concatProtocol } from "../../utils/browser";
import { AsFileSelect } from "../../components/as-file-select";
import { DipUserSelect } from "../../components/task-card/dip-user-select";
import { AsUserSelectChildRender } from "../../components/file-trigger-form/childrenRender";
import _ from "lodash";
import { isRelatedRatio } from "../internal/components/file-system-trigger";
import { FormItem } from "../../components/editor/form-item";

export function AutoflowExecutorConfig(autoFlowType: any) {
    return forwardRef(
        ({ parameters, onChange, dagsId }: ExecutorActionConfigProps, ref) => {
            const t = useTranslate("customExecutor");
            const { microWidgetProps, functionId } = useContext(MicroAppContext);
            const [form] = Form.useForm();
            const { prefixUrl } = useContext(MicroAppContext);
            const [fields, setFields] = useState([]);
            const [steps, setSteps] = useState([]);
            const [values, setValues] = useState<Record<string, any>>({});
            const [dagsList, setDagsList] = useState<any>([]);
            const [isValidating, setIsValidating] = useState(false);
            const [searchValue, setSearchValue] = useState('');
            const [page, setPage] = useState(0);
            const limit = 10;
            const [total, setTotal] = useState(0);
            const [currentAction, setCurrentAction] = useState<any>(null);
            const [showError, setShowError] = useState(false);

            useImperativeHandle(
                ref,
                () => {
                    return {
                        validate() {
                            // 手动检查currentAction是否为空
                            if (!currentAction?.value) {
                                setShowError(true);
                                return Promise.resolve(false);
                            }
                            // 手动检查编辑时候，选择的子流程是否和父流程一样
                            if (currentAction?.value === dagsId) {
                                setShowError(true);
                                return Promise.resolve(false);
                            }
                            setShowError(false);
                            return form.validateFields().then(
                                () => true,
                                () => false
                            );
                        },
                    };
                },
                [form, currentAction, setShowError]
            );


            // 创建防抖版本的API调用函数，延迟500毫秒执行
            const debouncedApiCall = _.debounce(async (value: string) => {
                setPage(0);
                await getDagsList(value, 0);
            }, 1000);

            const onSearch = async (value: string) => {
                // 立即更新搜索框显示的内容
                setSearchValue(value);
                // 使用防抖函数执行实际的API请求
                debouncedApiCall(value);
            };

            const getDagsList = async(search: string = '', currentPage: number = 0) => {
                try {
                    setIsValidating(true);
                    // 构建完整的API URL
                    const url = autoFlowType === 'workflow' 
                        ? `/api/automation/v1/dags?scope=all&trigger_types=manually,form&page=${currentPage}&limit=${limit}${search ? `&keyword=${encodeURIComponent(search)}` : ''}` 
                        : `/api/automation/v2/dags?type=data-flow&trigger_types=manually,form&page=${currentPage}&limit=${limit}${search ? `&keyword=${encodeURIComponent(search)}` : ''}`;
                    const { data } = await API.axios.get(`${prefixUrl}${url}`);
                    // 处理接口返回的数据，将title映射为label
                    const processedDags = (data?.dags || []).map((dag: any) => ({
                        version_id: dag.version_id,
                        label: dag.title,
                        value: dag.id
                    }));
                    
                    // 如果是第一页，替换数据；否则追加数据
                    if (currentPage === 0) {
                        setDagsList(processedDags);
                    } else {
                        setDagsList((prev: any[]) => [...prev, ...processedDags]);
                    }
                    setTotal(data?.total || 0);
                    setPage(currentPage);
                } catch (error) {
                    console.error("Failed to fetch dagslist:", error);
                } finally {
                    setIsValidating(false);
                }
            }

            const handleScroll = (e: React.UIEvent<HTMLElement>) => {
                const { target } = e;
                const { scrollTop, scrollHeight, clientHeight } = target as HTMLElement;
                // 已加载的数据量
                const loadedCount = page * limit;
                // 当滚动到底部且还有未加载的数据时，加载更多数据
                // 只有当已加载的数据量小于总记录数，且下一页请求不会超过总记录数时才触发
                if (scrollHeight - scrollTop - clientHeight < 10 && !isValidating && loadedCount < total && (page + 1) * limit < total) {
                    getDagsList(searchValue, page + 1);
                }
            };

            useEffect(() => {
                getDagsList();
            }, [autoFlowType]);

            // 统一处理dag相关操作的函数
            const handleDagSelection = async (dagId: string, existingAction?: any, existingData?: any) => {
                try {
                    let action = existingAction;
                    let data = existingData;
                    
                    // 如果没有提供action或data，从API获取
                    if (!action || !data) {
                        const apiUrl = `${prefixUrl}/api/automation/v1/dag/${dagId}`;
                        const response = await API.axios.get(apiUrl);
                        data = response.data;
                        
                        // 构建action对象
                        action = {
                            value: dagId,
                            label: data?.title || dagId,
                            version_id: data?.version_id
                        };
                    }
                    
                    // 保存action对象
                    setCurrentAction(action);
                    
                    // 处理dag详情
                    setSteps(data?.steps);
                    setFields(data?.steps?.[0]?.operator === '@trigger/form' ? data?.steps?.[0]?.parameters?.fields : []);
                    
                    // 检查最后一个步骤的operator是否为@control/flow/loop
                    const lastStep = data?.steps?.[data?.steps?.length - 1];
                    const isLoopStep = lastStep?.operator === '@control/flow/loop';
                    
                    // 如果有初始数据，设置表单的值
                    if (parameters?.data) {
                        form.setFieldsValue(parameters.data);
                        setValues(parameters.data);
                    }
                    
                    // 更新表单配置
                    setTimeout(() => {
                        onChange({
                            data: form.getFieldsValue(),
                            version_id: action?.version_id,
                            dag_id: dagId,
                            // 如果是循环步骤，添加fields字段等于最后一个步骤的parameters.outputs
                            ...(isLoopStep && { fields: _.map(lastStep?.parameters?.outputs, item => _.pick(item, ['type', 'key'])) })
                        });
                    }, 10);
                } catch (error) {
                    console.error("Failed to handle dag selection:", error);
                }
            };

            // 处理初始值，如果有dag_id，确保显示名称而不是ID
            useEffect(() => {
                const initialDagId = parameters?.dag_id;
                
                if (initialDagId) {
                    // 标准化为字符串ID
                    const dagId = typeof initialDagId === 'string' ? initialDagId : initialDagId.value || initialDagId.id;
                    
                    // 从dagsList中查找对应的选项
                    const foundAction = dagsList.find((item: any) => item.value === dagId);
                    if (foundAction) {
                        setCurrentAction(foundAction);
                    } else {
                        // 如果在dagsList中找不到，从API获取信息
                        handleDagSelection(dagId);
                    }
                }
            }, [parameters?.dag_id, dagsList, prefixUrl]);

            const deps = useMemo(() => {
                const deps: Record<string, [key: string, value: any][]> = {};
                if (!fields) return deps;
            
                for (const field of fields as any) {
                  if (field.type === "radio" && field.data) {
                    field.data.forEach((radioOption:any) => {
                      if (isRelatedRatio(radioOption) && radioOption.related?.length) {
                        for (const fieldKey of radioOption.related) {
                          if (!deps[fieldKey]) {
                            deps[fieldKey] = [];
                          }
                          deps[fieldKey].push([field.key, radioOption.value]);
                        }
                      }
                    });
                  }
                }
                return deps;
              }, [fields]);

            return (
              <Form
                form={form}
                layout="vertical"
                initialValues={parameters?.data || {}}
                onFieldsChange={() => {
                  const lastStep: any = steps?.[steps?.length - 1];
                  const isLoopStep =
                    lastStep?.operator === "@control/flow/loop";
                  onChange({
                    data: form.getFieldsValue(),
                    version_id: currentAction?.version_id,
                    dag_id: currentAction?.value,
                    ...(isLoopStep && {
                      fields: _.map(lastStep?.parameters?.outputs, (item) =>
                        _.pick(item, ["type", "key"])
                      ),
                    }),
                  });
                }}
                onFinishFailed={({ errorFields }) => {
                  // 获取第一个校验失败的字段
                  if (errorFields && errorFields.length > 0) {
                    try {
                      // 滚动到第一个错误字段
                      const element = document.querySelector(
                        ".CONTENT_AUTOMATION-ant-form-item-has-error"
                      );
                      if (element) {
                        element?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }
                    } catch (error) {
                      console.warn(error);
                    }
                  }
                }}
              >
                <FormItem
                  label={t(`${autoFlowType}`)}
                  key="dag_id"
                  required
                >
                  <Select
                    loading={isValidating}
                    allowClear
                    showSearch
                    filterOption={false}
                    searchValue={searchValue}
                    onSearch={onSearch}
                    options={dagsList}
                    onPopupScroll={handleScroll}
                    onDropdownVisibleChange={(visible) => {
                      // 当下拉框打开且列表为空时，重新加载数据
                      if (visible && dagsList.length === 0) {
                        getDagsList(searchValue, 0);
                      }
                    }}
                    placeholder={t("modelPlaceholder", "请选择")}
                    labelInValue
                    value={currentAction}
                    onChange={(option) => {
                      // 重置错误提示状态
                      setShowError(false);
                      // 保存选中的action，用于后续获取详情
                      if (option) {
                        // 当使用labelInValue时，需要从原始数据中查找完整的对象信息
                        // 首先从当前dagsList中查找
                        let fullOption = dagsList.find(
                          (item: any) => item.value === option.value
                        );

                        // 如果当前列表中没有找到（可能是搜索后的数据），先保存基本信息
                        if (!fullOption) {
                          fullOption = {
                            ...option,
                            // 保存当前搜索到的信息
                            value: option.value,
                            label: option.label,
                          };
                        }

                        // 重置分页状态，以便下次搜索重新加载数据
                        setPage(0);
                        // 使用统一的函数处理dag选择
                        handleDagSelection(option.value, fullOption);
                      } else {
                        // 清除选中时重置状态
                        setCurrentAction(null);
                      }
                    }}
                  />
                  {showError && !currentAction?.value && <p className={styles["error"]}>{t("emptyMessage", "此项不允许为空")}</p>}
                  {showError && currentAction?.value === dagsId && <p className={styles["error"]}>{t("subprocess.error")}</p>}
                </FormItem>
                {fields?.map((field: any) => {
                  if (
                    deps[field.key] &&
                    !deps[field.key].some(
                      ([key, value]) => values[key] === value
                    )
                  )
                    return null;

                  // 描述
                  let description = null;
                  if (field.description?.text) {
                    if (field.description?.type === DescriptionType.FileLink) {
                      description = (
                        <div>
                          <Typography.Text
                            ellipsis
                            title={field.description.text}
                            className={styles["link"]}
                            onClick={() => {
                              microWidgetProps?.contextMenu?.previewFn({
                                functionid: functionId,
                                item: {
                                  docid: field.description?.docid,
                                  size: 1,
                                  name: field.description?.name || "",
                                },
                              });
                            }}
                          >
                            {field.description.text}
                          </Typography.Text>
                        </div>
                      );
                    } else if (
                      field.description?.type === DescriptionType.UrlLink
                    ) {
                      description = (
                        <div>
                          <Typography.Text
                            ellipsis
                            title={field.description.text}
                            className={styles["link"]}
                            onClick={() => {
                              microWidgetProps?.history?.openBrowser(
                                concatProtocol(field.description?.link)
                              );
                            }}
                          >
                            {field.description.text}
                          </Typography.Text>
                        </div>
                      );
                    } else {
                      description = (
                        <div>
                          <Typography.Text
                            ellipsis
                            title={field.description.text}
                            className={styles["description"]}
                          >
                            {field.description.text}
                          </Typography.Text>
                        </div>
                      );
                    }
                  }

                  return (
                    <FormItem
                      key={field.key}
                      name={field.key}
                      initialValue={field.default}
                      allowVariable
                      label={
                        <>
                          <Typography.Text>
                            {field.name + t("color", "：")}
                          </Typography.Text>
                          {description}
                        </>
                      }
                      rules={
                        field.required
                          ? [
                              {
                                required: true,
                                message: t(`emptyMessage`),
                              },
                            ]
                          : []
                      }
                    >
                      {(() => {
                        switch (field.type) {
                          case "number":
                            return (
                              <InputNumber
                                autoComplete="off"
                                placeholder={t("form.placeholder", "请输入")}
                                style={{
                                  width: "100%",
                                }}
                                precision={0}
                                min={1}
                              />
                            );
                          case "asFile":
                            return (
                              <AsFileSelect
                                selectType={1}
                                multiple={false}
                                title={t("selectFile", "选择文件")}
                                placeholder={t("select.placeholder", "请选择")}
                              />
                            );
                          case "multipleFiles":
                            return (
                              <AsFileSelect
                                selectType={1}
                                multiple={true}
                                multipleMode="list"
                                checkDownloadPerm={true}
                                title={t("selectFile", "选择文件")}
                                placeholder={t("select.placeholder", "请选择")}
                              />
                            );
                          case "asFolder":
                            return (
                              <AsFileSelect
                                selectType={2}
                                multiple={false}
                                title={t("selectFolder", "选择文件夹")}
                                placeholder={t("select.placeholder", "请选择")}
                              />
                            );
                          case "datetime":
                            return (
                              <DatePickerISO
                                showTime
                                popupClassName="automate-oem-primary"
                                style={{
                                  width: "100%",
                                }}
                              />
                            );
                          case "asPerm":
                            return <AsPermSelect />;
                          case "asUsers":
                            return (
                              <DipUserSelect
                                selectPermission={2}
                                groupOptions={{
                                  select: 3,
                                  drillDown: 1,
                                }}
                                isBlockContact
                                children={AsUserSelectChildRender}
                              />
                            );
                          case "asDepartments":
                            return (
                              <DipUserSelect
                                selectPermission={1}
                                isBlockGroup
                                isBlockContact
                                children={AsUserSelectChildRender}
                              />
                            );
                          case "radio":
                            return (
                              <Radio.Group>
                                <Space direction="vertical">
                                  {field.data?.map((item: any) => {
                                    const value =
                                      item && typeof item === "object"
                                        ? item.value
                                        : item;

                                    return (
                                      <Radio value={value}>
                                        <Typography.Text ellipsis title={value}>
                                          {value}
                                        </Typography.Text>
                                      </Radio>
                                    );
                                  })}
                                </Space>
                              </Radio.Group>
                            );
                          case "long_string":
                            return (
                              <Input.TextArea
                                className={styles["textarea"]}
                                placeholder={t(
                                  "stringPlaceholder",
                                  "请输入内容"
                                )}
                              />
                            );
                          default:
                            return (
                              <Input
                                autoComplete="off"
                                placeholder={t(
                                  "stringPlaceholder",
                                  "请输入内容"
                                )}
                              />
                            );
                        }
                      })()}
                    </FormItem>
                  );
                })}
              </Form>
            );
        }
    );
}
