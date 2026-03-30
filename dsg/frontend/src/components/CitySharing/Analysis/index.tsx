import React, { useEffect, useMemo, useState } from 'react'
import {
    Button,
    Checkbox,
    Col,
    Drawer,
    Form,
    Input,
    message,
    Radio,
    Row,
    Space,
} from 'antd'
import classNames from 'classnames'
import { InfoCircleFilled, PlusOutlined } from '@ant-design/icons'
import { cloneDeep } from 'lodash'
import { useNavigate } from 'react-router-dom'
import { ApplyResource, ConfigModeEnum, SharingOperate } from '../const'
import DrawerHeader from '../component/DrawerHeader'
import styles from './styles.module.less'
import __ from '../locale'
import { CommonTitle } from '@/ui'
import ResourceTable from './ResourceTable'
import AddResourceDrawer from '../component/AddResourceDrawer'
import {
    formatError,
    getCityShareApplyDetail,
    ISharedApplyDetail,
    LoginPlatform,
    putCityShareApplyAnalysis,
    reqDataCatlgBasicInfo,
    ShareApplySubmitType,
} from '@/core'
import CatalogList from '../component/CatalogList'
import AnalysisConfig from './AnalysisConfig'
import { applyFieldsConfig } from '../Details/helper'
import CatalogForm from '../Apply/CatalogForm'
import { ResTypeEnum } from '../helper'
import { getPlatformNumber } from '@/utils'
import { analysisConclusionConfig } from './helper'
import { htmlDecodeByRegExp } from '@/components/ResourcesDir/const'
import { TextAreaView } from '@/components/AutoFormView/baseViewComponents'

interface IAnalysis {
    open: boolean
    onClose?: () => void
    // 共享申请 id
    applyId?: string
}

const Analysis: React.FC<IAnalysis> = ({ open, onClose, applyId }) => {
    const [form] = Form.useForm()
    const [catalogForm] = Form.useForm()
    const [analysisForm] = Form.useForm()
    const [catalogsData, setCatalogsData] = useState<any[]>([])
    const [addResOpen, setAddResOpen] = useState(false)
    const [configMode, setConfigMode] = useState<ConfigModeEnum>(
        ConfigModeEnum.Table,
    )
    // 选中目录id
    const [selectedCatalogId, setSelectedCatalogId] = useState<string>()
    // 新增资源时，是否时替换资源
    const [isReplace, setIsReplace] = useState<boolean>(false)

    const [details, setDetails] = useState<ISharedApplyDetail>()
    // 正在检查
    const [checking, setChecking] = useState<boolean>(false)

    const [saveLoading, setSaveLoading] = useState<boolean>(false)

    const navigator = useNavigate()

    const platform = getPlatformNumber()
    // 是否全部资源不合理
    const [isAllUnReasonal, setIsAllUnReasonal] = useState(false)

    // 选中的资源可以是申请时的资源、分析时新添加的资源或替换资源
    const selectedCatalog = useMemo(() => {
        return (
            catalogsData.find((c) => c.res_id === selectedCatalogId) ||
            // 当选中项为替换资源时，replace_res中存替换资源的数据
            catalogsData.find(
                (c) => c.replace_res?.res_id === selectedCatalogId,
            )?.replace_res
        )
    }, [selectedCatalogId, catalogsData])

    const countRes = useMemo(() => {
        let viewCount = 0
        let apiCount = 0
        let viewIsReasonalCount = 0
        let apiIsReasonCount = 0
        catalogsData.forEach((item) => {
            if (item.apply_conf.supply_type === ApplyResource.Database) {
                viewCount += 1
                if (item.is_reasonable) {
                    viewIsReasonalCount += 1
                }
            } else {
                apiCount += 1
                if (item.is_reasonable) {
                    apiIsReasonCount += 1
                }
            }
        })
        return {
            viewCount: viewCount || '0',
            apiCount: apiCount || '0',
            viewIsReasonalCount: viewIsReasonalCount || '0',
            apiIsReasonCount: apiIsReasonCount || '0',
        }
    }, [catalogsData])

    useEffect(() => {
        form.setFieldsValue({
            conclusion: __(
                '共申请${count1}张库表资源，${count2}个接口资源，经分析评估可进行提供${count3}张库表资源，${count4}个接口资源。',
                {
                    count1: countRes.viewCount,
                    count2: countRes.apiCount,
                    count3: countRes.viewIsReasonalCount,
                    count4: countRes.apiIsReasonCount,
                },
            ),
        })
    }, [JSON.stringify(countRes)])

    const handelSetAnalysisConclusion = () => {
        // 若果是替换资源则默认合理
        const tempData = cloneDeep(catalogsData).map((item) => ({
            ...item,
            is_reasonable: item.replace_res ? true : item.is_reasonable,
        }))
        // 是否全部分析完成
        const isAnalysisOver = tempData.every((item) => item.configFinish)
        if (tempData.length === 1) {
            form.setFieldsValue({
                feasibility:
                    typeof tempData[0].is_reasonable === 'boolean'
                        ? tempData[0].is_reasonable
                            ? 'feasible'
                            : 'unfeasible'
                        : 'partial',
            })
            return
        }
        if (
            !isAnalysisOver ||
            (isAnalysisOver &&
                tempData.some((item) => !item.is_reasonable) &&
                !tempData.every((item) => !item.is_reasonable))
        ) {
            form.setFieldsValue({ feasibility: 'partial' })
        } else if (
            isAnalysisOver &&
            tempData.every(
                (item) =>
                    typeof item.is_reasonable === 'boolean' &&
                    !item.is_reasonable,
            )
        ) {
            form.setFieldsValue({ feasibility: 'unfeasible' })
        } else if (
            tempData.every(
                (item) =>
                    typeof item.is_reasonable === 'boolean' &&
                    item.is_reasonable,
            )
        ) {
            form.setFieldsValue({ feasibility: 'feasible' })
        }
    }

    useEffect(() => {
        handelSetAnalysisConclusion()
    }, [catalogsData])

    useEffect(() => {
        if (applyId) {
            getDetails()
        }
    }, [applyId])

    // 获取信息
    const getDetails = async () => {
        try {
            const res = await getCityShareApplyDetail(applyId!, {
                fields: 'base,analysis',
            })
            setDetails(res)
            const baseResources = res.base.resources || []
            const analysisResources = res.analysis?.resources || []
            const clgData = baseResources.map((resource) => {
                const { apply_conf, ...restSource } = resource
                const { view_apply_conf, api_apply_conf, ...restApplyConf } =
                    apply_conf
                const analysisRes = analysisResources.find(
                    (item) => item.src_id === resource.id,
                )

                const { id, ...restAnalysisRes } = analysisRes || {}
                return {
                    ...restSource,
                    ...restAnalysisRes,
                    analysis_item_id: id,
                    configFinish: !!analysisRes,
                    replace_res: !analysisRes?.is_res_replace
                        ? undefined
                        : {
                              res_type: ResTypeEnum.Catalog,
                              res_id: analysisRes?.new_res_id,
                              res_code: analysisRes?.new_res_code,
                              res_name: analysisRes?.new_res_name,
                              org_path: analysisRes?.org_path,
                              apply_conf: analysisRes?.apply_conf,
                          },
                    apply_conf: {
                        ...restApplyConf,
                        view_apply_conf: view_apply_conf
                            ? {
                                  ...view_apply_conf,
                                  columns: JSON.parse(
                                      view_apply_conf.column_names,
                                  ).map((c, cIdx) => ({
                                      business_name: c,
                                      id: view_apply_conf.column_ids.split(',')[
                                          cIdx
                                      ],
                                  })),
                              }
                            : undefined,
                        api_apply_conf: api_apply_conf || undefined,
                    },
                }
            })
            setCatalogsData([
                ...clgData,
                ...analysisResources
                    .filter((item) => item.is_new_res)
                    .map((item) => {
                        return {
                            ...item,
                            configFinish: true,
                            analysis_item_id: item.id,
                            res_id: item.new_res_id,
                            res_name: item.new_res_name,
                            res_code: item.new_res_code,
                            res_type: item.new_res_type,
                        }
                    }),
            ])
            setSelectedCatalogId(clgData[0].res_id)
            if (res.analysis) {
                const { feasibility, conclusion, usage } = res.analysis
                form.setFieldsValue({ feasibility, conclusion, usage })
            }
        } catch (error) {
            formatError(error)
        }
    }

    const handleAddResOk = async (clg: any, mountedRes: any) => {
        try {
            const baseInfoRes: any = await reqDataCatlgBasicInfo(clg.res_id)
            if (!isReplace) {
                setCatalogsData([
                    ...catalogsData,
                    {
                        res_id: clg.res_id,
                        ...clg,
                        org_path: baseInfoRes.department_path,
                        data_range: baseInfoRes.data_range,
                        update_cycle: baseInfoRes.update_cycle,
                        res_type: ResTypeEnum.Catalog,
                        new_res_id: clg.res_id,
                        apply_conf: {
                            data_res_id: mountedRes.resource_id,
                            view_apply_conf: {
                                data_res_name: mountedRes.name,
                                data_res_code: mountedRes.code,
                            },
                            supply_type:
                                mountedRes.resource_type === 1
                                    ? ApplyResource.Database
                                    : ApplyResource.Interface,
                        },
                        is_new_res: true,
                    },
                ])
                if (!selectedCatalogId) {
                    setSelectedCatalogId(clg.res_id)
                }
            } else {
                // 替换资源 selectedCatalogId
                // 需要同时设置 is_res_replace 为 true，否则 new_res_id 字段的校验会失败
                analysisForm.setFieldsValue({
                    new_res_id: clg.res_id,
                    is_res_replace: true,
                })
                setCatalogsData([
                    ...catalogsData.map((item) => {
                        if (item.res_id === selectedCatalogId) {
                            return {
                                ...item,
                                // 新替换的目录id
                                new_res_id: clg.res_id,
                                new_res_name: clg.res_name,
                                // 标记为替换资源，确保 AnalysisConfig 组件能正确显示和校验 new_res_id 字段
                                is_res_replace: true,
                                configFinish: true,
                                apply_conf: {
                                    // 目录下的资源id 即库表id
                                    ...item.apply_conf,
                                    data_res_id: mountedRes.resource_id,
                                    data_res_name: mountedRes.name,
                                },
                                replace_res: {
                                    ...clg,
                                    org_path: baseInfoRes.department_path,
                                    data_range: baseInfoRes.data_range,
                                    update_cycle: baseInfoRes.update_cycle,
                                    res_type: ResTypeEnum.Catalog,
                                    // 标记为新资源，选中该资源时需配置信息（与申报时配置一致）
                                    is_new_res: true,
                                    apply_conf: {
                                        supply_type:
                                            mountedRes.resource_type === 1
                                                ? ApplyResource.Database
                                                : ApplyResource.Interface,
                                        view_apply_conf:
                                            mountedRes.resource_type === 1
                                                ? {
                                                      // 目录下的资源id 即库表id
                                                      data_res_id:
                                                          mountedRes.resource_id,
                                                      data_res_name:
                                                          mountedRes.name,
                                                  }
                                                : undefined,
                                        // 接口服务无法替换资源 以下不会走到
                                        api_apply_conf:
                                            mountedRes.resource_type === 2
                                                ? {
                                                      data_res_id:
                                                          mountedRes.resource_id,
                                                      data_res_name:
                                                          mountedRes.name,
                                                  }
                                                : undefined,
                                    },
                                },
                            }
                        }
                        return item
                    }),
                ])
            }
        } catch (e) {
            formatError(e)
        } finally {
            setIsReplace(false)
        }
    }
    // 切换目录
    const changeSelectCatalog = (step: 1 | -1) => {
        if (catalogsData.length === 1) return
        const currentIndex = catalogsData.findIndex(
            (c) => c.res_id === selectedCatalogId,
        )
        if (catalogsData[currentIndex].replace_res) {
            return
        }
        let nextIndex = 0
        if (step === 1) {
            nextIndex = currentIndex + 1
            if (nextIndex > catalogsData.length) {
                nextIndex = 0
            }
        } else {
            nextIndex = currentIndex - 1
            if (nextIndex < 0) {
                nextIndex = 0
            }
        }
        setSelectedCatalogId(catalogsData[nextIndex].res_id)
    }

    const getTimeRange = (item) => {
        const timeRange = item.apply_conf?.view_apply_conf?.time_range
        if (!timeRange) return ''
        const timeRangeType = item.apply_conf?.view_apply_conf?.time_range_type
        const timeRangeRes =
            timeRangeType === 'select'
                ? `${timeRange[0].format('YYYY-MM-DD')}~${timeRange[1].format(
                      'YYYY-MM-DD',
                  )}`
                : timeRange
        return timeRangeRes
    }

    const checkRequired = async () => {
        try {
            await form.validateFields()
            const isExistUnConfig = catalogsData.find(
                (item) => !item.configFinish,
            )
            if (isExistUnConfig) {
                if (configMode === ConfigModeEnum.Table) {
                    setConfigMode(ConfigModeEnum.Multiple)
                    setSelectedCatalogId(isExistUnConfig.res_id)
                }
                await analysisForm.validateFields()
                return false
            }
            return true
        } catch (error) {
            const firstError = error?.errorFields?.[0]
            if (firstError?.name?.[0]) {
                form.scrollToField(firstError.name[0])
                catalogForm.scrollToField(firstError.name[0])
                analysisForm.scrollToField(firstError.name[0])
            }
            return false
        }
    }

    // 提交申请
    const handleSave = async (submitType: ShareApplySubmitType) => {
        // try {
        //     setSaveLoading(true)
        let isContinue = true
        if (submitType === ShareApplySubmitType.Draft) {
            isContinue = true
        } else {
            isContinue = await checkRequired()
        }

        if (!isContinue) return

        const baseInfo = await form.getFieldsValue()

        await putCityShareApplyAnalysis(applyId!, {
            ...baseInfo,
            submit_type: submitType,
            analysis_id: details?.analysis?.id,
            resources: catalogsData.map((item) => {
                const is_new_res = item.replace_res
                    ? false
                    : item.is_new_res || false
                const column_ids = item.apply_conf.view_apply_conf?.columns
                    ?.map((sc) => sc.id)
                    .join(',')
                const column_names = JSON.stringify(
                    item.apply_conf.view_apply_conf?.columns?.map(
                        (sc) => sc.business_name,
                    ),
                )

                return {
                    // 分析资源项ID，没有则不填
                    id: details?.analysis ? item.analysis_item_id : undefined,
                    // 是否为完全新添加的资源 替换资源时为false
                    is_new_res,
                    // 原始共享申请资源项ID
                    src_id: is_new_res ? undefined : item.id,
                    is_reasonable: is_new_res ? true : item.is_reasonable,
                    additional_info_types: item.is_reasonable
                        ? Array.from(
                              new Set(item.additional_info_types?.split(',')),
                          ).join(',')
                        : undefined,
                    attach_add_remark: item.attach_add_remark,
                    // 新添加资源分析结果不需要是否替换资源配置
                    // 申请原始资源分析结果合理时不需要是否替换资源配置
                    is_res_replace:
                        is_new_res || item.is_reasonable
                            ? undefined
                            : item.apply_conf.supply_type ===
                                  ApplyResource.Interface && !item.is_reasonable
                            ? false
                            : item.is_res_replace,
                    // 仅原始需求资源合理且提供方式为库表交换时需要记录分析后变更的原始需求资源申请信息项ids及名称配置
                    column_ids: !(
                        item.is_reasonable &&
                        item.apply_conf.supply_type === ApplyResource.Database
                    )
                        ? undefined
                        : item.column_ids ||
                          item.apply_conf.view_apply_conf?.column_ids ||
                          column_ids,
                    column_names: !(
                        item.is_reasonable &&
                        item.apply_conf.supply_type === ApplyResource.Database
                    )
                        ? undefined
                        : item.column_names ||
                          item.apply_conf.view_apply_conf?.column_names ||
                          column_names,
                    // 替换或分析时新添加资源项ID，有则填 第一次没有
                    new_id: item.new_id,
                    // 替换或分析时新添加资源ID，仅当不合理且替换资源或添加新资源时需要
                    new_res_id: item.replace_res
                        ? item.replace_res.res_id
                        : is_new_res
                        ? item.res_id
                        : undefined,
                    new_res_type: item.replace_res
                        ? item.replace_res.res_type
                        : is_new_res
                        ? item.res_type
                        : undefined,
                    apply_conf: item.is_res_replace
                        ? {
                              ...item.replace_res.apply_conf,
                              view_apply_conf: {
                                  ...item.replace_res.apply_conf
                                      .view_apply_conf,
                                  time_range: getTimeRange(item.replace_res),
                              },
                          }
                        : // 新增资源
                        item.is_new_res
                        ? {
                              ...item.apply_conf,
                              view_apply_conf: {
                                  ...item.apply_conf.view_apply_conf,
                                  time_range: getTimeRange(item),
                              },
                          }
                        : undefined,
                    api_id: item.api_id || undefined,
                }
            }),
        })

        message.success(
            submitType === ShareApplySubmitType.Submit
                ? __('提交成功')
                : __('暂存成功'),
        )

        onClose?.()
        // } catch (err) {
        //     formatError(err)
        // } finally {
        //     setSaveLoading(false)
        // }
    }

    const getApplyInfo = () => {
        return applyFieldsConfig.map((item) => {
            return (
                <Col
                    key={item.key}
                    className={styles['basic-item']}
                    span={item.span}
                >
                    <div className={styles.label}>{item.label}：</div>
                    <div className={styles.value}>
                        {item.render
                            ? item.render(
                                  details?.base[item.key],
                                  details?.base || {},
                              )
                            : details?.base[item.key] || '--'}
                    </div>
                </Col>
            )
        })
    }

    const getAnalysisConclusion = () => {
        return (
            <Form
                layout="vertical"
                className={styles['analysis-form']}
                form={form}
                scrollToFirstError
            >
                <Form.Item
                    label={__('分析结论')}
                    required
                    className={styles['analysis-conclusion-item']}
                    name="feasibility"
                >
                    <Radio.Group>
                        {analysisConclusionConfig.map((item) => (
                            <Radio key={item.value} value={item.value} disabled>
                                {item.label}
                            </Radio>
                        ))}
                    </Radio.Group>
                </Form.Item>
                <Form.Item
                    label={__('分析及结果确认')}
                    required
                    rules={[{ required: true, message: __('输入不能为空') }]}
                    name="conclusion"
                >
                    <Input.TextArea
                        className={styles['analysis-result-textarea']}
                        placeholder={__(
                            '共申请${count1}张库表资源，${count2}个接口资源，经分析评估可进行提供${count3}张库表资源，${count4}个接口资源。',
                            {
                                count1: countRes.viewCount,
                                count2: countRes.apiCount,
                                count3: countRes.viewIsReasonalCount,
                                count4: countRes.apiIsReasonCount,
                            },
                        )}
                        maxLength={300}
                        showCount
                    />
                </Form.Item>
                <Form.Item
                    shouldUpdate={(pre, cur) =>
                        pre.feasibility !== cur.feasibility
                    }
                    noStyle
                >
                    {({ getFieldValue }) => {
                        const isRequired = ['feasible', 'partial'].includes(
                            getFieldValue('feasibility'),
                        )
                        return (
                            <Form.Item
                                label={__('数据用途')}
                                required={isRequired}
                                rules={[
                                    {
                                        required: isRequired,
                                        message: __('输入不能为空'),
                                    },
                                ]}
                                name="usage"
                            >
                                <Input.TextArea
                                    className={
                                        styles['analysis-result-textarea']
                                    }
                                    placeholder={__('请输入')}
                                    maxLength={300}
                                    showCount
                                />
                            </Form.Item>
                        )
                    }}
                </Form.Item>
            </Form>
        )
    }

    const handleCustonApiChange = (apiId) => {
        const tempData = catalogsData.map((c) => {
            if (c.res_id === selectedCatalogId) {
                return {
                    ...c,
                    api_id: apiId || undefined,
                    configFinish: true,
                }
            }
            return c
        })
        setCatalogsData(tempData)
    }

    const handleAnalysisFormChange = (fields, selectedColumns, values) => {
        let configFinish = false
        const isApi =
            selectedCatalog?.apply_conf?.supply_type === ApplyResource.Interface
        const {
            is_reasonable,
            additional_info_types = [],
            attach_add_remark,
            is_res_replace,
            new_res_id,
            api_id,
        } = values
        // 当 fields 为空但 values 有值时，说明是切换资源前手动保存，直接保存数据不重新计算 configFinish
        if (fields.length === 0 && values) {
            const tempData = catalogsData.map((c) => {
                if (c.res_id === selectedCatalogId) {
                    return {
                        ...c,
                        // 保持原有的 configFinish，只更新表单值
                        is_reasonable,
                        additional_info_types: Array.isArray(
                            additional_info_types,
                        )
                            ? additional_info_types.join(',')
                            : additional_info_types,
                        attach_add_remark,
                        is_res_replace,
                        replace_res: is_res_replace ? c.replace_res : undefined,
                        new_res_id: is_res_replace ? c.new_res_id : undefined,
                        new_res_name: is_res_replace
                            ? c.new_res_name
                            : undefined,
                        api_id: api_id || undefined,
                        column_ids: isApi
                            ? undefined
                            : is_reasonable
                            ? selectedColumns.map((sc) => sc.id).join(',')
                            : undefined,
                        column_names: isApi
                            ? undefined
                            : is_reasonable
                            ? JSON.stringify(
                                  selectedColumns.map((sc) => sc.business_name),
                              )
                            : undefined,
                    }
                }
                return c
            })
            setCatalogsData(tempData)
            return
        }

        // 正常表单字段变化时的逻辑
        if (fields.length > 0) {
            if (!isApi) {
                configFinish =
                    !(
                        // 未选是否合理 || 选了合理且选了附件 但未写说明 ||  选择不合理时替换资源未选择新资源
                        (
                            typeof is_reasonable !== 'boolean' ||
                            (is_reasonable &&
                                additional_info_types?.includes('attachment') &&
                                !attach_add_remark) ||
                            (!is_reasonable && is_res_replace && !new_res_id)
                        )
                    ) && selectedColumns.length > 0
            } else {
                const requiredFields = fields.filter(
                    (field) =>
                        Array.isArray(field.name) &&
                        !['additional_info_types'].some(
                            (id) =>
                                Array.isArray(field.name) &&
                                field.name.includes(id),
                        ),
                )
                configFinish = requiredFields.every((f) => {
                    if (typeof f.value === 'boolean') {
                        return true
                    }
                    if (f.value || f.value === 0) {
                        if (typeof f.value === 'number') {
                            return true
                        }
                        return f.errors?.length === 0
                    }

                    return false
                })

                configFinish =
                    (additional_info_types?.includes('attachment')
                        ? !!attach_add_remark
                        : true) && configFinish
            }
            const tempData = catalogsData.map((c) => {
                if (c.res_id === selectedCatalogId) {
                    return {
                        ...c,
                        configFinish,
                        is_reasonable,
                        additional_info_types: additional_info_types.join(','),
                        attach_add_remark,
                        is_res_replace,
                        replace_res: is_res_replace ? c.replace_res : undefined,
                        new_res_id: is_res_replace ? c.new_res_id : undefined,
                        new_res_name: is_res_replace
                            ? c.new_res_name
                            : undefined,
                        api_id: api_id || undefined,
                        column_ids: isApi
                            ? undefined
                            : is_reasonable
                            ? selectedColumns.map((sc) => sc.id).join(',')
                            : undefined,
                        column_names: isApi
                            ? undefined
                            : is_reasonable
                            ? JSON.stringify(
                                  selectedColumns.map((sc) => sc.business_name),
                              )
                            : undefined,
                    }
                }
                return c
            })
            setCatalogsData(tempData)
        }
    }

    const handleApplyFormChange = (fields, selectedColumns) => {
        if (fields.length > 0) {
            const requiredFields = fields.filter(
                (field) =>
                    Array.isArray(field.name) &&
                    ![
                        'dst_data_source_id',
                        'dst_view_name',
                        'push_fields',
                    ].some(
                        (id) =>
                            Array.isArray(field.name) &&
                            field.name.includes(id),
                    ),
            )

            const formData = catalogForm.getFieldsValue()
            const {
                supply_type,
                available_date_type,
                other_available_date,
                ...rest
            } = formData
            // 注册接口资源 或 目录资源的提供方式选择接口
            const isApi =
                selectedCatalog?.res_type === ResTypeEnum.Api ||
                supply_type === ApplyResource.Interface

            const configFinish =
                requiredFields.every((f) => {
                    if (typeof f.value === 'boolean') {
                        return true
                    }
                    if (f.value || f.value === 0) {
                        if (typeof f.value === 'number') {
                            return true
                        }
                        return f.errors?.length === 0
                    }

                    return false
                }) &&
                (isApi || selectedColumns.length > 0)
            const column_ids = selectedColumns?.map((sc) => sc.id).join(',')
            const column_names = JSON.stringify(
                selectedColumns?.map((sc) => sc.business_name),
            )

            const newCatalogData = catalogsData.map((clg) => {
                // 填写的是新资源时
                if (clg.res_id === selectedCatalogId) {
                    return {
                        ...clg,
                        configFinish,
                        apply_conf: {
                            supply_type,
                            available_date_type,
                            other_available_date,

                            view_apply_conf: isApi
                                ? undefined
                                : {
                                      ...rest,
                                      columns: selectedColumns,
                                      column_ids,
                                      column_names,
                                  },
                            api_apply_conf: isApi
                                ? // 注册接口is_customized默认为false,data_res_id:注册接口id
                                  // 目录下的接口对接又用户选择决定（rest会覆盖is_customized）
                                  {
                                      is_customized: false,
                                      data_res_id: clg.res_id,
                                      ...rest,
                                  }
                                : undefined,
                        },
                    }
                }
                // 填写的是替换资源
                if (clg.replace_res?.res_id === selectedCatalogId) {
                    return {
                        ...clg,
                        replace_res: {
                            ...clg.replace_res,
                            configFinish,
                            apply_conf: {
                                ...clg.replace_res.apply_conf,
                                supply_type,
                                available_date_type,
                                other_available_date,
                                view_apply_conf: isApi
                                    ? undefined
                                    : {
                                          ...rest,
                                          columns: selectedColumns,
                                          column_ids,
                                          column_names,
                                      },
                                api_apply_conf: isApi
                                    ? {
                                          is_customized: false,
                                          data_res_id: clg.res_id,
                                          ...rest,
                                      }
                                    : undefined,
                            },
                        },
                    }
                }
                return clg
            })
            setCatalogsData(newCatalogData)
            // setCatalogFields((prev) => [
            //     ...prev.filter(
            //         (f) =>
            //             f.res_id !==
            //             selectedCatalog,
            //     ),
            //     {
            //         res_id: selectedCatalog,
            //         fields,
            //     },
            // ])
        }
    }

    const getAnalysisResource = () => {
        return (
            <div className={styles['analysis-resource-wrapper']}>
                {configMode === ConfigModeEnum.Table && (
                    <ResourceTable
                        items={catalogsData}
                        handleAddResource={() => {
                            setAddResOpen(true)
                        }}
                        handleAnalysis={(resId: string, isSingle = false) => {
                            setConfigMode(
                                isSingle
                                    ? ConfigModeEnum.Single
                                    : ConfigModeEnum.Multiple,
                            )
                            setSelectedCatalogId(resId)
                        }}
                        handleResUnreasonable={(val: boolean) => {
                            if (val) {
                                setCatalogsData(
                                    catalogsData.map((item) => {
                                        return {
                                            ...item,
                                            is_reasonable: false,
                                            is_res_replace:
                                                item.apply_conf?.supply_type ===
                                                ApplyResource.Interface
                                                    ? undefined
                                                    : false,
                                            configFinish: true,
                                        }
                                    }),
                                )
                            }
                            setIsAllUnReasonal(val)
                        }}
                    />
                )}
                {configMode === ConfigModeEnum.Multiple && (
                    <div>
                        <div className={styles['list-top-info']}>
                            <div className={styles['list-title']}>
                                {__('资源列表')}
                            </div>
                            <Button
                                type="link"
                                className={styles['list-add-btn']}
                                onClick={() => {
                                    setAddResOpen(true)
                                }}
                                disabled={isAllUnReasonal}
                            >
                                <PlusOutlined
                                    className={styles['list-add-btn-icon']}
                                />
                                {__('添加资源')}
                            </Button>
                        </div>
                        <CatalogList
                            items={catalogsData}
                            selectedCatalog={selectedCatalog}
                            onItemClick={(value, isRep) => {
                                setSelectedCatalogId(value?.res_id)
                            }}
                        />
                    </div>
                )}
                {[ConfigModeEnum.Single, ConfigModeEnum.Multiple].includes(
                    configMode,
                ) && (
                    <div className={styles['analysis-resource-config']}>
                        {configMode === ConfigModeEnum.Multiple && (
                            <div className={styles['config-operate']}>
                                <span className={styles['config-label']}>
                                    {__('已分析资源：')}
                                </span>
                                <span className={styles['config-count']}>
                                    {`${
                                        catalogsData.filter(
                                            (item) => item.configFinish,
                                        ).length
                                    } / ${catalogsData.length}`}
                                </span>
                                <Button
                                    onClick={() => {
                                        setConfigMode(ConfigModeEnum.Table)
                                        // setSelectedCatalogId(undefined)
                                    }}
                                >
                                    {__('保存并返回列表')}
                                </Button>
                            </div>
                        )}
                        <div
                            className={styles['analysis-resource-details']}
                            style={
                                selectedCatalog?.is_new_res
                                    ? { padding: 20 }
                                    : {}
                            }
                        >
                            {selectedCatalog?.is_new_res ? (
                                <CatalogForm
                                    checking={checking}
                                    setChecking={setChecking}
                                    form={catalogForm}
                                    catalog={selectedCatalog}
                                    handleSave={
                                        configMode === ConfigModeEnum.Single
                                            ? () => {
                                                  setConfigMode(
                                                      ConfigModeEnum.Table,
                                                  )
                                              }
                                            : undefined
                                    }
                                    fields={[]}
                                    onChange={handleApplyFormChange}
                                    handleLast={() => changeSelectCatalog(-1)}
                                    handleNext={() => changeSelectCatalog(1)}
                                />
                            ) : (
                                <AnalysisConfig
                                    configMode={configMode}
                                    catalog={selectedCatalog}
                                    handleAddResource={() => {
                                        setIsReplace(true)
                                        setAddResOpen(true)
                                    }}
                                    handleNext={() => changeSelectCatalog(1)}
                                    handleLast={() => changeSelectCatalog(-1)}
                                    handleSave={
                                        configMode === ConfigModeEnum.Single
                                            ? () => {
                                                  setConfigMode(
                                                      ConfigModeEnum.Table,
                                                  )
                                              }
                                            : undefined
                                    }
                                    onChange={handleAnalysisFormChange}
                                    form={analysisForm}
                                    handleCustonApiChange={
                                        handleCustonApiChange
                                    }
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <Drawer
            open={open}
            width="100%"
            placement="right"
            closable={false}
            bodyStyle={{
                padding: '0',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 1080,
            }}
            contentWrapperStyle={{ minWidth: 800 }}
            destroyOnClose
            maskClosable={false}
            mask={false}
            push={false}
        >
            <div
                className={classNames(
                    styles.details,
                    styles['analysis-details-wrapper'],
                )}
            >
                {/* 导航头部 */}
                <DrawerHeader
                    title={__('共享申请分析')}
                    fullScreen
                    onClose={onClose}
                />

                {/* 内容 */}
                <div className={styles.bottom}>
                    <div className={styles.content}>
                        <div className={styles['content-body']}>
                            {details?.analysis?.confirm_result === 'reject' &&
                                details?.analysis?.confirm_remark && (
                                    <div
                                        className={
                                            styles['reject-tip-container']
                                        }
                                    >
                                        <div className={styles['reject-tips']}>
                                            <div
                                                className={
                                                    styles['reject-title']
                                                }
                                            >
                                                <InfoCircleFilled
                                                    className={
                                                        styles['tip-icon']
                                                    }
                                                />
                                                {__('驳回说明')}
                                            </div>
                                            <div
                                                className={
                                                    styles['reject-text']
                                                }
                                            >
                                                <TextAreaView
                                                    initValue={htmlDecodeByRegExp(
                                                        details?.analysis
                                                            .confirm_remark ||
                                                            '',
                                                    )}
                                                    rows={1}
                                                    placement="end"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            <div className={styles['common-title']}>
                                <CommonTitle title={__('申请信息')} />
                            </div>
                            <Row className={styles['apply-info-row']}>
                                {getApplyInfo()}
                            </Row>
                            <div className={styles['common-title']}>
                                <CommonTitle title={__('分析资源')} />
                            </div>
                            {getAnalysisResource()}
                            <div className={styles['common-title']}>
                                <CommonTitle title={__('分析结论')} />
                            </div>
                            {getAnalysisConclusion()}
                        </div>

                        {/* 底部栏 */}
                        <div className={styles.footer}>
                            <Space>
                                <Button
                                    className={styles.btn}
                                    onClick={() => {
                                        onClose?.()
                                    }}
                                >
                                    {__('取消')}
                                </Button>
                                <Button
                                    className={styles.btn}
                                    onClick={() => {
                                        handleSave(ShareApplySubmitType.Draft)
                                    }}
                                >
                                    {__('暂存')}
                                </Button>
                                <Button
                                    type="primary"
                                    className={styles.btn}
                                    // loading={saveLoading}
                                    onClick={() => {
                                        handleSave(ShareApplySubmitType.Submit)
                                    }}
                                >
                                    {__('提交')}
                                </Button>
                            </Space>
                        </div>
                    </div>
                </div>
                {addResOpen && (
                    <AddResourceDrawer
                        open={addResOpen}
                        onClose={() => setAddResOpen(false)}
                        onOk={handleAddResOk}
                    />
                )}
            </div>
        </Drawer>
    )
}

export default Analysis
