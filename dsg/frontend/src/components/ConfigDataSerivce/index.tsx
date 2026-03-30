import { Button, Col, Form, message, Modal, Row, Space, Steps } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import {
    CheckCircleFilled,
    CloseCircleFilled,
    InfoCircleFilled,
    LeftOutlined,
} from '@ant-design/icons'
import classnames from 'classnames'
import { trim } from 'lodash'
import {
    createApiAuditFlow,
    createService,
    deleteInterfaceDraft,
    detailServiceOverview,
    formatError,
    getDataCatalogMountFrontend,
    getDatasheetView,
    getInterfaceDraft,
    getMainDepartInfo,
    getObjects,
    getRescDirDetail,
    PublishStatus,
    saveInterfaceDraft,
    updateService,
} from '@/core'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import { confirm } from '@/utils/modalHelper'
import { Architecture } from '../BusinessArchitecture/const'
import GlobalMenu from '../GlobalMenu'
import BasicInfoForm from './BasicInfoForm'
import ParmsConfigForm from './ParmsConfigForm'
import ResponseResult from './ResponseResult'
import ServiceTest from './ServiceTest'
import { defautData } from './const'
import __ from './locale'
import styles from './styles.module.less'

interface IProps {
    createModel?: 'wizard' | 'script'
    onClose?: () => void
    onOk?: (serviceId: string) => void
    catalogId?: string
}
const ConfigDataSerivce = ({
    createModel,
    onClose,
    onOk,
    catalogId,
}: IProps) => {
    const [current, setCurrent] = useState<number>(0)
    const [formData, setFormData] = useState<any>({})
    const baseForm = Form.useForm()[0]
    const paramForm = Form.useForm()[0]
    const responseForm = Form.useForm()[0]
    const testForm = Form.useForm()[0]
    const [searchParams, setSearchParams] = useSearchParams()
    const serviceId = searchParams.get('serviceId') || ''
    const model = searchParams.get('createModel') || createModel || ''
    const departmentId = searchParams.get('departmentId') || null
    const categoryId = searchParams.get('categoryId') || null
    const domainId = searchParams.get('domainId') || null
    const catlgId = searchParams.get('catlgId') || ''
    const orgNodeId = searchParams.get('orgNodeId') || ''
    // const model = searchParams.get('createModel') || ''
    const navigate = useNavigate()
    const [publishStatus, setPublishStatus] = useState<boolean>(false)
    const [departmentOptions, setDepartmentOptions] = useState<Array<any>>([])
    const [owner, setOwner] = useState<any>({})
    const [departmentOrOrg, setDepartmentOrOrg] = useState<any>({})
    const [isChanged, setIsChanged] = useState<boolean>(false)
    const [datasheet, setDatasheet] = useState<any>({})
    // 变更审核未通过，恢复到发布显示
    const [showErrorType, setShowErrorType] = useState<boolean>(false)
    // 存在草稿，恢复到发布显示
    const [showNormalType, setShowNormalType] = useState<boolean>(false)

    // 更新时间
    const [updateTime, setUpdateTime] = useState<string>('')

    // 更新人
    const [updateBy, setUpdateBy] = useState<string>('')

    const [auditAdvice, setAuditAdvice] = useState<string>('')
    const [interfaceStatus, setInterfaceStatus] = useState<PublishStatus>(
        PublishStatus.UNPUBLISHED,
    )

    const [saveLoading, setSaveLoading] = useState<boolean>(false)

    // const getDepartments = async () => {
    //     const res = await getObjects({
    //         id: '',
    //         is_all: true,
    //         type: Architecture.DEPARTMENT,
    //         limit: 0,
    //     })
    //     setDepartmentOptions(
    //         res.entries.map((department) => ({
    //             value: department.id,
    //             label: department.name,
    //         })),
    //     )
    // }

    const getMountResource = async () => {
        try {
            const mountRes = await getDataCatalogMountFrontend(catalogId!)
            const dataView = mountRes?.mount_resource?.find(
                (item) => item.resource_type === 1,
            )
            if (dataView) {
                setFormData({
                    ...defautData,
                    service_info: {
                        ...(defautData.service_info || {}),
                        data_view_id: dataView?.resource_id,
                        data_view_name: dataView?.name,
                    },
                    service_param: {
                        ...defautData.service_param,
                        create_model: model,
                    },
                })
            }
            // 获取库表详情后设置给dataSheet
            const ds = await getDatasheetView({
                form_view_ids: dataView?.resource_id,
            })
            setDatasheet(ds.entries[0])
        } catch (e) {
            formatError(e)
        }
    }

    useEffect(() => {
        if (catalogId) {
            getMountResource()
        }
    }, [catalogId])

    useEffect(() => {
        if (model) {
            // getDepartments()
            setFormData({
                ...defautData,
                service_info: {
                    ...defautData.service_info,
                    category: categoryId,
                    department: departmentId,
                    subject_domain_id: domainId,
                },
                service_param: {
                    ...defautData.service_param,
                    create_model: model,
                },
            })
        }
        if (serviceId) {
            initData()
        }

        // 从资源目录生成服务
        if (catlgId) {
            initCatlgData()
        }
    }, [])

    useEffect(() => {
        if (!serviceId) {
            queryMainDepartInfo()
        }
    }, [serviceId])

    const initCatlgData = async () => {
        try {
            const res = await getRescDirDetail(catlgId)
            const system = res.infos?.find((info) => info.info_type === 4)
                ?.entries?.[0]?.info_key
            setFormData({
                ...defautData,
                service_info: {
                    ...defautData.service_info,
                    service_name: res.title
                        .split('_')
                        .join('')
                        .split('-')
                        .join(''),
                    category: res.group_id || null,
                    department: res.orgcode,
                    departmentName: res.orgname,
                    data_range: 'city',
                    update_cycle: 'not_update',
                    rate_limiting: 0,
                    timeout: 60,
                    system,
                    owner_id: res.owner_id || null,
                    owner_name: res.owner_name,
                },
                service_param: {
                    ...defautData.service_param,
                    data_source_select_type: 'datacatalog',
                    create_model: model,
                    data_catalog: {
                        id: catlgId,
                        name: res.title,
                        code: res.code,
                    },
                },
                service_response: {
                    page_size: 1000,
                    rules: [],
                },
            })
            const depRes = await getObjects({
                id: '',
                is_all: true,
                type: Architecture.DEPARTMENT,
                limit: 0,
            })
            const deps = depRes.entries.map((department) => ({
                value: department.id,
                label: department.name,
            }))
            setDepartmentOptions(deps)
        } catch (error) {
            formatError(error)
        }
    }

    const initData = async () => {
        let detail
        const draftRes = await getInterfaceDraft(serviceId)

        if (draftRes) {
            detail = draftRes
            if (
                detail.service_info?.publish_status ===
                PublishStatus.CHANGE_REJECT
            ) {
                setShowErrorType(true)
            } else {
                setShowNormalType(true)
            }
            setInterfaceStatus(PublishStatus.PUBLISHED)
        } else {
            detail = await detailServiceOverview(serviceId)
            setInterfaceStatus(detail.service_info.publish_status)
        }

        const { service_info, service_param } = detail
        const data_view = {
            id: service_param.data_view_id || '',
            data_view_id: service_param.data_view_id || '',
            name: service_param.data_view_name || '',
            business_name: service_param.data_view_name || '',
            datasource_id: service_param.datasource_id || '',
            datasource_name: service_param.datasource_name,
        }
        setUpdateTime(service_info.update_time)
        setUpdateBy(service_info.update_by)
        setAuditAdvice(service_info?.audit_advice)

        setDatasheet(data_view)

        setFormData({
            ...detail,
            service_info: {
                ...detail.service_info,
                department: service_info.department.id || null,
                subject_domain_id: service_info.subject_domain_id || null,
                departmentName: service_info.department.name,
                developer: service_info.developer.id || null,
                owners:
                    service_info?.owners?.map((item) => item.owner_id) || [],
                data_view_id: service_param.data_view_id || '',
                data_view_name: service_param.data_view_name || '',
                service_path: service_info.service_path.replace(/[/]{1}/, ''),
            },
            service_param: {
                ...detail.service_param,
                data_source_select_type: 'custom',
            },
        })

        const depRes = await getObjects({
            id: '',
            is_all: true,
            type: Architecture.DEPARTMENT,
            limit: 0,
        })
        const deps = depRes.entries.map((department) => ({
            value: department.id,
            label: department.name,
        }))
        setDepartmentOptions(deps)
    }

    const onFinshCurrentForm = (values) => {
        switch (current) {
            case 0:
                setFormData({
                    ...formData,
                    service_info: {
                        ...formData?.service_info,
                        ...values,
                        // ...{ departmentOrOrg },
                    },
                    service_param: {
                        ...formData?.service_param,
                        data_view_id: datasheet?.id,
                        data_view_name: datasheet?.business_name,
                        datasource_id: datasheet?.datasource_id,
                        datasource_name: datasheet?.datasource_name,
                    },
                })
                setCurrent(1)
                break
            case 1:
                setFormData({
                    ...formData,
                    service_param: {
                        ...formData?.service_param,
                        ...values,
                        create_model: values?.script ? 'script' : 'wizard',
                        data_table: values?.data_table || null,
                        data_catalog: values?.data_catalog || null,
                    },
                })
                setCurrent(2)
                break
            case 2:
                setFormData({
                    ...formData,
                    service_response: {
                        ...formData?.service_response,
                        ...values,
                    },
                })
                setCurrent(3)
                break
            case 3:
                setFormData({
                    ...formData,
                    service_test: {
                        ...formData?.service_test,
                        ...values,
                    },
                })
                break
            default:
                break
        }
    }

    const publishService = async (values) => {
        try {
            setSaveLoading(true)
            let res: any
            const testFormData = testForm?.getFieldsValue()
            const saveParams = {
                ...formData,
                service_test: {
                    ...formData?.service_test,
                    ...testFormData,
                },
            }
            if (
                testFormData?.request_example &&
                testFormData?.response_example
            ) {
                if (serviceId) {
                    if (
                        interfaceStatus === PublishStatus.UNPUBLISHED ||
                        interfaceStatus === PublishStatus.PUB_REJECT
                    ) {
                        res = await updateService(serviceId, {
                            ...rebuildParams(saveParams),
                            is_temp: false,
                        })
                        await createApiAuditFlow({
                            service_id: serviceId || res?.service_id,
                            audit_type: 'af-data-application-publish',
                        })
                    } else {
                        res = await saveInterfaceDraft(serviceId, {
                            ...rebuildParams(saveParams),
                            is_temp: false,
                        })
                    }
                } else {
                    res = await createService({
                        ...rebuildParams(saveParams),
                        is_temp: false,
                    })
                    await createApiAuditFlow({
                        service_id: serviceId || res?.service_id,
                        audit_type: 'af-data-application-publish',
                    })
                    onOk?.(res?.service_id)
                }

                setPublishStatus(true)
                setIsChanged(false)
            } else {
                message.error(__('还未测试通过，请测试完成后进行发布！'))
            }
        } catch (ex) {
            const exInfo = ex?.data?.detail?.[0]
            if (exInfo?.message) {
                message.error(exInfo?.message)
            } else {
                formatError(ex)
                if (
                    ex?.data?.code ===
                    'DataApplicationService.AuditProcessInstance.AuditProcessNotExist'
                ) {
                    navigate('/dataService/interfaceService')
                }
            }
        } finally {
            setSaveLoading(false)
        }
    }
    /**
     * 设置变更状态
     */
    const setChangedStatus = () => {
        if (!isChanged) {
            setIsChanged(true)
        }
    }

    const handleDataSheetChange = () => {
        setFormData((prev) => ({
            ...prev,
            service_param: {
                ...prev.service_param,
                data_table_response_params: [],
                data_table_request_params: [],
            },
        }))
    }

    const steps = [
        {
            title: __('基本信息'),
            content: (
                <BasicInfoForm
                    form={baseForm}
                    needShowTip={
                        formData?.service_param?.data_table_request_params
                            ?.length ||
                        formData?.service_param?.data_table_response_params
                            ?.length
                    }
                    onDataSheetChange={handleDataSheetChange}
                    defaultServiceInfo={formData?.service_info || {}}
                    onFinsh={onFinshCurrentForm}
                    serviceId={serviceId}
                    departments={departmentOptions}
                    getOwner={(val) => setOwner(val)}
                    // getDepartmentOrOrg={(val) => setDepartmentOrOrg(val)}
                    getDatasheet={(val) => setDatasheet(val)}
                    onDataChange={setChangedStatus}
                    isShowChoose={!catalogId}
                />
            ),
        },
        {
            title: __('参数配置'),
            content: (
                <ParmsConfigForm
                    model="wizard"
                    onFinsh={onFinshCurrentForm}
                    defaultValues={formData?.service_param || {}}
                    form={paramForm}
                    onDataChange={setChangedStatus}
                />
            ),
        },
        {
            title: __('返回结果'),
            content: (
                <ResponseResult
                    form={responseForm}
                    onFinsh={onFinshCurrentForm}
                    defaultValues={formData?.service_response || {}}
                    responseData={
                        formData?.service_param?.data_table_response_params?.map(
                            (dataResponse) => dataResponse.en_name,
                        ) || []
                    }
                    onDataChange={setChangedStatus}
                />
            ),
        },
        {
            title: __('接口测试'),
            content: (
                <ServiceTest
                    form={testForm}
                    onFinsh={publishService}
                    defaultValues={formData?.service_test || {}}
                    serviceData={formData}
                    onDataChange={setChangedStatus}
                />
            ),
        },
    ]

    /**
     * 上一步
     */
    const nexStep = () => {
        switch (current) {
            case 0:
                baseForm.submit()

                break
            case 1:
                paramForm.submit()
                break
            case 2:
                responseForm.submit()
                break
            default:
                break
        }
    }

    const previousStep = () => {
        let values
        if (current > 0) {
            switch (current) {
                case 1:
                    values = paramForm.getFieldsValue()

                    setFormData({
                        ...formData,
                        service_param: {
                            ...formData?.service_param,
                            ...values,
                            create_model: values?.create_model || model,
                            data_table: values?.data_table || null,
                            data_catalog: values?.data_catalog || null,
                        },
                        service_info: {
                            ...formData?.service_info,
                            data_view_id: datasheet?.id,
                            data_view_name: datasheet?.business_name,
                            datasource_id: datasheet?.datasource_id,
                            datasource_name: datasheet?.datasource_name,
                        },
                    })
                    setCurrent(2)
                    break
                case 2:
                    values = responseForm.getFieldsValue()
                    setFormData({
                        ...formData,
                        service_response: {
                            ...formData?.service_response,
                            ...values,
                        },
                    })
                    setCurrent(3)
                    break
                case 3:
                    values = testForm.getFieldsValue()
                    setFormData({
                        ...formData,
                        service_test: {
                            ...formData?.service_test,
                            ...values,
                        },
                    })
                    break
                default:
                    break
            }
            setCurrent(current - 1)
        }
    }

    const handleConfirm = () => {
        if (onClose) {
            onClose()
            // onOk?.()
        } else {
            navigate('/dataService/interfaceService')
        }
    }
    const onSave = async () => {
        let saveParams
        try {
            switch (current) {
                case 0:
                    if (
                        baseForm.getFieldsValue().service_name &&
                        baseForm.getFieldsValue().department
                    ) {
                        saveParams = {
                            ...formData,
                            service_info: {
                                ...formData?.service_info,
                                ...baseForm.getFieldsValue(),
                            },
                            service_param: {
                                ...formData?.service_param,
                                data_view_id: datasheet?.id,
                                data_view_name: datasheet?.business_name,
                                datasource_id: datasheet?.datasource_id,
                                datasource_name: datasheet?.datasource_name,
                            },
                        }
                        break
                    } else {
                        baseForm.validateFields(['service_name', 'department'])
                        return
                    }
                case 1:
                    saveParams = {
                        ...formData,
                        service_param: {
                            ...formData?.service_param,
                            ...paramForm.getFieldsValue(),
                        },
                    }
                    break
                case 2:
                    saveParams = {
                        ...formData,
                        service_response: {
                            ...formData?.service_response,
                            ...responseForm.getFieldsValue(),
                        },
                    }
                    break
                case 3:
                    saveParams = {
                        ...formData,
                        service_test: {
                            ...formData?.service_test,
                            ...testForm?.getFieldsValue(),
                        },
                    }
                    break
                default:
                    break
            }
            if (serviceId) {
                if (
                    interfaceStatus === PublishStatus.UNPUBLISHED ||
                    interfaceStatus === PublishStatus.PUB_REJECT
                ) {
                    await updateService(serviceId, {
                        ...rebuildParams(saveParams),
                        is_temp: true,
                    })
                } else {
                    await saveInterfaceDraft(serviceId, {
                        ...rebuildParams(saveParams),
                        is_temp: true,
                    })
                }
            } else {
                await createService({
                    ...rebuildParams(saveParams),
                    is_temp: true,
                })
            }
            setIsChanged(false)
            message.success('保存成功')
            navigate('/dataService/interfaceService')
        } catch (ex) {
            const exInfo = ex?.data?.detail?.[0]
            if (exInfo?.message) {
                message.error(exInfo?.message)
            } else {
                formatError(ex)
            }
        }
    }

    const rebuildParams = (params: {
        service_info: any
        service_param: any
        service_response: any
        service_test: any
    }) => {
        const { service_info, service_param, service_response, service_test } =
            params

        return {
            service_info: {
                datasheet_id: service_info.datasheet_id,
                owners: service_info?.owners?.map((id) => ({ owner_id: id })),
                service_type: 'service_generate',
                category: {
                    id:
                        service_info?.category !== undefined
                            ? service_info.category
                            : null,
                },
                department: { id: service_info?.department },
                description:
                    service_info?.description !== undefined
                        ? service_info.description
                        : null,
                developer: {
                    id:
                        service_info?.developer !== undefined
                            ? service_info.developer
                            : null,
                },
                http_method: service_info.http_method,
                // interface_type: service_info.interface_type,
                market_publish: service_info.market_publish,
                // network_region: service_info.network_region,
                protocol: service_info.protocol,
                rate_limiting: service_info?.rate_limiting
                    ? Number(service_info.rate_limiting)
                    : null,
                return_type: service_info.return_type,
                // service_instance: 'default_instance',
                service_name:
                    service_info?.service_name !== undefined
                        ? trim(service_info.service_name)
                        : null,
                service_path: service_info?.service_path
                    ? `/${service_info.service_path}`
                    : '',
                subject_domain_id: service_info?.subject_domain_id || '',
                tags: service_info.tags?.map((tag) => ({ id: tag })),
                timeout: service_info?.timeout
                    ? Number(service_info.timeout)
                    : null,
                info_system_id: service_info?.info_system_id,
                apps_id: service_info?.apps_id,
                category_info: service_info?.category_info,
            },
            service_param: {
                ...service_param,
                data_catalog: service_param?.data_catalog,
                data_source:
                    service_param?.data_source !== undefined
                        ? JSON.parse(service_param.data_source)
                        : null,
                data_source_select_type: service_param.data_source_select_type,
                data_table: {
                    table_name:
                        service_param?.data_table !== undefined
                            ? service_param.data_table
                            : null,
                },
                data_table_request_params:
                    service_param.data_table_request_params.map(
                        (requestData) => ({
                            ...requestData,
                            cn_name:
                                requestData?.cn_name !== undefined
                                    ? requestData.cn_name
                                    : null,
                            description:
                                requestData?.description !== undefined
                                    ? requestData.description
                                    : null,
                            default_value:
                                requestData?.default_value !== undefined
                                    ? requestData.default_value?.toString()
                                    : null,
                        }),
                    ),
                data_table_response_params:
                    service_param.data_table_response_params.map(
                        (responseData, index) => ({
                            ...responseData,
                            cn_name:
                                responseData?.cn_name !== undefined
                                    ? responseData.cn_name
                                    : null,
                            description:
                                responseData?.description !== undefined
                                    ? responseData.description
                                    : null,
                            default_value:
                                responseData?.default_value !== undefined
                                    ? responseData.default_value?.toString()
                                    : null,
                            sequence: index + 1,
                        }),
                    ),
                script:
                    service_param?.script !== undefined
                        ? service_param.script
                        : null,
            },
            service_response: {
                ...service_response,
                page_size:
                    service_response?.page_size !== undefined
                        ? Number(service_response.page_size)
                        : null,
            },
            service_test,
        }
    }

    /**
     * 恢复的已发布版本
     */
    const resetToPublishVersion = async () => {
        try {
            await deleteInterfaceDraft(serviceId)
            setShowErrorType(false)
            setShowNormalType(false)
            message.success(__('操作成功'))
            initData()
        } catch (err) {
            formatError(err)
        }
    }
    const queryMainDepartInfo = async () => {
        try {
            // let department_id = ''
            // 获取当前部门
            // const res = await getCurUserDepartment()
            // const [dept] = res
            // if (orgNodeId === dept?.id) {
            //     department_id = orgNodeId
            // } else {
            const res = await getMainDepartInfo()
            // }
            setFormData((pre) => ({
                ...pre,
                service_info: {
                    ...(pre.service_info || {}),
                    department: res?.id,
                },
            }))
        } catch (e) {
            formatError(e)
        }
    }

    return (
        <div className={styles.configService}>
            <div className={styles.configServiceTitle}>
                <Row style={{ width: '100%' }}>
                    <Col span={6}>
                        <div className={styles.returnContainer}>
                            <GlobalMenu />
                            <Button
                                icon={<LeftOutlined />}
                                type="text"
                                className={styles.backBtn}
                                onClick={() => {
                                    if (isChanged) {
                                        ReturnConfirmModal({
                                            onCancel: () => {
                                                if (onClose) {
                                                    onClose()
                                                    return
                                                }
                                                navigate(
                                                    catlgId
                                                        ? '/dataService/dataContent'
                                                        : '/dataService/interfaceService',
                                                )
                                            },
                                        })
                                    } else {
                                        if (onClose) {
                                            onClose()
                                            return
                                        }
                                        navigate(
                                            catlgId
                                                ? '/dataService/dataContent'
                                                : '/dataService/interfaceService',
                                        )
                                    }
                                }}
                            >
                                {__('返回')}
                            </Button>
                            <span className={styles.titleLine} />
                            <span className={styles.title}>
                                {serviceId
                                    ? __('编辑接口服务')
                                    : __('新建接口服务')}
                            </span>
                        </div>
                    </Col>
                    <Col span={12}>
                        <div className={styles.stepsBox}>
                            <Steps current={current} items={steps} />
                        </div>
                    </Col>
                    <Col span={6} />
                </Row>
            </div>

            <div className={styles.configServiceContiner}>
                {showNormalType ? (
                    <div className={styles.textNormalContainer}>
                        <div className={styles.normalIcon}>
                            <InfoCircleFilled />
                        </div>
                        <div>
                            {__('当前草稿 ${time} 由 ${name}产生', {
                                time: updateTime,
                                name: updateBy,
                            })}
                        </div>
                        <div>
                            <Button
                                type="link"
                                onClick={(e) => {
                                    //
                                    confirm({
                                        okText: __('确定'),
                                        cancelText: __('取消'),
                                        onOk: () => {
                                            resetToPublishVersion()
                                        },
                                        title: __('确认要恢复吗？'),
                                        content:
                                            __('恢复后，草稿内容将无法找回'),
                                    })
                                }}
                            >
                                {__('恢复到已发布的内容')}
                            </Button>
                        </div>
                    </div>
                ) : null}

                {showErrorType ? (
                    <div className={styles.textErrorContainer}>
                        <div className={styles.errorIcon}>
                            <CloseCircleFilled />
                        </div>
                        <div className={styles.errorContent}>
                            <span className={styles.textLabel}>
                                {__('变更未通过审批意见：')}
                            </span>
                            <span className={styles.text} title={auditAdvice}>
                                {auditAdvice}
                            </span>
                        </div>
                        <div>
                            <Button
                                type="link"
                                onClick={(e) => {
                                    //
                                    confirm({
                                        okText: __('确定'),
                                        cancelText: __('取消'),
                                        onOk: () => {
                                            resetToPublishVersion()
                                        },
                                        title: __('确认要恢复吗？'),
                                        content: __(
                                            '恢复后，状态将变成已发布，变更审核未通过的内容将无法找回',
                                        ),
                                    })
                                }}
                            >
                                {__('恢复到已发布的内容')}
                            </Button>
                        </div>
                    </div>
                ) : null}
                <div
                    className={classnames(
                        styles.configServiceBody,
                        showErrorType || showNormalType
                            ? styles.configServiceErrorHeight
                            : styles.configServiceNormalHeight,
                    )}
                >
                    <div className={styles.configServiceContent}>
                        <div className={styles.formBody}>
                            {steps[current].content}
                        </div>
                    </div>
                    <div className={styles.footer}>
                        <Space>
                            {/* <Button
                            className={styles.btn}
                            onClick={() => {
                                appProps?.navigate(
                                    getActualUrl(
                                        '/dataService/interfaceService',
                                    ),
                                )
                            }}
                        >
                            {__('取消')}
                        </Button> */}
                            <Button className={styles.btn} onClick={onSave}>
                                {__('暂存')}
                            </Button>
                            {current > 0 ? (
                                <Button
                                    icon={<LeftOutlined />}
                                    type="link"
                                    className={styles.upBtn}
                                    onClick={previousStep}
                                >
                                    {__('上一步')}
                                </Button>
                            ) : null}
                            {current === 3 ? (
                                <Button
                                    type="primary"
                                    className={styles.publishBtn}
                                    onClick={() => {
                                        testForm.submit()
                                    }}
                                    loading={saveLoading}
                                >
                                    {__('发布')}
                                </Button>
                            ) : (
                                <Button
                                    type="primary"
                                    className={styles.btn}
                                    onClick={nexStep}
                                >
                                    {__('下一步')}
                                </Button>
                            )}
                        </Space>
                    </div>
                </div>
            </div>

            {publishStatus ? (
                <Modal
                    open
                    footer={null}
                    closable={false}
                    maskClosable={false}
                    width={484}
                >
                    <div className={styles.resultContainer}>
                        <div className={styles.resultTitle}>
                            <CheckCircleFilled
                                style={{ color: '#52C41A', fontSize: '72px' }}
                            />
                        </div>
                        <span className={styles.resultTitleInfo}>
                            {__('提交成功')}
                        </span>
                        <div className={styles.resultContent}>
                            <div className={styles.content}>
                                {__('已提交至审核方')}
                            </div>
                            <div className={styles.content}>
                                {__('审核通过后自动发布接口服务')}
                            </div>
                        </div>
                        <div className={styles.resultbButton}>
                            <Button
                                type="primary"
                                style={{
                                    width: '96px',
                                    height: '40px',
                                    fontSize: '14px',
                                }}
                                onClick={handleConfirm}
                            >
                                {__('知道了')}
                            </Button>
                        </div>
                    </div>
                </Modal>
            ) : null}

            {/* <SqlEditor /> */}
        </div>
    )
}

export default ConfigDataSerivce
