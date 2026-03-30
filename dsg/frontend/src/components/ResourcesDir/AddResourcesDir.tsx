import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import classnames from 'classnames'
import moment from 'moment'
import { Steps, Button, message, Tooltip, Space, Row, Col } from 'antd'
import { isArray, isNumber, isString } from 'lodash'
import { LeftOutlined } from '@ant-design/icons'
import { getActualUrl, useQuery, OperateType } from '@/utils'
import styles from './styles.module.less'
import __ from './locale'
import BaseInfo from './BaseInfo'
import {
    addResources,
    editResources,
    getResourcesDetails,
    formatError,
    createAuditFlow,
    getDataViewBaseInfo,
    getDatasheetViewDetails,
    detailServiceOverview,
    getInfoItems,
    getDataCatalogMount,
    getPolicyProcessList,
    getMainDepartInfo,
    getCurUserDepartment,
    getFileCatalogDetail,
} from '@/core'
import { ResourcesDirOutlined } from '@/icons'
import GlobalMenu from '../GlobalMenu'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import MountResource from './MountResource'
import {
    fieldList,
    EditResourcesType,
    ResourceType,
    typeOptoins,
    fieldType,
    FormatDataType,
    updateBaseInfoKeys,
    upPublishedList,
    ShareTypeEnum,
    OpenTypeEnum,
    publishStatus,
} from './const'
import { changeFormatToType } from '../IndicatorManage/const'
import InfoItemEditTable from './FieldsTable/InfoItemEditTable'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { ColumnKeys } from './MountResource/ApiEditTable'
import { useResourcesCatlogContext } from './ResourcesCatlogProvider'
import { PolicyType } from '../AuditPolicy/const'
import {
    compareObjectArraysIsChange,
    compareObjIsChangeByKeys,
    getTimeRangeStr,
} from './helper'

/**
 * 新建、编辑
 * @param rowId: 列表ID
 * @returns
 */
interface AddResourcesDirProps {
    onClose?: () => void
    onOk?: () => void
    resId?: string
}
const AddResourcesDir: React.FC<AddResourcesDirProps> = ({
    onClose,
    resId,
    onOk,
}) => {
    const location = useLocation()
    const { resourceData } = location.state || {}
    const query = useQuery()
    const fieldsTableRef: any = useRef()
    // 列表目录id--不能为空
    const rowId = query.get('id') || ''
    const draftId = query.get('draftId') || ''
    const domainId = query.get('domainId') || undefined
    const resourcesName = query.get('resourcesName') || undefined
    const type = query.get('type') || undefined
    const tabKey = query.get('tabKey') || undefined
    // 资源类型 -- 1：库表  2：接口  待编目参数，已编目不传
    const resourcesType = query.get('resourcesType') || undefined
    // 值为 true：空目录再次编目
    const isEmptyCatalogEdit = query.get('isEmptyCatalogEdit') || ''
    const orgNodeId = query.get('orgNodeId') || ''
    const [loading, setLoading] = useState<boolean>(false)

    const {
        setEmptyCatalogFields,
        mountResourceData,
        setMountResourceData,
        emptyCatalogMapFields,
        setEmptyCatalogMapFields,
        isFileRescType,
        setColumnData,
        setDataViewFields,
    } = useResourcesCatlogContext()

    const [stepsCurrent, setStepsCurrent] = useState(0)
    // 信息项字段
    const [fieldData, setFieldData] = useState<any[]>([])
    const [editCheckedMountResources, setEditCheckedMountResources] = useState<
        any[]
    >([])
    const [detailsMountResources, setDetailsMountResources] = useState<any[]>(
        [],
    )
    // 基本信息Form
    const [baseInfoForm, setBaseInfoForm] = useState<any>({})
    // 信息项Form
    const [infosForm, setInfosForm] = useState<any>()
    // 下一步按钮禁用
    const [nextBtnDisabledTips, setNextBtnDisabledTips] = useState<string>('')
    const [isChanged, setIsChanged] = useState<boolean>(false)
    const [isShowFooter, setIsShowFooter] = useState(true)
    const [primaryRequired, setPrimaryRequired] = useState(false)
    const [editNoinfoitems, setEditNoinfoitems] = useState<any[]>([])
    const [resDetailsInfo, setResDetailsInfo] = useState<any>()
    const [mountResourceForm, setMountResourceForm] = useState<any>({})
    // 映射字段信息，用于信息项
    const [selectMapInfo, setSelectMapInfo] = useState<any[]>()
    const [categorysInfo, setCategorysInfo] = useState<any>([])
    const [isClearOrgTree, setIsClearOrgTree] = useState<boolean>(false)
    const [isEmptyCatalog, setIsEmptyCatalog] = useState<boolean>(false)
    const [showSecretDataTips, setShowSecretDataTips] = useState<boolean>(true)
    const [selectedFormName, setSelectedFormName] = useState<string>('')
    const [mainDepartId, setMainDepartId] = useState<string>('')

    const navigator = useNavigate()

    const baseInfoRef: any = useRef()
    const infoItemsRef: any = useRef()
    const mountResourceRef: any = useRef()
    const [{ using, governmentSwitch }] = useGeneralConfig()

    useEffect(() => {
        if (emptyCatalogMapFields?.length && !fieldData?.length) {
            setFieldData(emptyCatalogMapFields)
        }
    }, [emptyCatalogMapFields])

    const governmentStatus = useMemo(() => {
        return governmentSwitch.on
    }, [governmentSwitch])

    useEffect(() => {
        setBaseInfoForm({
            ...baseInfoForm,
            mount_resources_type: 1,
            publish_flag: 1,
            operation_authorized: 1,
        })
        setInfosForm([])
        setStepsCurrent(0)
        if (resourceData?.length) {
            getMountResourceData()
            return
        }
        if (resourcesType) {
            if (resourcesType === ResourceType.DataView.toString()) {
                getDataViewDetails(rowId)
            } else if (resourcesType === ResourceType.Api.toString()) {
                getApiDetails(rowId)
            } else if (resourcesType === ResourceType.File.toString()) {
                getFileDetail(rowId)
            }
        } else if (type === OperateType.EDIT) {
            getDetails()
        }
        // setNextBtnDisabled(!rowId)
    }, [rowId, type, resourceData])

    useEffect(() => {
        let domain_id: any[]
        let selectedDomainTreeNode: any[]
        if (domainId) {
            domain_id = [{ label: resourcesName, value: domainId }]
            selectedDomainTreeNode = [
                {
                    id: domainId,
                    name: resourcesName,
                },
            ]
            setBaseInfoForm({
                ...baseInfoForm,
                domain_id,
                selectedDomainTreeNode,
            })
        }
    }, [domainId])

    /**
     * 设置变更状态
     */
    const setChangedStatus = () => {
        if (!isChanged) {
            setIsChanged(true)
        }
    }

    useEffect(() => {
        if (!mountResourceData?.length && isEmptyCatalogEdit !== 'true') {
            setFieldData([])
            // setNextBtnDisabledTips(__('请选择挂载资源'))
        } else {
            setNextBtnDisabledTips('')
        }
        let department_id: string = ''
        if (!mountResourceData?.length) {
            department_id = mainDepartId
        } else {
            department_id = mountResourceData[0].department_id
        }
        if (department_id && type === 'create') {
            setBaseInfoForm((pre) => ({
                ...pre,
                department_id,
            }))
        }
    }, [mountResourceData, mainDepartId])

    // 多资源编目
    const getMountResourceData = async () => {
        setMountResourceData(resourceData)
        await getDetails()
        // 包含库表
        if (
            resourceData?.find(
                (item) => item.resource_type === ResourceType.DataView,
            )?.resource_id
        ) {
            getDataViewDetails(rowId)
        } else {
            // 多个文件
            getFileDetail(rowId)
        }
    }

    const getResourceDetails = async (id: string) => {
        // const res = await getDatasheetViewDetails(id)
        // setMountResourceData([{ resource_id: id, resource_type: 1 }])
        getDataViewDetails(id)
    }

    useEffect(() => {
        if (resId) {
            getResourceDetails(resId)
            queryMainDepartInfo()
        }
    }, [resId])

    useEffect(() => {
        if (type === 'create') {
            queryMainDepartInfo()
        }
    }, [])

    const stepsItems = [
        {
            key: 1,
            title: '挂接资源',
            content: (
                <MountResource
                    ref={mountResourceRef}
                    defaultForm={mountResourceForm}
                    baseInfoForm={baseInfoForm}
                    onChange={setMountResourceForm}
                    onSelectMapInfo={setSelectMapInfo}
                    initCheckedItems={mountResourceData}
                    editInitCheckedItems={editCheckedMountResources}
                    getselectedFormName={setSelectedFormName}
                />
            ),
            isshow: true,
        },
        {
            key: 2,
            title: '信息项',
            content: (
                <InfoItemEditTable
                    value={fieldData}
                    ref={fieldsTableRef}
                    onChange={(val) => {
                        setFieldData(val)
                        setEmptyCatalogMapFields(val)
                    }}
                    primaryRequired={primaryRequired}
                    isEmptyCatalog={isEmptyCatalog}
                    mapFieldInfo={selectMapInfo}
                    formName={selectedFormName}
                    showSecretDataTips={showSecretDataTips}
                    setShowSecretDataTips={setShowSecretDataTips}
                    resId={resId}
                />
            ),
            isshow: !isFileRescType,
        },
        {
            key: 3,
            title: '基本信息',
            content: (
                <BaseInfo
                    fieldData={fieldData}
                    defaultForm={baseInfoForm}
                    optionsType={type}
                    ref={baseInfoRef}
                    onDataChanged={setChangedStatus}
                    onDataUpdate={() => getDetails(true)}
                    isClearOrgTree={isClearOrgTree}
                    onClearOrgTree={setIsClearOrgTree}
                    applyScopeId="00000000-0000-0000-0000-000000000002"
                />
            ),
            isshow: true,
        },
    ]?.filter((item) => item.isshow)

    const back = () => {
        if (isChanged) {
            ReturnConfirmModal({
                onCancel: () =>
                    handleCancel(
                        tabKey || resourcesType
                            ? EditResourcesType.AllResources
                            : EditResourcesType.Edited,
                    ),
            })
        } else {
            handleCancel(
                tabKey || resourcesType
                    ? EditResourcesType.AllResources
                    : EditResourcesType.Edited,
            )
        }
    }

    const handleCancel = (key: EditResourcesType) => {
        const backUrl =
            query.get('backUrl') || `/dataService/dataContent?tabKey=${key}`
        navigator(backUrl)
    }

    /**
     * 步骤条
     * @param stepsType: 类型 next 下一步 prev 上一步
     * @returns
     */
    const stepsOptions = async (stepsType: string) => {
        let contineStep = false
        const baseInfo = {
            ...baseInfoForm,
            ...baseInfoRef?.current?.getForm(),
        }
        const needSchedulePlan: boolean =
            governmentStatus && !isFileRescType && mountResourceData?.length > 0
        switch (stepsItems[stepsCurrent]?.key) {
            case 1:
                setIsEmptyCatalog(!mountResourceData?.length)
                contineStep = needSchedulePlan
                    ? mountResourceRef?.current?.getFormAndValidate()
                    : true
                break
            // 校验参数
            // if (stepsType === 'prev') {
            //     await baseInfoRef?.current
            //         ?.getFormAndValidate()
            //         .then(() => {
            //             contineStep = true
            //         })
            //         .catch(() => {
            //             contineStep = false
            //         })
            // }
            // if (contineStep) {
            // 保存参数
            case 2: {
                const { validateStatus, list } =
                    fieldsTableRef?.current?.onValidate() || {}
                if (
                    !list?.filter((item) => item.isSelectedFlag)?.length &&
                    mountResourceData?.find(
                        (o) => o.resource_type === ResourceType.DataView,
                    )?.resource_id
                ) {
                    message.error(__('请至少选择一条信息项'))
                    return
                }
                contineStep = validateStatus
                if (!list?.length && !mountResourceData?.length) {
                    contineStep = true
                }
                break
            }
            case 3:
                if (baseInfo?.business_matters?.length) {
                    baseInfo.business_matters =
                        baseInfoRef?.current?.relatedMattersList
                }
                setBaseInfoForm(baseInfo)
                setCategorysInfo(baseInfoRef?.current?.categorys)
                // updatFieldData(baseInfo)
                // setPrimaryRequired(baseInfo?.sync_mechanism === 1)
                contineStep = true
                break
            default:
                break
        }
        if (stepsType === 'next' && contineStep) {
            setStepsCurrent(stepsCurrent + 1)
        } else if (stepsType === 'prev') {
            setStepsCurrent(stepsCurrent - 1)
        }
    }

    // 提交
    /**
     * @param submitType stage:暂存;publish:发布;add:添加
     * @param list 信息项
     */
    const onFinish = async (submitType: string, list: any) => {
        const isPublish = submitType === 'publish'
        setInfosForm(infoItemsRef?.current?.data)
        const [mountInfo] = mountResourceData
        const lists = !mountResourceData?.length
            ? list
            : list?.filter((item) => item.isSelectedFlag)
        const columns = lists?.map((item) => {
            const id =
                editNoinfoitems?.find(
                    (o) => o.technical_name === item.technical_name,
                )?.id ||
                (item.id && !Number.isNaN(Number(item.id))
                    ? item.id
                    : undefined)
            return {
                ...item,
                timestamp_flag: item.timestamp_flag || 0,
                primary_flag: item.primary_flag || 0,
                // 未添加的信息项不传id，已编目信息项传id，已编目后端返回雪花id字符串
                id,
                isSelectedFlag: undefined,
                errorTips: undefined,
                changeSource: undefined,
                data_length:
                    item.data_length || item.data_length === '0'
                        ? Number(item.data_length)
                        : undefined,
                data_precision:
                    item.data_type === fieldType.decimal ? 0 : undefined,
            }
        })
        if (
            !columns?.length &&
            isPublish &&
            mountResourceData?.find(
                (o) => o.resource_type === ResourceType.DataView,
            )?.resource_id
        ) {
            message.error(__('请至少选择一条信息项'))
            return
        }
        if (isPublish && isFileRescType) {
            let contineStep: boolean = false
            await baseInfoRef?.current
                ?.getFormAndValidate()
                .then(() => {
                    contineStep = true
                })
                .catch(() => {
                    contineStep = false
                })
            if (!contineStep) return
        }
        const baseInfo = {
            ...baseInfoForm,
            ...baseInfoRef?.current?.getForm(),
            business_matters: baseInfoRef?.current?.relatedMattersList?.map(
                (o) => o.id || o,
            ),
        }
        const categorys = categorysInfo?.length
            ? categorysInfo
            : baseInfoRef?.current?.categorys
        const category_node_ids: string[] = []
        categorys.forEach((it, index) => {
            const val: string = baseInfo?.[`category_node_ids_${it.id}`]
            if (val) {
                category_node_ids.unshift(val)
                delete baseInfo[`category_node_ids_${it.id}`]
            }
        })
        if (baseInfo?.time_range && isArray(baseInfo?.time_range)) {
            baseInfo.time_range = getTimeRangeStr(baseInfo?.time_range)
        }
        let mount_resources = mountResourceData
        if (governmentStatus) {
            mount_resources = mount_resources?.map((item) => {
                const schedulingInfo = {
                    scheduling_plan: mountResourceForm?.scheduling_plan,
                    time: mountResourceForm?.time,
                    interval: Number(mountResourceForm?.interval) || undefined,
                }
                return item.resource_type === ResourceType.DataView
                    ? {
                          ...item,
                          ...schedulingInfo,
                      }
                    : item
            })
        }
        const subject_id = baseInfo?.subject_id?.map((sItem) =>
            isString(sItem) ? sItem : sItem?.value,
        )
        const submitForm = {
            // 基本信息
            ...baseInfo,
            columns,
            subject_id,
            mount_resources,
            category_node_ids,
        }
        // // 前2步不需要信息项参数
        // if (stepsCurrent < 2) {
        //     delete submitForm.columns
        // }

        try {
            setLoading(true)
            const isMountResourcesChange =
                !!detailsMountResources?.length &&
                JSON.stringify(
                    detailsMountResources?.map((o) => o.resource_id),
                ) !== JSON.stringify(mount_resources?.map((o) => o.resource_id))
            const isAudit =
                compareObjectArraysIsChange(columns, editNoinfoitems) ||
                compareObjectArraysIsChange(
                    category_node_ids,
                    baseInfoForm.category_infos?.map((o) => o.category_node_id),
                ) ||
                compareObjIsChangeByKeys(
                    submitForm,
                    {
                        ...baseInfoForm,
                        time_range:
                            baseInfoForm?.time_range &&
                            isArray(baseInfoForm?.time_range)
                                ? getTimeRangeStr(baseInfoForm?.time_range)
                                : baseInfoForm?.time_range,
                    },
                    updateBaseInfoKeys,
                ) ||
                isMountResourcesChange ||
                !!draftId ||
                upPublishedList.includes(baseInfoForm?.publish_status)

            let res: any
            const obj = rowId
                ? { ...submitForm, catalog_id: rowId, update_only: !isAudit }
                : { ...submitForm, update_only: !isAudit }
            // 发布使用put接口，需要校验参数，暂存使用post接口，不需要校验参数
            if (isPublish) {
                res = await editResources(obj)
            } else {
                // 待编目不传catalog_id
                res = await addResources(obj)
            }
            if (!isPublish) {
                message.success(
                    submitType === 'stage' ? '暂存成功' : '编目成功',
                )
            }
            // } else {
            //     delete submitForm.mount_resources
            //     res = await editResources(submitForm)
            //     if (!isPublish) {
            //         message.success('编目成功')
            //     }
            // }
            const publishedStatus = [
                publishStatus.Published,
                publishStatus.ChangeReject,
            ]
            if (isPublish && isAudit) {
                // 根据id获取详情，非草稿详情
                const detailsRes = await getResourcesDetails({
                    catalogID: rowId,
                })
                await createAuditFlow({
                    catalogID: res?.id,
                    flowType: publishedStatus.includes(
                        detailsRes?.publish_status,
                    )
                        ? PolicyType.CatalogChange
                        : PolicyType.CatalogPublish,
                })
                const process = await getPolicyProcessList({
                    audit_type: 'af-data-catalog-publish',
                })
                message.success(process?.length ? '审核发起成功' : '发布成功')
            }
            if (onClose) {
                onClose()
                onOk?.()
            } else {
                setTimeout(() => {
                    handleCancel(
                        (tabKey as EditResourcesType) ||
                            EditResourcesType.Edited,
                    )
                }, 300)
            }
        } catch (err) {
            if (err?.data?.code === 'DataCatalog.Public.NoAuditDefFoundError') {
                message.error({
                    content: __('审核发起失败，未找到匹配的审核流程'),
                    duration: 5,
                })

                setTimeout(() => {
                    handleCancel(
                        (tabKey as EditResourcesType) ||
                            EditResourcesType.Edited,
                    )
                }, 300)
            } else if (
                err?.data?.code ===
                'DataCatalog.Public.ConfigCenterDepOwnerUsersRequestErr'
            ) {
                message.error({
                    content: err?.data?.description,
                    duration: 5,
                })
            } else {
                formatError(err)
            }
        } finally {
            setLoading(false)
        }
    }

    // 编辑 -- 获取编辑参数
    /**
     * @param isCancel 撤销草稿后，更新参数
     */
    const getDetails = async (isCancel?: boolean) => {
        if (!rowId) return
        const res = await getResourcesDetails({
            catalogID: isCancel ? rowId : draftId || rowId,
        })
        const infoitemsRes = await getInfoItems(draftId || rowId, { limit: 0 })
        const infoitemsColumns = infoitemsRes?.columns?.map((item) => ({
            ...item,
            shared_type: item.shared_type === 0 ? undefined : item.shared_type,
            open_type: item.open_type === 0 ? undefined : item.open_type,
            isSelectedFlag: true,
        }))
        setFieldData(infoitemsColumns)
        setColumnData(infoitemsColumns)
        const mountRes = await getDataCatalogMount(draftId || rowId)
        setDetailsMountResources(mountRes?.mount_resource)
        const categorys = res?.category_infos
        // 处理自定义类目数据
        const categoryInfo = {}
        categorys?.forEach((item) => {
            categoryInfo[`category_node_ids_${item.category_id}`] =
                item.category_node_id
        })
        const baseInfo = {
            ...baseInfoForm,
            ...res,
            ...categoryInfo,
            subject_id: res?.subject_info?.map((item) => item.subject_id),
        }
        if (baseInfo?.time_range) {
            baseInfo.time_range = res?.time_range
                ?.split(',')
                ?.map((item) => (item ? moment(item, 'YYYY-MM-DD') : null))
        }
        setBaseInfoForm(baseInfo)
        setEditNoinfoitems(infoitemsColumns)
        const dataViewResource = mountRes?.mount_resource?.find(
            (o) => o.resource_type === ResourceType.DataView,
        )
        const resource_id = dataViewResource?.resource_id
        setSelectedFormName(dataViewResource?.name || '')
        if (resource_id) {
            if (governmentStatus) {
                setMountResourceForm(dataViewResource)
            }
            getDataViewDetails(resource_id, infoitemsColumns || [])
            // } else if (res.resource_type === ResourceType.Api) {
            //     getApiDetails(
            //         resource_id,
            //         infoitemsColumns || [],
            //         mountRes?.mount_resource?.[0],
            //     )
        } else if (
            res.resource_type === ResourceType.File ||
            mountRes?.mount_resource?.[0]?.resource_id === ResourceType.File
        ) {
            getFileDetail(mountRes?.mount_resource?.[0]?.resource_id)
        }

        setMountResourceData(mountRes?.mount_resource)
        setEditCheckedMountResources(mountRes?.mount_resource)
    }

    const getDataViewDetails = async (id: string, columns?: any[]) => {
        if (!id) return
        try {
            const res = await getDataViewBaseInfo(id)
            const resView = await getDatasheetViewDetails(id)
            setResDetailsInfo(res)
            const name = res?.business_name
            const code = res?.uniform_catalog_code
            const department = res?.department
            const department_id = res?.department_id
            const info = {
                source_department: department,
                source_department_id: department_id,
            }
            setBaseInfoForm((pre) => {
                return !columns
                    ? { ...pre, ...info, name }
                    : { ...pre, ...info }
            })
            // 存在resourceData，为多资源编目，不操作挂载资源
            if (!resourceData?.length && type !== 'edit' && !resId) {
                setMountResourceData([
                    {
                        resource_id: id,
                        name,
                        code,
                        resource_type: 1,
                        department,
                    },
                ])
            }
            if (resId) {
                setMountResourceData([
                    {
                        resource_id: id,
                        resource_type: 1,
                        department,
                        department_id,
                    },
                ])
            }
            // 源字段需过滤编目已选字段
            const orginFields = resView?.fields
                ?.filter(
                    (item) =>
                        !columns
                            ?.map((it) => it.technical_name)
                            ?.includes(item.technical_name),
                )
                ?.map((item, index) => {
                    const dataType = item.data_type
                    const typeNum = typeOptoins.find(
                        (it) =>
                            dataType === it.value ||
                            FormatDataType(dataType) === it.value,
                    )?.value
                    const analysisInfo = {
                        // 添加默认值
                        shared_type: ShareTypeEnum.UNCONDITION, // 无条件共享
                        open_type: OpenTypeEnum.OPEN, // 无条件开放
                        sensitive_flag: 0, // 不敏感
                        classified_flag: 0, // 非涉密
                    }
                    return {
                        ...item,
                        source_id: item.id,
                        data_type: typeNum,
                        primary_flag: item.primary_key ? 1 : 0,
                        timestamp_flag: item.business_timestamp ? 1 : 0,
                        data_length:
                            item.data_length < 0
                                ? undefined
                                : ['decimal', 'char'].includes(
                                      changeFormatToType(dataType),
                                  )
                                ? item.reset_data_length || item.data_length
                                : undefined,
                        ...(resId ? analysisInfo : {}),
                    }
                })
            // const list = [
            //     ...(columns?.map((item) => ({
            //         ...item,

            //         isSelectedFlag: true,
            //     })) || []),
            //     ...orginFields,
            // ]
            // 移除勾选框,所有字段都改为已选择
            const list = [
                ...(columns?.map((o) => ({
                    ...o,
                    source_id: o.source_id || o.id,
                })) || []),
                // 第一版编目需要勾选字段，所以需要追加未编目字段，当前版本编目全部字段，不需要追加未编目字段
                ...(resId || resView?.status === 'modify' ? orginFields : []),
            ]?.map((item) => ({
                ...item,
                isSelectedFlag: true,
            }))
            setFieldData(list)
            setDataViewFields(
                resView?.fields?.map((item) => ({
                    ...item,
                    isSelectedFlag: true,
                })),
            )
            setEmptyCatalogFields(list)
        } catch (err) {
            formatError(err)
        }
    }

    const getApiDetails = async (
        id: string,
        columns?: any[],
        mountRes?: any,
    ) => {
        if (!id) return
        try {
            const res = await detailServiceOverview(id)
            setResDetailsInfo(res)
            const name = res?.service_info?.service_name
            const code = res?.service_info?.service_code
            const department = res?.service_info?.department?.name
            const department_id = res?.service_info?.department?.id
            const info = {
                ...baseInfoForm,
                source_department: department,
                source_department_id: department_id,
            }
            setBaseInfoForm(!columns ? { ...info, name } : info)
            // 存在resourceData，为多资源编目，不操作挂载资源
            if (!resourceData?.length && type !== 'edit') {
                setMountResourceData([
                    {
                        resource_id: id,
                        name,
                        code,
                        resource_type: 2,
                        department,
                    },
                ])
            }
            if (governmentStatus) {
                const request_body =
                    res?.service_param?.data_table_request_params.map(
                        (item) => {
                            const detailsItem = mountRes?.request_body?.find(
                                (it) => it.en_name === item.en_name,
                            )
                            return {
                                ...item,
                                [ColumnKeys.name]: item.en_name,
                                [ColumnKeys.data_type]:
                                    detailsItem?.[ColumnKeys.data_type] ||
                                    item?.data_type,
                                [ColumnKeys.default_value]:
                                    detailsItem?.[ColumnKeys.default_value] ||
                                    !!item?.default_value,
                                [ColumnKeys.isArray]:
                                    detailsItem?.[ColumnKeys.isArray] ||
                                    item?.[ColumnKeys.isArray] ||
                                    false,
                            }
                        },
                    )
                const response_body =
                    res?.service_param?.data_table_response_params.map(
                        (item) => {
                            const detailsItem = mountRes?.response_body?.find(
                                (it) => it.en_name === item.en_name,
                            )
                            return {
                                ...item,
                                [ColumnKeys.name]: item.en_name,
                                [ColumnKeys.data_type]:
                                    detailsItem?.[ColumnKeys.data_type] ||
                                    item?.data_type,
                                [ColumnKeys.default_value]:
                                    detailsItem?.[ColumnKeys.default_value] ||
                                    !!item?.default_value,
                                [ColumnKeys.isArray]:
                                    detailsItem?.[ColumnKeys.isArray] ||
                                    item?.[ColumnKeys.isArray] ||
                                    false,
                            }
                        },
                    )
                const request_format =
                    mountRes?.request_format ||
                    res?.service_param?.request_content_type
                const response_format =
                    mountRes?.response_format ||
                    res?.service_param?.response_content_type
                setMountResourceForm({
                    request_body,
                    response_body,
                    request_format,
                    response_format,
                })
            }
            // 源字段需过滤编目已选字段
            const orginFields = res?.service_param?.data_table_response_params
                ?.filter(
                    (item) =>
                        !columns
                            ?.map((it) => it.technical_name)
                            ?.includes(item.en_name),
                )
                ?.map((item) => {
                    const typeNum = typeOptoins.find(
                        (it) =>
                            item.data_type === it.value ||
                            changeFormatToType(item?.data_type) === it.strValue,
                    )?.value
                    return {
                        ...item,
                        id: item.en_name,
                        business_name: item.cn_name,
                        technical_name: item.en_name,
                        data_type: typeNum,
                    }
                })
            // const list = [
            //     ...(columns?.map((item) => ({
            //         ...item,
            //         isSelectedFlag: true,
            //     })) || []),
            //     ...orginFields,
            // ]
            // 移除勾选字段,所有字段都改为已选择
            const list = [...(columns || []), ...orginFields]?.map((item) => ({
                ...item,
                isSelectedFlag: true,
            }))
            setFieldData(list)
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 获取文件详情
     * @param dataId
     */
    const getFileDetail = async (dataId: string) => {
        try {
            const res = await getFileCatalogDetail(dataId)
            setResDetailsInfo(res)
            const name = res?.name
            const code = res?.service_info?.service_code
            const department = res?.service_info?.department?.name
            const department_id = res?.service_info?.department?.id
            const info = {
                ...baseInfoForm,
                source_department: department,
                source_department_id: department_id,
            }
            setBaseInfoForm({ ...info, name })
            // 存在resourceData，为多资源编目，不操作挂载资源
            if (!resourceData?.length && type !== 'edit') {
                setMountResourceData([
                    {
                        ...res,
                        resource_id: dataId,
                        resource_type: ResourceType.File,
                    },
                ])
            }
        } catch (e) {
            formatError(e)
        }
    }

    const updatFieldData = (info: any) => {
        setFieldData(
            fieldData?.map((item) => ({
                ...item,
                // 待编目使用基本信息中的属性
                shared_type: !resourcesType
                    ? item?.shared_type
                    : info?.shared_type,
                open_type: !resourcesType ? item?.open_type : info?.open_type,
            })),
        )
    }

    const handleStageSave = async () => {
        let flag = false
        // 复制最新的fieldData数据
        let list: any = (fieldData || []).slice()
        const baseInfo = {
            ...baseInfoForm,
            ...baseInfoRef?.current?.getForm(),
        }
        if (stepsCurrent === 2) {
            // await baseInfoRef?.current
            //     ?.getFormAndValidate()
            //     .then(() => {
            //         flag = true
            //     })
            //     .catch(() => {
            //         flag = false
            //     })
            await baseInfoRef?.current
                ?.nameValidata()
                .then(() => {
                    flag = true
                })
                .catch(() => {
                    flag = false
                })
            setBaseInfoForm(baseInfo)
            setCategorysInfo(baseInfoRef?.current?.categorys)
        } else if (stepsCurrent === 0) {
            flag = true
        } else if (stepsCurrent === 1) {
            const result = fieldsTableRef?.current?.onValidate()
            // “暂存”不需要校验错误信息，仅保存用户已存字段
            flag = true
            list = result?.list
        }
        if (!baseInfo?.name) {
            message.info('请输入数据资源目录名称')
            return
        }
        if (flag) {
            onFinish('stage', list)
        }
    }

    const queryMainDepartInfo = async () => {
        try {
            const res = await getMainDepartInfo()
            setBaseInfoForm((pre) => ({
                ...pre,
                department_id: res?.id,
            }))
            setMainDepartId(res?.id)
        } catch (e) {
            formatError(e)
        }
    }

    return (
        <div className={styles.AddResourcesDirWrapper}>
            <div className={styles.AddResourcesTitle}>
                <Row style={{ width: '100%' }}>
                    <Col span={6} className={styles.titleLeft}>
                        <GlobalMenu />
                        <Button
                            icon={<LeftOutlined />}
                            type="text"
                            className={styles.backBtn}
                            onClick={() => {
                                if (onClose) {
                                    onClose()
                                } else {
                                    back()
                                }
                            }}
                        >
                            {__('返回')}
                        </Button>
                        <span className={styles.titleLine} />
                        <ResourcesDirOutlined className={styles.titleIcon} />
                        <span className={styles.title}>
                            {type === 'edit'
                                ? __('编目数据资源目录')
                                : __('新建数据资源目录')}
                        </span>
                    </Col>
                    <Col span={12}>
                        <div className={styles.stepsBox}>
                            <Steps current={stepsCurrent} items={stepsItems} />
                        </div>
                    </Col>
                    <Col span={6} />
                </Row>
            </div>
            <div className={styles.AddResourcesDirBox}>
                <div
                    className={classnames(
                        styles.AddResourcesDirBody,
                        !isShowFooter &&
                            styles.addResourcesDirBodyWithoutFooter,
                    )}
                >
                    {stepsItems[stepsCurrent].content}
                </div>
                {/* 步骤条footer按钮 */}
                {isShowFooter && (
                    <div className={styles.optionBox}>
                        <Space size={16} className={styles.optionsBtn}>
                            <Button
                                // className={styles.prevBtn}
                                onClick={() => back()}
                            >
                                {__('取消')}
                            </Button>
                            {stepsCurrent === (isFileRescType ? 1 : 2) && (
                                <Button
                                    // className={styles.prevBtn}
                                    onClick={() => handleStageSave()}
                                >
                                    {__('暂存')}
                                </Button>
                            )}
                            {stepsCurrent > 0 && (
                                <Button
                                    // className={styles.prevBtn}
                                    // icon={<LeftOutlined />}
                                    onClick={() => stepsOptions('prev')}
                                >
                                    {__('上一步')}
                                </Button>
                            )}
                            {stepsCurrent !== (stepsItems?.length || 0) - 1 && (
                                <Tooltip title={nextBtnDisabledTips}>
                                    <Button
                                        className={styles.nextBtn}
                                        type="primary"
                                        disabled={!!nextBtnDisabledTips}
                                        onClick={() => stepsOptions('next')}
                                        style={{ width: 80 }}
                                    >
                                        {__('下一步')}
                                    </Button>
                                </Tooltip>
                            )}
                            {stepsCurrent === (stepsItems?.length || 0) - 1 && (
                                <Button
                                    loading={loading}
                                    type="primary"
                                    // className={styles.prevBtn}
                                    style={{ padding: '4px 31px' }}
                                    onClick={async () => {
                                        // const { list } =
                                        //     fieldsTableRef?.current?.onValidate() ||
                                        //     {}
                                        let validateStatus = false
                                        await baseInfoRef?.current
                                            ?.getFormAndValidate()
                                            .then(() => {
                                                validateStatus = true
                                            })
                                            .catch(() => {
                                                validateStatus = false
                                            })
                                        if (isFileRescType || validateStatus) {
                                            onFinish(
                                                isEmptyCatalog
                                                    ? 'add'
                                                    : 'publish',
                                                fieldData,
                                            )
                                        }
                                    }}
                                >
                                    {isEmptyCatalog ? __('确定') : __('提交')}
                                </Button>
                            )}
                        </Space>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AddResourcesDir
