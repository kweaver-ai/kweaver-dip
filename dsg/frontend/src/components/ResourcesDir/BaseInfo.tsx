import React, {
    useEffect,
    useState,
    useImperativeHandle,
    forwardRef,
    useRef,
    useCallback,
    useMemo,
} from 'react'
import {
    message,
    Form,
    Input,
    Row,
    Col,
    Select,
    Tooltip,
    Radio,
    TreeSelect,
    DatePicker,
    Anchor,
    Alert,
} from 'antd'
import type { Moment } from 'moment'
import classNames from 'classnames'
import { noop, uniqBy } from 'lodash'
import { TooltipPlacement } from 'antd/es/tooltip'
import { QuestionCircleOutlined, DownOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import {
    getDataRangeOptions,
    ILabelTitle,
    dataRange,
    getSharedTpeAndOpenType,
    getDepartmentName,
} from './helper'
import {
    getResourcesTree,
    getResourcesNameCheck,
    formatError,
    ISystemItem,
    reqInfoSystemList,
    getCategory,
    getApplyScopeConfig,
    ICategoryItem,
    SystemCategory,
    getCurUserDepartment,
    getObjectDetails,
    delRescCatlg,
} from '@/core'
import { keyboardInputValidator, nameRepeatValidator } from '@/utils/validate'
import {
    useQuery,
    OperateType,
    infoItemReg,
    keyboardRegEnter,
    ErrorInfo,
} from '@/utils'
import {
    findTreeNodeByKey,
    UseSceneList,
    ShareTypeEnum,
    shareTypeList,
    openTypeList,
    shareModeList,
    YesOrNoList,
    BoolYesOrNoList,
    dataSyncMechanismList,
    updateCycleOptions,
    DataProvideChannelList,
    DataDomainList,
    DataLevelList,
    DepartmentCodeList,
    DivisionCodeList,
    DataProcessingList,
    CatalogTagList,
    OpenTypeEnum,
    ShareModeEnum,
    UseScene,
    updateCycle,
    unCategorizedNodeKey,
    ResourceType,
    getDataClassify,
    publishStatus,
} from './const'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { GlossaryIcon } from '../BusinessDomain/GlossaryIcons'
import { BusinessDomainType } from '../BusinessDomain/const'
import CustomRadio from '@/ui/CustomRadio'
import TreeSelectThemeDomain from '../TreeSelectThemeDomain'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import Confirm from '../Confirm'
import ScrollLoadSelect from '../ScrollLoadSelect'
import RelatedMattersModal from './RelatedMattersModal'
import DepartmentAndOrgSelect from '../DepartmentAndOrgSelect'
import { useResourcesCatlogContext } from './ResourcesCatlogProvider'

const { TextArea } = Input
const { RangePicker } = DatePicker

export const LabelTitle: React.FC<ILabelTitle> = ({
    label,
    id,
    rightNode,
}: ILabelTitle) => {
    return (
        <div className={styles.labelTitleWrapper} id={id}>
            <div className={styles.leftTitleWrapper}>
                <span className={styles.labelLine} />
                <span>{label}</span>
            </div>
            <div className={styles.rightContentWrapper}>{rightNode}</div>
        </div>
    )
}
interface ITipsLabel {
    label: string
    tips?: string
    placement?: TooltipPlacement
}
export const TipsLabel: React.FC<ITipsLabel> = ({ label, tips, placement }) => {
    return (
        <span>
            <span style={{ marginRight: 5 }}>{label}</span>
            {tips && (
                <Tooltip title={tips} placement={placement}>
                    <QuestionCircleOutlined />
                </Tooltip>
            )}
        </span>
    )
}

export const FormItemLabel = (props: any) => {
    const { label, icon, showIcon } = props
    return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ marginRight: 5 }}>{label}</span>
            {showIcon &&
                (icon || (
                    <FontIcon
                        name="icon-biangeng"
                        type={IconType.COLOREDICON}
                    />
                ))}
        </span>
    )
}

/**
 * 更新树数据
 * @param list 当前树列表
 * @param id 选中项id
 * @param children 选中项子目录
 * @returns 更新后的树数据
 */
const updateTreeData = (list: any[], id: string, children: any[]): any[] =>
    list?.map((node) => {
        if (node.id === id) {
            return {
                ...node,
                children,
            }
        }
        if (node.children) {
            return {
                ...node,
                children: updateTreeData(node.children, id, children),
            }
        }
        return { ...node }
    })

interface IBaseInfo {
    ref?: any
    defaultForm: any
    optionsType?: string
    onDataChanged?: () => void
    onDataUpdate?: () => void
    isClearOrgTree?: boolean
    onClearOrgTree?: (flag) => void
    // 信息项字段
    fieldData?: any[]
    // 应用范围ID（如："00000000-0000-0000-0000-000000000001"）
    applyScopeId?: string
}

const BaseInfo: React.FC<IBaseInfo> = forwardRef((props: any, ref) => {
    const {
        defaultForm = {},
        optionsType,
        onDataChanged = noop,
        onDataUpdate = noop,
        onClearOrgTree,
        isClearOrgTree,
        fieldData,
        applyScopeId,
    } = props

    const container = useRef<any>(null)
    const { Link } = Anchor

    const [resourcesTagList, setResourcesTagList] = useState<any[]>([])
    useState<boolean>(false)
    const [form] = Form.useForm()
    // 表单数据
    const [formData, setFormData] = useState<any>({})
    // 资源分类 tree列表
    const [resourcesTreeList, setResourcesTreeList] = useState<any[]>()
    const [sourceDepartmentOptions, setSourceDepartmentOptions] =
        useState<any[]>()

    const query = useQuery()
    const catalogId = query.get('id') || undefined
    const opType = query.get('type') || undefined
    const originPublishStatus = query.get('originPublishStatus') || undefined
    // 资源类型 -- 1：库表  2：接口  待编目参数，已编目不传
    // const resourcesType = query.get('resourcesType') || undefined
    const [resourcesType, setResourcesType] = useState<any>(
        query.get('resourcesType') || undefined,
    )
    const resourcesId = query.get('resourcesId') || undefined
    const resourcesName = query.get('resourcesName') || undefined

    const [{ using, governmentSwitch }] = useGeneralConfig()
    const {
        showUpdateAlert,
        setShowUpdateAlert,
        mountResourceData,
        labelList,
        isFileRescType,
        firstDepartmentInfo,
        setFirstDepartmentInfo,
    } = useResourcesCatlogContext()
    // 资源分类 已选节点
    const [showSharedCondition, setShowSharedCondition] =
        useState<boolean>(true)
    const [showSharedConditionIpt, setShowSharedConditionIpt] =
        useState<boolean>(false)
    const [showOpenType, setShowOpenType] = useState<boolean>(false)
    const [showBusinessSystem, setShowBusinessSystem] = useState<boolean>(false)
    const [dataDomain, setDataDomain] = useState<string>()
    const [sourceDepartmentInfo, setSourceDepartmentInfo] = useState<any>()
    const [categorys, setCategorys] = useState<ICategoryItem[]>([])
    const [timeRange, setTimeRange] = useState<[Moment | null, Moment | null]>([
        null,
        null,
    ])
    const [showCancelDraftAlert, setShowCancelDraftAlert] =
        useState<boolean>(false)
    const [delVisible, setDelVisible] = useState<boolean>(false)
    const [relatedMattersOpen, setRelatedMattersOpen] = useState<boolean>(false)
    const [relatedMattersList, setRelatedMattersList] = useState<any[]>([])
    const [systemTotalCount, setSysetemTotalCount] = useState<number>(0)
    const [infoSystemOptions, setInfoSystemOptions] = useState<Array<any>>([])
    // const [isClearOrgTree, setIsClearOrgTree] = useState<boolean>(false)
    const { SHOW_ALL } = TreeSelect

    const isPublish = useMemo(() => {
        return (
            defaultForm.publish_status === publishStatus.Published ||
            originPublishStatus === publishStatus.Published
        )
    }, [defaultForm])

    useImperativeHandle(ref, () => ({
        getForm,
        getFormAndValidate,
        formData,
        nameValidata,
        categorys,
        relatedMattersList,
    }))

    const governmentStatus = useMemo(() => {
        return governmentSwitch.on
    }, [governmentSwitch])

    useEffect(() => {
        getResourcesTreeList()
        setShowSharedConditionIpt(false)
        queryCategoryList()
    }, [])

    // 需要初始值的formItem
    const formInitialValue = {
        // shared_type: ShareTypeEnum.UNCONDITION,
        shared_mode: ShareModeEnum.Platform,
        // open_type: OpenTypeEnum.OPEN,
        data_range: dataRange.CITY,
    }

    const [initialValues, setInitialValues] = useState<any>(formInitialValue)
    // 仅保存编目进来后的真正存储主题域的值
    const [themeDomainDefValue, setThemeDomainDefValue] = useState<string[]>()

    useEffect(() => {
        if (mountResourceData?.length) {
            getSourceDepartment()
        }
    }, [mountResourceData, defaultForm])

    useEffect(() => {
        if (JSON.stringify(defaultForm || {}) === '{}') {
            return
        }

        const formValues = form.getFieldsValue()
        const newFormInitialValues = {
            ...formInitialValue,
            ...initialValues,
            ...formValues,
            ...defaultForm,
            department_id:
                defaultForm?.department_id || formValues?.department_id,
            subject_id: defaultForm?.subject_id || formValues?.subject_id || [],
        }
        const dataViewResource = mountResourceData?.find(
            (o) => o.resource_type === ResourceType.DataView,
        )
        // 默认关联库表的所属所属业务对象
        if (
            !newFormInitialValues.subject_id?.length &&
            mountResourceData?.length
        ) {
            newFormInitialValues.subject_id = dataViewResource?.subject_id
                ? [dataViewResource?.subject_id]
                : []
            form.setFieldValue(
                'subject_id',
                dataViewResource?.subject_id
                    ? [dataViewResource?.subject_id]
                    : undefined,
            )
        }
        if (dataViewResource?.department_id && opType === 'create') {
            newFormInitialValues.department_id = dataViewResource?.department_id
        }
        setResourcesType((prev) => defaultForm.resources_type || prev)
        // if (
        //     !themeDomainDefValue &&
        //     newFormInitialValues.subject_id?.sort?.()?.length
        //     //  &&
        //     // !isEqual(
        //     //     newFormInitialValues.subject_id?.sort?.(),
        //     //     themeDomainDefValue?.sort(),
        //     // )
        // ) {
        setThemeDomainDefValue(newFormInitialValues.subject_id)
        // }
        setInitialValues(newFormInitialValues)

        const data_classify = getDataClassify(labelList, fieldData)

        const newFormValues = {
            ...formInitialValue,
            // ...formData,
            ...formValues,
            ...defaultForm,
            app_scene_classify:
                defaultForm.app_scene_classify || formValues.app_scene_classify,
            data_range:
                defaultForm.data_range ||
                formValues.data_range ||
                formInitialValue.data_range,
            update_cycle: defaultForm.update_cycle || formValues.update_cycle,
            data_classify:
                defaultForm.data_classify ||
                (fieldData?.length
                    ? data_classify
                    : !fieldData?.length && opType === 'create'
                    ? labelList?.[0]?.id
                    : formValues.data_classify),
            info_system_id:
                defaultForm.info_system_id || formValues.info_system_id,
            department_id:
                defaultForm?.department_id ||
                formValues?.department_id ||
                undefined,
            business_matters: defaultForm?.business_matters?.map(
                (o) => o.id || o,
            ),
            ...getSharedTpeAndOpenType(fieldData),
        }
        setRelatedMattersList(defaultForm?.business_matters || [])
        // source_department_id 在挂接资源单独处理，此处不添加值
        delete newFormValues.source_department_id
        if (!labelList?.find((i) => i.id === newFormValues.data_classify)) {
            newFormValues.data_classify = undefined
        }
        if (!newFormValues?.subject_id?.length) {
            delete newFormValues.subject_id
        }

        // 初始化
        form.setFieldsValue(newFormValues)

        // sharedTypeChange(defaultForm.shared_type)
        // openTypeChange(defaultForm.open_type)
        if (optionsType === OperateType.EDIT) {
            setShowOpenType(newFormValues.open_type === 2)
            setShowSharedCondition(newFormValues.shared_type !== 3)
        }
        // 查询当前部门
        // getCurDepartment()
        // if (!newFormValues?.department_id && !isClearOrgTree) {
        //     getCurDepartment()
        // } else {
        //     setFirstDepartmentInfo(
        //         firstDepartmentInfo?.length
        //             ? firstDepartmentInfo
        //             : [
        //                   {
        //                       label: getDepartmentName(newFormValues),
        //                       value: newFormValues?.department_id,
        //                   },
        //               ],
        //     )
        // }
    }, [defaultForm])

    // 检查 category id 是否存在
    useEffect(() => {
        if (categorys?.length) {
            // 获取所有表单值
            const formValues = defaultForm

            // 检查每个 category
            categorys
                .filter((item) => item.type !== 'system')
                .forEach((item) => {
                    const fieldName = `category_node_ids_${item.id}`
                    const fieldValue = formValues[fieldName]

                    // 如果有值，检查该值在树节点中是否存在
                    if (fieldValue) {
                        const isValidId = checkIdExistsInTree(
                            item.tree_node,
                            fieldValue,
                        )

                        if (!isValidId) {
                            // 设置表单错误
                            form.setFields([
                                {
                                    name: fieldName,
                                    errors: [__('该分类已被删除，请重新选择')],
                                },
                            ])
                            form.setFieldValue(fieldName, undefined)
                        }
                    }
                })
        }
    }, [defaultForm, categorys])

    useEffect(() => {
        // 如果节点存在就在form中使用id，如果不存在就用字段name+错误提示
        if (resourcesTreeList && optionsType === OperateType.EDIT) {
            form.setFieldValue(
                'group_id',
                findTreeNodeByKey(
                    form.getFieldValue('group_id'),
                    'id',
                    resourcesTreeList,
                )?.id || defaultForm.group_name,
            )
            form.validateFields(['group_id'])
        }
    }, [resourcesTreeList])

    useEffect(() => {
        if (fieldData?.length) {
            const { shared_type, open_type } =
                getSharedTpeAndOpenType(fieldData)
            sharedTypeChange(shared_type)
            openTypeChange(open_type)
        }
    }, [fieldData])

    // useEffect(() => {
    //     if (categorys?.length && defaultForm?.category_infos?.length) {
    //     }
    // }, [categorys, defaultForm])

    // 获取form参数，并校验
    const getFormAndValidate = () => {
        form.submit()

        const value = form.validateFields()
        value.then().catch(() => {
            // 在catch中进行错误定位
            setTimeout(() => {
                const errorList = document.querySelectorAll(
                    '.any-fabric-ant-form-item-has-error',
                )
                errorList[0]?.scrollIntoView({
                    block: 'center',
                    behavior: 'smooth',
                })
            }, 300)
        })
        return value
    }
    const getForm = () => {
        return form.getFieldsValue()
    }

    const nameValidata = () => {
        return form.validateFields(['name'])
    }

    // 查询关联信息系统
    // const getBusinessSystem = async () => {
    //     try {
    //         const res =
    //             (await reqInfoSystemList({
    //                 limit: 2000,
    //                 offset: 1,
    //             })) || {}
    //         setBusinessSystem(res.entries || [])
    //     } catch (error: any) {
    //         formatError(error)
    //     }
    // }
    const getInfoSystem = async (params: any) => {
        try {
            const res = await reqInfoSystemList({
                limit: 50,
                offset: 1,
                ...params,
            })
            return res.entries || []
        } catch (error: any) {
            formatError(error)
            return []
        }
    }
    // 获取当前部门
    const getCurDepartment = async () => {
        try {
            const res = await getCurUserDepartment()
            // if (res?.length === 1) {
            const [dept] = res
            // 发布之后，不使用当前用户部门
            if (isPublish) {
                setFirstDepartmentInfo([
                    {
                        label: defaultForm?.department,
                        value: defaultForm?.department_id,
                    },
                ])
                return
            }
            form.setFieldValue('department_id', dept?.id)
            setInitialValues((pre) => ({ ...pre, department_id: dept?.id }))
            const deptList = dept?.path.split('/')?.filter((o) => !!o)
            if (deptList?.length > 1) {
                const name = deptList[1]
                setFirstDepartmentInfo([
                    {
                        label: name,
                        value: dept?.id,
                    },
                ])
            } else {
                setFirstDepartmentInfo([
                    {
                        ...dept,
                        value: dept?.id,
                        label: dept?.name,
                    },
                ])
            }
            // }
        } catch (error) {
            formatError(error)
        }
    }

    // 获取来源部门，验证部门是否存在
    const getSourceDepartment = async () => {
        try {
            let source_department_id = ''
            let sourceOptions: any[] = []
            const dataViewResource = mountResourceData?.find(
                (o) => o.resource_type === ResourceType.DataView,
            )
            if (isFileRescType) {
                // bug-778379 多个文件资源不显示来源部门
                if (mountResourceData?.length === 1) {
                    source_department_id = mountResourceData[0]?.department_id
                    sourceOptions = uniqBy(
                        mountResourceData?.map((o) => {
                            return {
                                label:
                                    o.department ||
                                    defaultForm?.source_department,
                                value:
                                    o.department_id ||
                                    defaultForm?.source_department_id,
                            }
                        }),
                        'value',
                    )
                }
            } else {
                source_department_id = dataViewResource?.department_id
                sourceOptions = [
                    {
                        label:
                            dataViewResource?.department ||
                            defaultForm?.source_department,
                        value:
                            dataViewResource?.department_id ||
                            defaultForm?.source_department_id,
                    },
                ]
            }
            let info = sourceDepartmentInfo
            if (!info?.id && source_department_id) {
                info = await getObjectDetails(source_department_id)
            }
            setSourceDepartmentInfo(info)
            // 有部门详情，则显示部门名称
            setSourceDepartmentOptions(sourceOptions)
            form.setFieldValue(
                'source_department_id',
                source_department_id || undefined,
            )
        } catch (error) {
            formatError(error)
            setSourceDepartmentOptions([])
            form.setFieldValue('source_department_id', undefined)
        }
    }

    // 获取资源分类树
    const getResourcesTreeList = async () => {
        const res = await getResourcesTree({ recursive: true })
        setResourcesTreeList(res.entries)
    }

    const getTreeNodes = (data: any[]) => {
        const treeDataList = data.map((item: any) => {
            const isCheckable = [
                BusinessDomainType.business_object,
                BusinessDomainType.business_activity,
                BusinessDomainType.logic_entity,
            ].includes(item.type)
            // eslint-disable-next-line no-param-reassign
            item.isLeaf =
                !item?.child_count ||
                item.type === BusinessDomainType.logic_entity
            // eslint-disable-next-line no-param-reassign
            item.checkable = isCheckable
            // eslint-disable-next-line no-param-reassign
            item.icon = (
                <span style={{ lineHeight: '32px' }}>
                    <GlossaryIcon type={item.type} showDot={false} />
                </span>
            )
            if (item.children && item.children.length > 0) {
                getTreeNodes(item.children)
            }
            return item
        })
        return treeDataList
    }
    const generateList = (data: any[], arry: any[] = []) => {
        data.forEach((item) => {
            arry.push({
                id: item.id,
                name: item.name,
                type: item.type,
            })
            if (item.children) {
                generateList(item.children, arry)
            }
        })
        return arry
    }

    // 校验重名
    const nameRepeatCb = useCallback(
        () =>
            nameRepeatValidator({
                action: getResourcesNameCheck,
                repeatMessage: '数据资源目录名称已存在，请重新输入',
                validateMsg: '仅支持中英文、数字、下划线及中划线',
                params: !resourcesType ? { id: catalogId } : {},
            }),
        [catalogId],
    )
    // 共享属性 切换
    const sharedTypeChange = (value: ShareTypeEnum) => {
        if (value) {
            setShowSharedCondition(value !== ShareTypeEnum.NOSHARE)
            setShowSharedConditionIpt(value !== ShareTypeEnum.UNCONDITION)
            if (value === ShareTypeEnum.NOSHARE) {
                form.setFieldValue('open_type', 3)
                openTypeChange(3)
            }
        }
    }
    // 开放属性 切换
    const openTypeChange = (value) => {
        setShowOpenType(value === 2)
    }

    const getCurrentOrg = (data: any[], id) => {
        let obj: any
        data.forEach((item) => {
            if (item.id === id) {
                obj = item
                return
            }
            if (item?.children && item?.children?.length) {
                getCurrentOrg(item?.children, id)
            }
        })
        return obj
    }

    // 获取类目列表
    const queryCategoryList = async () => {
        try {
            const { entries } = await getCategory({})
            let list = entries?.filter((item) => item.using) || []

            // 如果指定了 applyScopeId，使用新的配置逻辑
            if (applyScopeId) {
                try {
                    const config = await getApplyScopeConfig()

                    // 创建类目配置映射表
                    const categoryConfigMap = new Map<
                        string,
                        { selected: boolean; required: boolean }
                    >()

                    config.categories?.forEach((category) => {
                        // 查找指定的 apply_scope_id
                        const module = category.modules?.find(
                            (m) => m.apply_scope_id === applyScopeId,
                        )
                        if (module) {
                            categoryConfigMap.set(category.id, {
                                selected: module.selected,
                                required: module.required,
                            })
                        }
                    })

                    // 过滤并设置必填状态
                    list = list
                        .filter((item) => {
                            const itemConfig = categoryConfigMap.get(item.id)
                            return itemConfig?.selected === true
                        })
                        .map((item) => {
                            const itemConfig = categoryConfigMap.get(item.id)
                            return {
                                ...item,
                                required: itemConfig?.required || false,
                            }
                        })
                } catch (error) {
                    formatError(error)
                }
            }

            setCategorys(list || [])
            const hasBusinessSystem: boolean = !!list?.find(
                (item) => item.id === SystemCategory.InformationSystem,
            )?.id
            // if (hasBusinessSystem) {
            //     getBusinessSystem()
            // }
            setShowBusinessSystem(hasBusinessSystem)
        } catch (err) {
            formatError(err)
        }
    }

    // 递归检查 ID 是否存在于树中
    const checkIdExistsInTree = (treeData, targetId) => {
        if (!treeData) return false

        return treeData.some((node) => {
            if (Array.isArray(targetId)) {
                // 如果是多选，检查每个 ID
                return targetId.every(
                    (id) =>
                        node.id === id ||
                        (node.children &&
                            checkIdExistsInTree(node.children, [id])),
                )
            }
            return (
                node.id === targetId ||
                (node.children && checkIdExistsInTree(node.children, targetId))
            )
        })
    }

    const timeHandleChange = (val) => {
        setTimeRange(val)
    }

    const handleDelete = async () => {
        try {
            if (!defaultForm?.draft_id) return
            await delRescCatlg(defaultForm?.draft_id)
            message.success(__('撤销成功'))
            onDataUpdate?.()
        } catch (e) {
            formatError(e)
        } finally {
            setDelVisible(false)
        }
    }

    return (
        <div className={styles.baseInfoWrapper} ref={container}>
            <Form
                className={classNames(
                    styles.baseInfoForm,
                    showUpdateAlert && isPublish && styles.tipsBaseInfoForm,
                )}
                autoComplete="off"
                form={form}
                layout="vertical"
                initialValues={initialValues}
                onValuesChange={() => {
                    onDataChanged()
                }}
            >
                {showUpdateAlert && isPublish && (
                    <div className={styles.tipsAlert} id="basic-info">
                        <Alert
                            message={
                                <span
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    {__('带有')}
                                    <FontIcon
                                        name="icon-biangeng"
                                        type={IconType.COLOREDICON}
                                    />
                                    {__('标识的字段变更后，需要走审核流程')}
                                </span>
                            }
                            type="info"
                            showIcon
                            onClose={() => setShowUpdateAlert(false)}
                            closeText={
                                <span
                                    style={{
                                        marginLeft: 16,
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        fontSize: '16px',
                                        color: '#126EE3',
                                    }}
                                >
                                    {__('不再提示')}
                                </span>
                            }
                        />
                    </div>
                )}
                {showCancelDraftAlert && (
                    <div className={styles.tipsAlert}>
                        <Alert
                            message={`${__('变更未通过审核意见：')}${
                                defaultForm?.audit_advice
                            }`}
                            type="error"
                            showIcon
                            onClose={() => setDelVisible(true)}
                            closeText={
                                <span
                                    style={{
                                        marginLeft: 16,
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        fontSize: '16px',
                                        color: '#126EE3',
                                    }}
                                >
                                    {__('恢复到已发布内容')}
                                </span>
                            }
                        />
                    </div>
                )}
                <Row className={styles.baseInfoRow}>
                    <div
                        id="basic-info"
                        style={{
                            width: '100%',
                        }}
                    >
                        <LabelTitle label="基本属性" />
                    </div>
                    <Col span={24}>
                        <Form.Item
                            label={
                                <FormItemLabel
                                    showIcon={isPublish}
                                    label={__('数据资源目录名称')}
                                />
                            }
                            rules={[
                                {
                                    required: true,
                                    message: `${__('请输入')}${__(
                                        '数据资源目录名称',
                                    )}`,
                                },
                                {
                                    validator: nameRepeatCb(),
                                },
                            ]}
                            name="name"
                        >
                            <Input
                                placeholder={`${__('请输入')}${__(
                                    '数据资源目录名称',
                                )}`}
                                maxLength={128}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={__('数据资源来源部门')}
                            name="source_department_id"
                        >
                            <Select
                                options={sourceDepartmentOptions}
                                disabled
                                placeholder={__('暂无数据资源来源部门')}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={__('目录提供方')}
                            name="department_id"
                            rules={[
                                {
                                    required: categorys.find(
                                        (item) =>
                                            item.id ===
                                            SystemCategory.Organization,
                                    )?.required,
                                    message: `${__('请选择')}${__(
                                        '目录提供方',
                                    )}`,
                                },
                            ]}
                        >
                            {/* <Select
                                options={firstDepartmentInfo}
                                disabled
                                placeholder={__('请选择')}
                            /> */}
                            <DepartmentAndOrgSelect
                                placeholder={`${__('请选择')}${__(
                                    '目录提供方',
                                )}`}
                                defaultValue={initialValues.department_id}
                                allowClear
                                onChange={(val) => {
                                    if (!val) {
                                        setInitialValues((pre) => ({
                                            ...pre,
                                            department_id: undefined,
                                        }))
                                        onClearOrgTree?.(true)
                                    }
                                }}
                            />
                        </Form.Item>
                    </Col>
                    {showBusinessSystem && (
                        <Col span={12}>
                            <Form.Item
                                label={__('所属信息系统')}
                                name="info_system_id"
                                rules={[
                                    {
                                        required: categorys.find(
                                            (item) =>
                                                item.id ===
                                                SystemCategory.InformationSystem,
                                        )?.required,
                                        message: `${__('请选择')}${__(
                                            '所属信息系统',
                                        )}`,
                                    },
                                ]}
                                initialValue={
                                    defaultForm?.info_system_id ||
                                    form?.getFieldsValue()?.info_system_id
                                }
                            >
                                <ScrollLoadSelect
                                    fetchOptions={getInfoSystem}
                                    placeholder={`${__('请选择')}${__(
                                        '所属信息系统',
                                    )}`}
                                    allowClear
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                />
                            </Form.Item>
                        </Col>
                    )}
                    <Col span={12}>
                        <Form.Item
                            label={__('所属业务对象')}
                            rules={[
                                {
                                    required: true,
                                    message: `${__('请选择')}${__(
                                        '所属业务对象',
                                    )}`,
                                },
                            ]}
                            name="subject_id"
                        >
                            <TreeSelectThemeDomain
                                unCategorizedObj={{
                                    id: unCategorizedNodeKey,
                                    name: __('其他'),
                                }}
                                defaultValue={themeDomainDefValue}
                                allowClear
                                placeholder={`${__('请选择')}${__(
                                    '所属业务对象',
                                )}`}
                                multiple
                                treeCheckable
                                showCheckedStrategy={SHOW_ALL}
                                treeCheckStrictly
                            />
                        </Form.Item>
                    </Col>
                    {governmentStatus && (
                        <Col span={12}>
                            <Form.Item
                                label={__('供应渠道')}
                                name="provider_channel"
                                rules={[
                                    {
                                        required: true,
                                        message: `${__('请选择')}${__(
                                            '供应渠道',
                                        )}`,
                                    },
                                ]}
                            >
                                <Select
                                    allowClear
                                    options={DataProvideChannelList}
                                    placeholder={`${__('请选择')}${__(
                                        '供应渠道',
                                    )}`}
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                />
                            </Form.Item>
                        </Col>
                    )}
                    <Col span={12}>
                        <Form.Item
                            label={__('应用场景分类')}
                            name="app_scene_classify"
                        >
                            <Select
                                allowClear
                                options={UseSceneList}
                                placeholder={`${__('请选择')}${__(
                                    '应用场景分类',
                                )}`}
                                getPopupContainer={(node) => node.parentNode}
                            />
                        </Form.Item>
                    </Col>
                    {governmentStatus && (
                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, curValues) => {
                                return (
                                    prevValues.app_scene_classify !==
                                    curValues.app_scene_classify
                                )
                            }}
                        >
                            {({ getFieldValue }) => {
                                const sceneClassify =
                                    getFieldValue('app_scene_classify')
                                if (sceneClassify === UseScene.Other) {
                                    return (
                                        <Col span={12}>
                                            <Form.Item
                                                label={__('其他应用场景')}
                                                name="other_app_scene_classify"
                                                required
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: `${__(
                                                            '请输入',
                                                        )}${__(
                                                            '其他应用场景',
                                                        )}`,
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    placeholder={`${__(
                                                        '请输入',
                                                    )}${__('其他应用场景')}`}
                                                    maxLength={300}
                                                />
                                            </Form.Item>
                                        </Col>
                                    )
                                }
                                return ''
                            }}
                        </Form.Item>
                    )}
                    <Col span={12}>
                        <Form.Item
                            label={__('数据所属事项')}
                            validateTrigger={['onChange']}
                            rules={[
                                {
                                    required: true,
                                    message: __('请输入数据所属事项'),
                                },
                                // {
                                //     pattern: infoItemReg,
                                //     message: ErrorInfo.INFOITEM,
                                // },
                            ]}
                            name="business_matters"
                        >
                            <Select
                                options={relatedMattersList.map((o) => ({
                                    ...o,
                                    label: o.name,
                                    value: o.id,
                                }))}
                                value={relatedMattersList.map((o) => o.id)}
                                mode="multiple"
                                open={false}
                                onClick={() => {
                                    setRelatedMattersOpen(true)
                                }}
                                placeholder={`${__('请选择')}${__(
                                    '数据所属事项',
                                )}`}
                                onDeselect={(val) => {
                                    setRelatedMattersList((pre) =>
                                        pre.filter((o) => o.id !== val),
                                    )
                                }}
                                className={styles.matterSelect}
                                getPopupContainer={(node) => node.parentNode}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={
                                <FormItemLabel
                                    showIcon={isPublish}
                                    label={__('空间范围')}
                                />
                            }
                            name="data_range"
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择空间范围'),
                                },
                            ]}
                        >
                            <Select
                                allowClear
                                options={
                                    getDataRangeOptions(
                                        governmentStatus,
                                    ) as any[]
                                }
                                placeholder={`${__('请选择')}${__('空间范围')}`}
                                defaultValue={1}
                                getPopupContainer={(node) => node.parentNode}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={
                                <FormItemLabel
                                    showIcon={isPublish}
                                    label={__('数据时间范围')}
                                />
                            }
                            name="time_range"
                            rules={[
                                {
                                    required: true,
                                    message: `${__('请选择')}${__(
                                        '数据时间范围',
                                    )}`,
                                },
                            ]}
                        >
                            <RangePicker
                                style={{ width: '100%' }}
                                format="YYYY-MM-DD"
                                placeholder={[__('开始日期'), __('结束日期')]}
                                onOpenChange={(open) => {
                                    if (!open) {
                                        form.setFieldValue(
                                            'time_range',
                                            timeRange,
                                        )
                                    }
                                }}
                                value={timeRange}
                                onCalendarChange={timeHandleChange}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={
                                <FormItemLabel
                                    showIcon={isPublish}
                                    label={__('更新周期')}
                                />
                            }
                            rules={[
                                {
                                    required: true,
                                    message: `${__('请选择')}${__('更新周期')}`,
                                },
                            ]}
                            name="update_cycle"
                        >
                            <Select
                                allowClear
                                options={updateCycleOptions}
                                placeholder={`${__('请选择')}${__('更新周期')}`}
                                getPopupContainer={(node) => node.parentNode}
                            />
                        </Form.Item>
                    </Col>
                    {governmentStatus && (
                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, curValues) => {
                                return (
                                    prevValues.update_cycle !==
                                    curValues.update_cycle
                                )
                            }}
                        >
                            {({ getFieldValue }) => {
                                const updateCycleVal =
                                    getFieldValue('update_cycle')
                                if (updateCycleVal === updateCycle.other) {
                                    return (
                                        <Col span={12}>
                                            <Form.Item
                                                label={__('其他更新周期')}
                                                name="other_update_cycle"
                                                required
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: `${__(
                                                            '请输入',
                                                        )}${__(
                                                            '其他更新周期',
                                                        )}`,
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    placeholder={`${__(
                                                        '请输入',
                                                    )}${__('其他更新周期')}`}
                                                    maxLength={300}
                                                />
                                            </Form.Item>
                                        </Col>
                                    )
                                }
                                return ''
                            }}
                        </Form.Item>
                    )}

                    <Col span={12}>
                        <Form.Item
                            label={
                                <FormItemLabel
                                    showIcon={isPublish}
                                    label={__('数据分级')}
                                />
                            }
                            rules={[
                                {
                                    required: true,
                                    message: `${__('请选择')}${__('数据分级')}`,
                                },
                            ]}
                            name="data_classify"
                        >
                            <Select
                                allowClear
                                options={labelList?.map((item) => ({
                                    ...item,
                                    label: item.name,
                                    value: item.id,
                                }))}
                                placeholder={`${__('请选择')}${__('数据分级')}`}
                                getPopupContainer={(node) => node.parentNode}
                            />
                        </Form.Item>
                    </Col>
                    {governmentStatus && (
                        <>
                            <Col span={12}>
                                <Form.Item
                                    label={__('数据所属领域')}
                                    name="data_domain"
                                    rules={[
                                        {
                                            required: true,
                                            message: `${__('请选择')}${__(
                                                '数据所属领域',
                                            )}`,
                                        },
                                    ]}
                                >
                                    <Select
                                        allowClear
                                        options={DataDomainList}
                                        placeholder={`${__('请选择')}${__(
                                            '数据所属领域',
                                        )}`}
                                        showSearch
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').includes(
                                                input,
                                            )
                                        }
                                        getPopupContainer={(node) =>
                                            node.parentNode
                                        }
                                    />
                                </Form.Item>
                            </Col>
                            {dataDomain === '27' && (
                                <Col span={12}>
                                    <Form.Item
                                        label={`${__('其他')}${__(
                                            '数据所属领域',
                                        )}`}
                                        name="yycjflqt"
                                        rules={[
                                            {
                                                required: true,
                                                message: `${__('请输入')}${__(
                                                    '其他',
                                                )}${__('数据所属领域')}`,
                                            },
                                        ]}
                                    >
                                        <Input
                                            placeholder={`${__('请输入')}${__(
                                                '其他',
                                            )}${__('数据所属领域')}`}
                                            maxLength={128}
                                        />
                                    </Form.Item>
                                </Col>
                            )}
                            <Col span={12}>
                                <Form.Item
                                    label={__('数据所在层级')}
                                    name="data_level"
                                    rules={[
                                        {
                                            required: true,
                                            message: `${__('请选择')}${__(
                                                '数据所在层级',
                                            )}`,
                                        },
                                    ]}
                                >
                                    <Select
                                        allowClear
                                        options={DataLevelList}
                                        placeholder={`${__('请选择')}${__(
                                            '数据所在层级',
                                        )}`}
                                        getPopupContainer={(node) =>
                                            node.parentNode
                                        }
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label={__('中央业务指导部门代码')}
                                    name="central_department_code"
                                    rules={[
                                        {
                                            required: true,
                                            message: `${__('请选择')}${__(
                                                '中央业务指导部门代码',
                                            )}`,
                                        },
                                    ]}
                                >
                                    <Select
                                        allowClear
                                        options={DepartmentCodeList}
                                        placeholder={`${__('请选择')}${__(
                                            '中央业务指导部门代码',
                                        )}`}
                                        showSearch
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').includes(
                                                input,
                                            )
                                        }
                                        getPopupContainer={(node) =>
                                            node.parentNode
                                        }
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label={__('行政区划代码')}
                                    name="administrative_code"
                                    rules={[
                                        {
                                            required: true,
                                            message: `${__('请选择')}${__(
                                                '行政区划代码',
                                            )}`,
                                        },
                                    ]}
                                >
                                    <Select
                                        allowClear
                                        options={DivisionCodeList}
                                        placeholder={`${__('请选择')}${__(
                                            '行政区划代码',
                                        )}`}
                                        showSearch
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').includes(
                                                input,
                                            )
                                        }
                                        getPopupContainer={(node) =>
                                            node.parentNode
                                        }
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label={__('数据加工程度')}
                                    name="processing_level"
                                >
                                    <Select
                                        allowClear
                                        options={DataProcessingList}
                                        placeholder={`${__('请选择')}${__(
                                            '数据加工程度',
                                        )}`}
                                        getPopupContainer={(node) =>
                                            node.parentNode
                                        }
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label={__('目录标签')}
                                    name="catalog_tag"
                                >
                                    <Select
                                        allowClear
                                        options={CatalogTagList}
                                        placeholder={`${__('请选择')}${__(
                                            '目录标签',
                                        )}`}
                                        showSearch
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').includes(
                                                input,
                                            )
                                        }
                                        getPopupContainer={(node) =>
                                            node.parentNode
                                        }
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label={__('是否电子证照编码')}
                                    name="is_electronic_proof"
                                >
                                    <Radio.Group>
                                        {BoolYesOrNoList.map((item) => {
                                            return (
                                                <Radio
                                                    key={item.label}
                                                    value={item.value}
                                                >
                                                    {item.label}
                                                </Radio>
                                            )
                                        })}
                                    </Radio.Group>
                                </Form.Item>
                            </Col>
                        </>
                    )}
                    <Col span={24}>
                        <Form.Item
                            label={__('数据资源目录描述')}
                            name="description"
                            validateTrigger={['onChange', 'onBlur']}
                            rules={[
                                {
                                    required: true,
                                    message: `${__('请输入')}${__(
                                        '数据资源目录描述',
                                    )}`,
                                },
                                {
                                    pattern: keyboardRegEnter,
                                    message: ErrorInfo.EXCEPTEMOJI,
                                },
                            ]}
                        >
                            <TextArea
                                rows={3}
                                maxLength={255}
                                placeholder={`${__('请输入')}${__(
                                    '数据资源目录描述',
                                )}`}
                                className={styles.textArea}
                                showCount
                            />
                        </Form.Item>
                    </Col>
                    {categorys.filter((item) => item.type !== 'system')
                        ?.length ? (
                        <LabelTitle
                            label="资源属性分类"
                            id="resc-attr-classify"
                        />
                    ) : undefined}
                    {categorys
                        .filter((item) => item.type !== 'system')
                        ?.map((item, index) => {
                            return (
                                <Col span={12} key={item.id}>
                                    <Form.Item
                                        label={
                                            <FormItemLabel
                                                showIcon={isPublish}
                                                label={item.name}
                                            />
                                        }
                                        rules={[
                                            {
                                                required: item.required,
                                                message: `${__('请选择')}${
                                                    item.name
                                                }`,
                                            },
                                        ]}
                                        name={`category_node_ids_${item.id}`}
                                    >
                                        <TreeSelect
                                            treeDataSimpleMode
                                            getPopupContainer={(node) =>
                                                node.parentNode
                                            }
                                            style={{ width: '100%' }}
                                            dropdownStyle={{
                                                width: '100%',
                                                maxHeight: 400,
                                                overflow: 'auto',
                                            }}
                                            dropdownMatchSelectWidth={false}
                                            allowClear
                                            placeholder={`${__('请选择')}${
                                                item.name
                                            }`}
                                            treeData={item.tree_node}
                                            switcherIcon={<DownOutlined />}
                                            fieldNames={{
                                                label: 'name',
                                                value: 'id',
                                            }}
                                            popupClassName={
                                                styles.orgTreeSelect
                                            }
                                            treeIcon
                                            showSearch
                                            treeNodeFilterProp="name"
                                        />
                                    </Form.Item>
                                </Col>
                            )
                        })}
                    <Col span={12} />
                    <LabelTitle label="共享开放信息" id="share-info" />
                    <Col span={12}>
                        <Form.Item
                            rules={[
                                {
                                    required: true,
                                    message: `${__('请选择')}${__('共享属性')}`,
                                },
                            ]}
                            validateFirst
                            label={__('共享属性')}
                            name="shared_type"
                            // initialValue={1}
                        >
                            <Radio.Group
                                onChange={(value) => {
                                    form.setFieldValue('shared_condition', '')
                                    sharedTypeChange(value?.target?.value)
                                }}
                                disabled
                            >
                                {shareTypeList.map((item) => {
                                    return (
                                        <Radio key={item.key} value={item.key}>
                                            {item.label}
                                        </Radio>
                                    )
                                })}
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, curValues) => {
                                return (
                                    prevValues.shared_type !==
                                    curValues.shared_type
                                )
                            }}
                        >
                            {({ getFieldValue, validateFields }) => {
                                const sharedType = getFieldValue('shared_type')
                                if (
                                    [
                                        ShareTypeEnum.CONDITION,
                                        ShareTypeEnum.NOSHARE,
                                    ].includes(sharedType)
                                ) {
                                    const isCondition =
                                        sharedType === ShareTypeEnum.CONDITION
                                    return (
                                        <Form.Item
                                            label={
                                                <FormItemLabel
                                                    showIcon={isPublish}
                                                    label={
                                                        isCondition
                                                            ? __('共享条件')
                                                            : __('不予共享依据')
                                                    }
                                                />
                                            }
                                            name="shared_condition"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: `请输入${
                                                        isCondition
                                                            ? __('共享条件')
                                                            : __('不予共享依据')
                                                    }`,
                                                },
                                                {
                                                    validator:
                                                        keyboardInputValidator(
                                                            ErrorInfo.EXCEPTEMOJI,
                                                        ),
                                                },
                                            ]}
                                            validateFirst
                                        >
                                            <Input
                                                maxLength={128}
                                                placeholder={`${__('请输入')}${
                                                    isCondition
                                                        ? __('共享条件')
                                                        : __('不予共享依据')
                                                }`}
                                            />
                                        </Form.Item>
                                    )
                                }
                                return ''
                            }}
                        </Form.Item>
                    </Col>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, curValues) => {
                            return (
                                prevValues.shared_type !== curValues.shared_type
                            )
                        }}
                    >
                        {({ getFieldValue }) => {
                            const sharedType = getFieldValue('shared_type')

                            //    无共享属性或不予共享，不显示共享方式
                            if (
                                !sharedType ||
                                sharedType === ShareTypeEnum.NOSHARE
                            ) {
                                return ''
                            }
                            return (
                                <Col span={24}>
                                    <Form.Item
                                        rules={[
                                            {
                                                required: true,
                                                message: `${__('请选择')}${__(
                                                    '共享方式',
                                                )}`,
                                            },
                                        ]}
                                        label={
                                            <FormItemLabel
                                                showIcon={isPublish}
                                                label={__('共享方式')}
                                            />
                                        }
                                        name="shared_mode"
                                        validateFirst
                                        // initialValue={1}
                                    >
                                        <Radio.Group>
                                            {shareModeList.map((item) => {
                                                return (
                                                    <Radio
                                                        key={item.key}
                                                        value={item.key}
                                                    >
                                                        {item.label}
                                                    </Radio>
                                                )
                                            })}
                                        </Radio.Group>
                                    </Form.Item>
                                </Col>
                            )
                        }}
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, curValues) => {
                            return (
                                prevValues.shared_type !== curValues.shared_type
                            )
                        }}
                    >
                        {({ getFieldValue }) => {
                            const sharedType = getFieldValue('shared_type')

                            return (
                                <Col span={12}>
                                    <Form.Item
                                        rules={[
                                            {
                                                required: true,
                                                message: `${__('请选择')}${__(
                                                    '开放属性',
                                                )}`,
                                            },
                                        ]}
                                        label={__('开放属性')}
                                        name="open_type"
                                        validateFirst
                                        // initialValue={1}
                                    >
                                        <Radio.Group
                                            disabled
                                            onChange={(value) =>
                                                openTypeChange(
                                                    value?.target?.value,
                                                )
                                            }
                                        >
                                            {openTypeList.map((item) => {
                                                return (
                                                    <Radio
                                                        key={item.key}
                                                        value={item.key}
                                                    >
                                                        {item.label}
                                                    </Radio>
                                                )
                                            })}
                                        </Radio.Group>
                                    </Form.Item>
                                </Col>
                            )
                        }}
                    </Form.Item>
                    <Col span={12}>
                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, curValues) => {
                                return (
                                    prevValues.open_type !== curValues.open_type
                                )
                            }}
                        >
                            {({ getFieldValue }) => {
                                const openType = getFieldValue('open_type')
                                if (OpenTypeEnum.HASCONDITION === openType) {
                                    return (
                                        <Form.Item
                                            label={
                                                <FormItemLabel
                                                    showIcon={isPublish}
                                                    label={__('开放条件')}
                                                />
                                            }
                                            name="open_condition"
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            rules={[
                                                {
                                                    validator:
                                                        keyboardInputValidator(
                                                            ErrorInfo.EXCEPTEMOJI,
                                                        ),
                                                },
                                            ]}
                                            // required
                                        >
                                            <Input
                                                maxLength={128}
                                                placeholder={`${__(
                                                    '请输入',
                                                )}${__('开放条件')}`}
                                            />
                                        </Form.Item>
                                    )
                                }
                                return ''
                            }}
                        </Form.Item>
                    </Col>
                    <LabelTitle label="更多信息" id="more-info" />
                    {!isFileRescType && (
                        <>
                            <Col span={12}>
                                <Form.Item
                                    label={__('数据同步机制')}
                                    name="sync_mechanism"
                                >
                                    <CustomRadio
                                        options={dataSyncMechanismList}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label={__('同步频率')}
                                    name="sync_frequency"
                                    rules={[
                                        {
                                            validator: keyboardInputValidator(
                                                ErrorInfo.EXCEPTEMOJI,
                                            ),
                                        },
                                    ]}
                                >
                                    <Input
                                        maxLength={128}
                                        placeholder={`${__('请输入')}${__(
                                            '同步频率',
                                        )}`}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label={__('数据是否存在物理删除')}
                                    name="physical_deletion"
                                >
                                    <CustomRadio options={YesOrNoList} />
                                </Form.Item>
                            </Col>
                        </>
                    )}
                    <Col span={12}>
                        <Form.Item
                            label={
                                <FormItemLabel
                                    showIcon={isPublish}
                                    label={__('是否上线到超市')}
                                />
                            }
                            name="publish_flag"
                            rules={[
                                {
                                    required: true,
                                    message: `${__('请选择')}${__('是否发布')}`,
                                },
                            ]}
                        >
                            <Radio.Group>
                                {YesOrNoList.map((item) => {
                                    return (
                                        <Radio
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </Radio>
                                    )
                                })}
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={
                                <FormItemLabel
                                    showIcon={isPublish}
                                    label={__('是否可授权运营')}
                                />
                            }
                            name="operation_authorized"
                            rules={[
                                {
                                    required: true,
                                    message: `${__('请选择')}${__(
                                        '是否可授权运营',
                                    )}`,
                                },
                            ]}
                        >
                            <Radio.Group>
                                {YesOrNoList.map((item) => {
                                    return (
                                        <Radio
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </Radio>
                                    )
                                })}
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>

            <div
                className={classNames(
                    styles.menuContainer,
                    showUpdateAlert && isPublish && styles.tipsBaseInfoForm,
                )}
            >
                <Anchor
                    getContainer={() =>
                        (container.current as HTMLElement) || window
                    }
                    className={styles.anchorWrapper}
                    onClick={(e: any) => {
                        e.preventDefault()
                    }}
                >
                    <Link href="#basic-info" title={__('基本属性')} />
                    {!!categorys.filter((item) => item.type !== 'system')
                        ?.length && (
                        <Link
                            href="#resc-attr-classify"
                            title={__('资源属性分类')}
                        />
                    )}
                    <Link href="#share-info" title={__('共享开放信息')} />
                    <Link href="#more-info" title={__('更多信息')} />
                </Anchor>
            </div>
            <Confirm
                open={delVisible}
                title={__('确认要恢复吗？')}
                content={__('恢复后，状态将变成已发布，同时清空编辑内容')}
                onOk={handleDelete}
                onCancel={() => {
                    setDelVisible(false)
                }}
                width={432}
            />
            {relatedMattersOpen && (
                <RelatedMattersModal
                    open={relatedMattersOpen}
                    onOk={(list: any) => {
                        setRelatedMattersOpen(false)
                        setRelatedMattersList(list)
                        form.setFields([
                            {
                                name: 'business_matters',
                                value: list.map((o) => o.id),
                                errors: [],
                            },
                        ])
                    }}
                    initData={relatedMattersList}
                    onClose={() => {
                        setRelatedMattersOpen(false)
                    }}
                />
            )}
        </div>
    )
})
export default BaseInfo
