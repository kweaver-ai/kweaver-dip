import {
    DownOutlined,
    ExclamationCircleFilled,
    InfoCircleOutlined,
} from '@ant-design/icons'
import {
    Anchor,
    Button,
    Col,
    Form,
    Input,
    InputNumber,
    message,
    Popover,
    Radio,
    Row,
    Select,
    Space,
    Spin,
    Tooltip,
    TreeSelect,
} from 'antd'
import { RowSelectionType } from 'antd/es/table/interface'
import classnames from 'classnames'
import lodash, { trim } from 'lodash'
import React, { Key, useEffect, useMemo, useRef, useState } from 'react'
import { confirm } from '@/utils/modalHelper'
import {
    entendNameEnReg,
    ErrorInfo,
    keyboardCharactersReg,
    Operate,
    OperateType,
    StandardizationType,
    stardOrignizeTypeList,
} from '@/utils'
import {
    addDataEle,
    CatalogOption,
    CatalogType,
    checkDataEleNameUnique,
    editDatEle,
    formatError,
    getDataEleAssociateFileList,
    getDataEleDetailById,
    getDataGradeLabelStatus,
    getDirDataBySearch,
    getDirDataByTypeOrId,
    GradeLabelStatusEnum,
    ICheckDataEleRepeat,
    IDataElement,
    IDataItem,
    IDictItem,
    IDirItem,
    IDirQueryType,
    maxDataLengthDecimal,
    maxDataLengthString,
    minDataLengthCommon,
    ValidDERepeatType,
    ValueRangeType,
} from '@/core'
import CodeRuleDetails from '../CodeRulesComponent/CodeRuleDetails'
import CodeTableDetails from '../CodeTableManage/Details'
import CustomDrawer from '../CustomDrawer'
import FileDetails from '../File/Details'
import __ from './locale'
import styles from './styles.module.less'

import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import Loader from '@/ui/Loader'
import EditCodeRule from '../CodeRulesComponent/EditCodeRule'
import EditDictForm from '../CodeTableManage/EditDictForm'
import TagCascader from '../DataClassificationTag/TagCascader'
import DepartmentAndOrgSelect from '../DepartmentAndOrgSelect'
import SelDataByTypeModal from '../SelDataByTypeModal'
import { findParents } from '../StandardDirTree'
import { findDirByKey, StdTreeDataOpt } from '../StandardDirTree/const'
import { dataEleAssociateType, DataType, dataTypeList } from './const'
import {
    validateEmpty,
    validateLessThan,
    validateValueLegitimacy,
} from './validate'

const { Link } = Anchor

interface IEditFormModel {
    type: OperateType
    visible: boolean
    dataEleId?: string
    selectedDir?: IDirItem
    // 指定标准分类
    specifyStdType?: StandardizationType
    style?: React.CSSProperties | undefined
    contentWrapperStyle?: React.CSSProperties
    showShadow?: boolean
    showContinueBtn?: boolean
    // setOprDirItem: (newItem: IDirItem) => void
    getTreeList?: (query?: IDirQueryType, optType?: StdTreeDataOpt) => void
    onClose?: (operate: Operate) => void
    update?: (newSelectedDir?: IDirItem, newDataEle?: IDataElement) => void
    getContainer?: HTMLElement | false
    selCatlgClass?: CatalogOption
}

/**
 * @param type OperateType 操作类型
 * @param visible boolean 显示/隐藏
 * @param dataEleId number? 数据元id
 * @param selectedDir IDirItem? 当前选中目录
 * @param getTreeList 获取目录方法
 * @param onClose operate 取值-确定:Operate.OK 取消:Operate.CANCEL
 * @param update
 */
const EditDataEleForm: React.FC<IEditFormModel> = ({
    visible,
    type = OperateType.CREATE,
    dataEleId,
    selectedDir,
    specifyStdType,
    showShadow = true,
    showContinueBtn = false,
    style,
    contentWrapperStyle = {
        width: '100%',
        boxShadow: 'none',
    },
    getTreeList,
    onClose = (operate: Operate) => {},
    update = (newSelectedDir?: IDirItem, newDataEle?: IDataElement) => {},
    getContainer = false,
    selCatlgClass,
}) => {
    const { checkPermission } = useUserPermCtx()

    const [info] = useCurrentUser()

    const [form] = Form.useForm()

    const ref = useRef<HTMLDivElement>(null)

    const formRef = useRef<HTMLDivElement>(null)

    const hasOprAccess = useMemo(
        () => checkPermission('manageDataStandard'),
        [checkPermission],
    )
    // 是否制定了有效标准类型值
    const hasValidStdType = useMemo(() => {
        return (
            typeof specifyStdType === 'number' &&
            specifyStdType >= 0 &&
            specifyStdType !== StandardizationType.All
        )
    }, [specifyStdType])

    const anchorItems = [
        {
            key: 'basicInfo',
            href: `#basicInfo`,
            title: __('基本属性'),
        },
        {
            key: 'techInfo',
            href: `#techInfo`,
            title: __('技术属性'),
        },
        {
            key: 'qualityInfo',
            href: `#qualityInfo`,
            title: __('质量属性'),
        },
    ]

    const [oprDirItem, setOprDirItem] = useState<IDirItem | undefined>(
        selectedDir,
    )

    // 自定义目录
    const [treeData, setTreeData] = useState<Array<IDirItem>>()

    // 获取详情loading
    const [loading, setLoading] = useState(false)

    const [catlgKeyword, setCatlgKeyword] = useState<string>('')
    const [selectLoading, setSelectLoading] = useState<boolean>(true)
    const [treeExpandedKeys, setTreeExpandedKeys] = useState<Key[]>([])

    // 保存数据元请求Detail
    const [originDetail, setOriginDetail] = useState<any>({})

    // 码表/编码规则详情id
    const [detailIds, setDetailIds] = useState<Array<any>>([])

    // 新建码表对话框
    const [createDictVisible, setCreateDictVisible] = useState(false)

    // 新建编码规则对话框
    const [createCRVisible, setCreateCRVisible] = useState(false)

    // 码表详情
    const [codeTbDetailVisible, setCodeTbDetailVisible] =
        useState<boolean>(false)

    // 编码规则详情
    const [codeRuleDetailVisible, setCodeRuleDetailVisible] =
        useState<boolean>(false)
    // 文件详情
    const [fileDetailVisible, setFileDetailVisible] = useState<boolean>(false)

    // 对话框按钮类型
    const [footerOprBtnType, setFooterOprBtnType] = useState<Operate>()

    // 是否开启数据分级
    const [isStart, setIsStart] = useState(false)

    const getTagStatus = async () => {
        try {
            const res = await getDataGradeLabelStatus()
            setIsStart(res === GradeLabelStatusEnum.Open)
        } catch (error) {
            formatError(error)
        }
    }

    const useFirstDepartmentId = useMemo(() => {
        const firstDepartmentId = info?.ParentDeps?.[0]?.path_id.split('/')
        return firstDepartmentId[firstDepartmentId.length - 1]
    }, [info])

    useEffect(() => {
        getTagStatus()
    }, [])

    // 获取自定义目录
    const getDataEleTreeList = async (
        query?: IDirQueryType,
        optType?: StdTreeDataOpt,
    ) => {
        try {
            setSelectLoading(true)
            let res

            if (query) {
                res = await getDirDataBySearch(query)
            } else {
                res = await getDirDataByTypeOrId(CatalogType.DATAELE, undefined)
            }
            const data = res.data ? res.data : []
            const parentId = data.length > 0 ? data[0].id.toString() : ''
            setTreeData(data)

            // 展开节点
            const oprDirItemTemp = findDirByKey(
                oprDirItem?.id || '',
                data || [],
            )
            const allParents = findParents(
                data as any,
                oprDirItemTemp?.parent_id || '',
            )
            const treeExpandedKeysTemp = [...(treeExpandedKeys || [])]
            allParents?.forEach((node) => {
                const { id } = node
                if (!treeExpandedKeys.includes(id)) {
                    treeExpandedKeysTemp.push(id)
                }
            })
            setTreeExpandedKeys(treeExpandedKeysTemp)
        } catch (error) {
            formatError(error)
        } finally {
            setSelectLoading(false)
        }
    }

    const onTreeExpand = (eks: Key[]) => {
        setTreeExpandedKeys(eks)
    }

    useEffect(() => {
        if (visible) {
            // 获取数据元所属自定义目录
            getDataEleTreeList()
            if (type === OperateType.EDIT && dataEleId) {
                getDataEleDetail()
                return
            }
            if (type === OperateType.CREATE) {
                setOprDirItem(selectedDir)
                const initFormValues = {
                    catalog_id: oprDirItem?.id ?? undefined,
                    relation_type: ValueRangeType.None,
                    data_type: undefined,
                    description: '',
                    synonym: '',
                    // 默认码表
                    dict_id: [],
                    name_cn: '',
                    name_en: '',
                    std_type: specifyStdType,
                    std_files: undefined,
                    empty_flag: 0,
                }
                // 新建默认值
                form.setFieldsValue(initFormValues)
                // 保存原始form值
                setOriginDetail(initFormValues)
            }
        } else {
            setSelDataItems([])
            setOprDirItem(selectedDir)
        }
    }, [dataEleId, visible])

    useEffect(() => {
        setDefaultDirVal(oprDirItem?.catalog_name || '')
        if (selCatlgClass !== CatalogOption.DEPARTMENT) {
            form.setFieldValue('catalog_id', oprDirItem?.id || undefined)
            form.setFieldValue(
                'department_ids',
                useFirstDepartmentId || undefined,
            )
        } else {
            form.setFieldValue('catalog_id', '11')
            form.setFieldValue(
                'department_ids',
                oprDirItem?.id || useFirstDepartmentId || undefined,
            )
        }
    }, [oprDirItem, selCatlgClass, useFirstDepartmentId])

    // 获取表单详细信息(其中，dict_id为码表中对应的f_code字段，与新增/修改时字段不同)
    const getDataEleDetail = async () => {
        if (!dataEleId || dataEleId === '') return
        try {
            setLoading(true)

            const [dataEleDetail, stdFiles] = await Promise.all([
                getDataEleDetailById({
                    type: 1,
                    value: dataEleId,
                }),
                // 获取文件关联码表
                getDataEleAssociateFileList({
                    id: dataEleId,
                    offset: 1,
                    limit: 10000,
                }),
            ])
            if (dataEleDetail.data) {
                const {
                    catalog_id,
                    catalog_name,
                    data_length,
                    data_precision,
                    data_type,
                    description,
                    // dict_code,
                    dict_id,
                    dict_name_cn,
                    name_cn,
                    name_en,
                    rule_id,
                    rule_name,
                    std_type,
                    synonym,
                    label_id,
                    relation_type,
                    empty_flag,
                    department_id,
                } = dataEleDetail.data
                // 保存form原始值
                let detail = {
                    catalog_id,
                    // data_length,
                    // data_precision,
                    data_type,
                    description: description || '',
                    relation_type,
                    name_cn,
                    name_en,
                    std_type,
                    synonym,
                    label_id,
                    std_files: stdFiles?.data?.map((fItem) => {
                        return {
                            label: fItem.name,
                            value: fItem?.name,
                            key: fItem?.file_id,
                        }
                    }),
                    empty_flag,
                }

                const otherParams: any = {}
                if (dict_id && dict_name_cn) {
                    otherParams.dict_id = [
                        {
                            label: dict_name_cn,
                            value: dict_name_cn,
                            key: dict_id,
                        },
                    ]
                } else if (rule_id && rule_name) {
                    otherParams.rule_id = [
                        {
                            label: rule_name,
                            value: rule_name,
                            key: rule_id,
                        },
                    ]
                }

                // 数据类型为数字型/字符型/二进制(type: 0/1/6)时显示数据长度
                // 数据类型为数字型(type: 0)时显示数据精度
                if ([DataType.TCHAR, DataType.TDECIMAL].includes(data_type)) {
                    otherParams.data_length = data_length
                }
                if (data_type === DataType.TDECIMAL) {
                    otherParams.data_precision = data_precision
                }
                // 兼容老数据的数字型 展示
                if (data_type === DataType.TNUMBER) {
                    otherParams.data_type = __('数字型')
                }

                detail = {
                    ...detail,
                    ...otherParams,
                }
                form.setFieldsValue(detail)
                setOriginDetail({
                    ...(dataEleDetail?.data || {}),
                    ...detail,
                    department_id,
                })
                setOprDirItem({
                    id: catalog_id,
                    catalog_name,
                    parent_id: '',
                })
            }
        } catch (e) {
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    // 提交状态
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 修改/新增确认请求(其中，dict_id对应码表中的f_id，与修改获取时时不同)
    const onFinish = async (values: any) => {
        setIsSubmitting(true)
        const {
            catalog_id,
            name_cn,
            name_en,
            synonym,
            std_files,
            description,
            std_type,
            data_type,
            data_length,
            data_precision,
            dict_id,
            rule_id,
            label_id,
            relation_type,
            empty_flag,
            department_ids,
        } = values
        const query: any = {
            catalog_id,
            name_cn,
            name_en,
            std_type,
            std_files: std_files?.map((fItem) => fItem.key),
            synonym,
            data_type:
                data_type === __('数字型') ? DataType.TNUMBER : data_type,
            data_length: data_length || 0,
            data_precision,
            description: (description && description.trim()) || '',
            label_id: Array.isArray(label_id)
                ? label_id[label_id.length - 1]
                : typeof label_id === 'string'
                ? label_id
                : '',
            relation_type,
            empty_flag,
            department_ids,
        }

        if (dict_id) {
            query.dict_id = dict_id[0]?.key
        } else if (rule_id) {
            query.rule_id = rule_id[0]?.key
        }

        try {
            let res: any = query
            if (type === OperateType.CREATE) {
                res = await addDataEle(query)
                message.success('新建成功')
            } else if (dataEleId) {
                await editDatEle(dataEleId, query)
                message.success('编辑成功')
            }
            // onClose(Operate.OK)
            update(oprDirItem, res?.data)
            if (footerOprBtnType) {
                if (footerOprBtnType === Operate.OK_AND_CONTINUEOPR) {
                    form.resetFields()
                    // 新建默认值
                    form.setFieldsValue({
                        catalog_id: oprDirItem?.id ?? undefined,
                        relation_type: ValueRangeType.None,
                        data_type: undefined,
                        description: '',
                        synonym: '',
                        dict_id: [],
                        name_cn: '',
                        name_en: '',
                        rule_id: [],
                        std_type: specifyStdType,
                    })
                } else {
                    onClose(footerOprBtnType)
                }
            }
        } catch (error: any) {
            if (error.status === 400) {
                // 消息队列异常，特殊处理
                if (
                    error.data &&
                    error.data.code &&
                    error.data.code === 'Standardization.Incorrect'
                ) {
                    message.error(error.data.description)
                    return
                }
                const details = error.data.detail
                if (details) {
                    details.forEach((dItem: any) => {
                        message.error(dItem.Message)
                    })
                    return
                }
            }
            formatError(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const validateSynonym = (regReg: RegExp, msg: string) => {
        return (_: any, value: any) => {
            return new Promise((resolve, reject) => {
                if (!value) resolve(1)
                const synonym = value.split(/[,，]/)
                synonym?.forEach((sItem) => {
                    if (!regReg.test(trim(sItem))) {
                        return reject(new Error(msg))
                    }
                    if (trim(sItem)?.length > 20) {
                        return reject(
                            new Error(__('单个同义词长度不能超过20字符')),
                        )
                    }
                    return undefined
                })
                resolve(1)
            })
        }
    }

    const handleValidateRepeat = async (
        key: string,
        params: ICheckDataEleRepeat,
        errMsg?: string,
    ): Promise<void> => {
        let res: any = {}
        let reqParams = { ...params }
        let data
        // 编辑
        if (type === OperateType.EDIT) {
            reqParams = { ...params, id: dataEleId }
        }
        if (key === 'synonym') {
            data = form.getFieldValue('synonym')?.split(/[,，]/) || []
        }

        switch (key) {
            case 'name_cn':
            case 'name_en':
                if (stdTypeList.find((t) => t.value === params.std_type)) {
                    res = await checkDataEleNameUnique(reqParams)
                }
                break
            case 'synonym':
                res.data =
                    data?.filter(
                        (sItem: any, sIndex: number) =>
                            data.indexOf(sItem) !== sIndex,
                    )?.length > 0
                break
            default:
                break
        }

        if (res?.data) {
            return Promise.reject(
                new Error(errMsg || __('名称已存在，请重新输入')),
            )
        }

        return Promise.resolve()
    }

    /**
     * 展示详情页面（如编码规则/码表详情）
     * @param dataType 查看数据类型
     * @param dataId 查看的数据id
     */
    const handleShowDataDetail = (dataType: CatalogType, dataId?: string) => {
        let myDetailIds: any[] = []
        let firstId: string
        switch (dataType) {
            case CatalogType.CODETABLE:
                // 码表详情
                if (dataId) {
                    // 选择对话框中选择列表中码表查看详情
                    myDetailIds = [{ key: dataId }]
                } else {
                    // form表单中查看详情
                    myDetailIds = form.getFieldValue('dict_id')
                }
                firstId = myDetailIds.length > 0 ? myDetailIds[0] : ''
                if (myDetailIds.length && firstId !== '') {
                    setDetailIds(myDetailIds)
                    setCodeTbDetailVisible(true)
                }
                break
            case CatalogType.CODINGRULES:
                // 编码规则详情
                if (dataId) {
                    // 选择对话框中选择列表中编码规则查看详情
                    myDetailIds = [{ key: dataId }]
                } else {
                    // form表单中查看详情
                    myDetailIds = form.getFieldValue('rule_id')
                }
                firstId = myDetailIds.length > 0 ? myDetailIds[0] : ''
                if (myDetailIds.length && firstId !== '') {
                    setDetailIds(myDetailIds)

                    setCodeRuleDetailVisible(true)
                }
                break
            case CatalogType.FILE:
                // 文件详情
                if (dataId) {
                    // 选择对话框中选择列表中文件查看详情
                    myDetailIds = [{ key: dataId }]
                } else {
                    // form表单中查看详情
                    myDetailIds = form.getFieldValue('std_files')
                }
                firstId = myDetailIds.length > 0 ? myDetailIds[0] : ''
                if (myDetailIds.length && firstId !== '') {
                    setDetailIds(myDetailIds)
                    setFileDetailVisible(true)
                }
                break
            default:
                break
        }
    }

    // 取消新建码表/编码规则
    const handleOperateCancel = (
        oprCatlgType: CatalogType,
        operate?: Operate,
    ) => {
        if (oprCatlgType === CatalogType.CODETABLE) {
            // 新建码表
            if (operate === Operate.OK) {
                setCreateDictVisible(false)
            } else {
                // 新建或编辑
                confirm({
                    title: '确认要离开当前页面吗？',
                    icon: <ExclamationCircleFilled />,
                    content: '现在离开页面，将不会保存已填写内容。',
                    className: 'modal-center commConfirm',
                    onOk() {
                        setCreateDictVisible(false)
                    },
                })
            }
        } else if (oprCatlgType === CatalogType.CODINGRULES) {
            // 新建编码规则
            setCreateCRVisible(false)
        }
    }

    // label信息
    const labelText = (text: string, key?: string) => {
        const fItemKey = key || ''
        if (['synonym', 'data_length', 'data_precision'].includes(fItemKey)) {
            let tipContent = ''
            switch (fItemKey) {
                case 'synonym':
                    tipContent = __('检索时，可通过检索同义词查找记录')
                    break
                case 'data_length':
                    tipContent =
                        form.getFieldValue('data_type') === DataType.TCHAR
                            ? __('只能输入1～65535之间的整数')
                            : form.getFieldValue('data_type') ===
                              DataType.TDECIMAL
                            ? __('只能输入1～38之间的整数')
                            : ''
                    break
                case 'data_precision':
                    tipContent = __(
                        '只能输入0～x之间的整数，x=上方设置的数据长度值',
                    )
                    break
                default:
                    break
            }
            return (
                <>
                    <div className={styles.textSecondaryColor}>{text}</div>
                    <Popover
                        overlayClassName={styles.tipPopover}
                        placement="right"
                        content={tipContent}
                    >
                        <InfoCircleOutlined
                            style={{ color: '#333' }}
                            className={styles.tipIcon}
                        />
                    </Popover>
                </>
            )
        }
        if (['dict_id', 'rule_id'].includes(fItemKey)) {
            const dataId =
                fItemKey === 'dict_id'
                    ? form.getFieldValue('dict_id')
                    : form.getFieldValue('rule_id')

            // 码表/编码规则是否被删除
            const isQuoteDeleted =
                fItemKey === 'dict_id'
                    ? originDetail?.dict_id?.[0]?.key === dataId?.[0]?.key &&
                      originDetail.dict_deleted
                    : originDetail?.rule_id?.[0]?.key === dataId?.[0]?.key &&
                      originDetail?.rule_deleted

            return (
                <div
                    className={styles.formItemLabel}
                    onClick={(e: any) => e.preventDefault()}
                >
                    <div>{text}</div>
                    <Space size={16} className={styles.formItemOprWrapper}>
                        {hasOprAccess && (
                            <span
                                className={styles.link}
                                onClick={(e: any) => {
                                    // e.preventDefault()

                                    // dictCodeRef?.current?.blur()

                                    if (key === 'dict_id') {
                                        setCreateDictVisible(true)
                                    } else if (key === 'rule_id') {
                                        setCreateCRVisible(true)
                                    }
                                }}
                            >
                                新建
                            </span>
                        )}
                        {hasOprAccess && dataId && dataId.length > 0 && (
                            <Tooltip
                                title={
                                    isQuoteDeleted &&
                                    __('已被删除，无法查看详情')
                                }
                            >
                                <Button
                                    type="link"
                                    className={styles.link}
                                    disabled={isQuoteDeleted}
                                    onClick={(e: any) => {
                                        // e.preventDefault()
                                        if (key === 'dict_id') {
                                            handleShowDataDetail(
                                                CatalogType.CODETABLE,
                                            )
                                        } else if (key === 'rule_id') {
                                            handleShowDataDetail(
                                                CatalogType.CODINGRULES,
                                            )
                                        }
                                    }}
                                >
                                    {__('详情')}
                                </Button>
                            </Tooltip>
                        )}
                    </Space>
                </div>
            )
        }
        return <div className={styles.textSecondaryColor}>{text}</div>
    }

    const stdTypeList = stardOrignizeTypeList.slice(1)

    // // 可增删input信息array
    // const addDelInputArr = [
    //     {
    //         name: 'synonym',
    //         label: '同义词',
    //         placeholder: '请输入',
    //     },
    // ]

    // const addDelInputList = (item: any) => (
    //     <Form.List initialValue={['']} name={item.name}>
    //         {(fields, { add, remove }) => {
    //             return (
    //                 <>
    //                     {fields.map((field, index) => (
    //                         <Form.Item
    //                             noStyle
    //                             shouldUpdate={(prevValues, curValues) =>
    //                                 prevValues.synonym !== curValues.synonym
    //                             }
    //                         >
    //                             <Form.Item
    //                                 label={
    //                                     index === 0 ? labelText(item.label) : ''
    //                                 }
    //                                 key={field.key}
    //                             >
    //                                 <Space className={styles.rowWrapper}>
    //                                     <Form.Item
    //                                         {...field}
    //                                         validateFirst
    //                                         rules={[
    //                                             {
    //                                                 validator:
    //                                                     validateValueLegitimacy(
    //                                                         commReg,
    //                                                         ErrorInfo.EXTENDCNNAME2,
    //                                                     ),
    //                                             },
    //                                             {
    //                                                 validator: (e, value) =>
    //                                                     validateRepeat(
    //                                                         value,
    //                                                         item.label,
    //                                                         item.name,
    //                                                     ),
    //                                             },
    //                                         ]}
    //                                         noStyle
    //                                     >
    //                                         <Input
    //                                             style={{
    //                                                 width: 532,
    //                                             }}
    //                                             placeholder={item.placeholder}
    //                                             maxLength={20}
    //                                         />
    //                                     </Form.Item>
    //                                     <span className={styles.btnWrapper}>
    //                                         <Form.Item
    //                                             noStyle
    //                                             shouldUpdate={(
    //                                                 prevValues,
    //                                                 curValues,
    //                                             ) => {
    //                                                 return (
    //                                                     prevValues[
    //                                                         item.name
    //                                                     ] !==
    //                                                     curValues[item.name]
    //                                                 )
    //                                             }}
    //                                         >
    //                                             {({ getFieldValue }) => {
    //                                                 const rules: string[] =
    //                                                     getFieldValue(item.name)
    //                                                 const current = rules[index]

    //                                                 // 筛选出重复的(若length>1，表明出本身以外还有其他重复数据)
    //                                                 const repeatVals =
    //                                                     rules.filter(
    //                                                         (sItem) =>
    //                                                             sItem &&
    //                                                             current &&
    //                                                             trim(sItem) ===
    //                                                                 trim(
    //                                                                     current,
    //                                                                 ),
    //                                                     )
    //                                                 const enabled =
    //                                                     current &&
    //                                                     repeatVals.length === 1
    //                                                 return (
    //                                                     <>
    //                                                         {fields.length !==
    //                                                             1 && (
    //                                                             <RecycleBinOutlined
    //                                                                 className="deleteIcon iconEnabled"
    //                                                                 onClick={() => {
    //                                                                     remove(
    //                                                                         field.name,
    //                                                                     )
    //                                                                     if (
    //                                                                         fields.length ===
    //                                                                         1
    //                                                                     ) {
    //                                                                         add()
    //                                                                     }
    //                                                                 }}
    //                                                             />
    //                                                         )}
    //                                                         {fields.length ===
    //                                                             index + 1 &&
    //                                                             fields.length <
    //                                                                 10 && (
    //                                                                 <AddOutlined
    //                                                                     onClick={() =>
    //                                                                         enabled &&
    //                                                                         add()
    //                                                                     }
    //                                                                     className={`addIcon ${
    //                                                                         enabled
    //                                                                             ? 'iconEnabled'
    //                                                                             : 'iconDisabled'
    //                                                                     }`}
    //                                                                 />
    //                                                             )}
    //                                                     </>
    //                                                 )
    //                                             }}
    //                                         </Form.Item>
    //                                     </span>
    //                                 </Space>
    //                             </Form.Item>
    //                         </Form.Item>
    //                     ))}
    //                 </>
    //             )
    //         }}
    //     </Form.List>
    // )

    // 编辑选择数据对话框（用于码表/编码规则/标准文件的选择对话框）
    const [selDataByTypeVisible, setSelDataByTypeVisible] = useState(false)

    // 选择数据对话框ref
    const selDataRef = useRef({
        reloadData: () => {},
    })

    // 选择数据对话框的类型（取值：码表/编码规则/标准文件）
    const [selDataType, setSelDataType] = useState<CatalogType>(
        CatalogType.DATAELE,
    )

    // 选择数据对话框数据选择类型-单选/多选
    const [rowSelectionType, setRowSelectionType] =
        useState<RowSelectionType>('radio')

    // 选择数据对话框标题
    const [selDataTypeName, setSelDataTypeName] = useState('')
    const [selDataItems, setSelDataItems] = useState<IDataItem[]>([])

    useEffect(() => {
        let selData
        if (selDataByTypeVisible) {
            // 设置码表/编码规则/文件选中项（form当前值）
            switch (selDataType) {
                case CatalogType.CODETABLE:
                    setSelDataTypeName('码表')
                    selData = form.getFieldValue('dict_id')
                    break
                case CatalogType.CODINGRULES:
                    setSelDataTypeName('编码规则')
                    selData = form.getFieldValue('rule_id')
                    break
                case CatalogType.FILE:
                    setSelDataTypeName('文件')
                    selData = form.getFieldValue('std_files')
                    break
                default:
                    break
            }
            setSelDataItems(selData || [])
        }
    }, [selDataByTypeVisible])

    // 码表
    const [dictCode, setDictCode] = useState<IDataItem[]>([])
    // 编码规则
    const [ruleList, setRuleList] = useState<IDataItem[]>([])
    // 关联标准文件列表
    const [stdFileList, setStdFileList] = useState<IDataItem[]>([])

    const onSelDataTypeClose = () => {
        setSelDataByTypeVisible(false)
    }

    const dirRef: any = useRef(null)
    const dictCodeRef: any = useRef(null)
    const ruleRef: any = useRef(null)
    const fileRef: any = useRef(null)

    const [defaultDirVal, setDefaultDirVal] = useState(
        oprDirItem?.catalog_name || '',
    )

    const handleCancel = () => {
        const values = form.getFieldsValue()
        let isSame = true
        Object.keys(values).forEach((key) => {
            if (!lodash.isEqual(originDetail[key], values[key])) {
                isSame = false
            }
        })
        // 内容不变
        if (isSame) {
            onClose(Operate.OK)
        } else {
            onClose(Operate.CANCEL)
        }
    }

    const handleFooterBtnClick = async (oprType: Operate) => {
        setFooterOprBtnType(oprType)
        if ([Operate.OK, Operate.OK_AND_CONTINUEOPR].includes(oprType)) {
            form.submit()
        } else {
            handleCancel()
        }
    }

    const handleTypeChange = () => {
        form.setFieldsValue({
            data_length: undefined,
            data_precision: undefined,
        })
        form.validateFields(['data_length', 'data_precision'])
    }

    const footer = (
        <Space>
            <Button
                className={styles.cancelBtn}
                onClick={() => handleFooterBtnClick(Operate.CANCEL)}
            >
                取消
            </Button>
            {showContinueBtn && (
                <Button
                    className={styles.okBtn}
                    type="primary"
                    htmlType="submit"
                    onClick={() =>
                        handleFooterBtnClick(Operate.OK_AND_CONTINUEOPR)
                    }
                    disabled={isSubmitting}
                >
                    确认并继续添加
                </Button>
            )}
            <Button
                className={styles.okBtn}
                type="primary"
                htmlType="submit"
                onClick={() => handleFooterBtnClick(Operate.OK)}
                disabled={isSubmitting}
            >
                确定
            </Button>
        </Space>
    )

    return (
        <div className={styles.editDataEleWrapper}>
            <CustomDrawer
                open={visible}
                onClose={handleCancel}
                handleOk={() => form.submit()}
                loading={isSubmitting}
                headerWidth="100%"
                rootClassName={styles.editDrawerWrapper}
                title={`${type === OperateType.CREATE ? '新建' : '编辑'}数据元`}
                style={style}
                contentWrapperStyle={contentWrapperStyle}
                bodyStyle={{
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
                customBodyStyle={{
                    height: 'auto',
                    flex: 1,
                }}
                customHeaderStyle={{
                    padding: '0 24px',
                }}
                customTitleStyle={{
                    height: 20,
                    width: 'auto',
                    maxWidth: 1146,
                    margin: '16px auto 24px',
                }}
                footerExtend={footer}
                getContainer={getContainer}
            >
                {showShadow && <div className={styles.bodyShadow} />}
                {loading ? (
                    <div className={styles.showEmpty}>
                        <Loader />
                    </div>
                ) : (
                    <div className={styles.editBodyWrapper} ref={ref}>
                        <div ref={formRef} className={styles.formWrapper}>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                                autoComplete="off"
                                style={{ width: '100%' }}
                            >
                                <div
                                    className={styles.formSortTitle}
                                    id="basicInfo"
                                >
                                    {__('基本属性')}
                                </div>
                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item
                                            label={labelText('数据元名称')}
                                            name="name_cn"
                                            required
                                            validateFirst
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            dependencies={['std_type']}
                                            rules={[
                                                {
                                                    validator: validateEmpty(
                                                        __('输入不能为空'),
                                                    ),
                                                    transform: (
                                                        value: string,
                                                    ) => trim(value),
                                                },
                                                // {
                                                //     validator:
                                                //         validateValueLegitimacy(
                                                //             commReg,
                                                //             ErrorInfo.EXTENDCNNAME,
                                                //         ),
                                                // },
                                                {
                                                    validateTrigger: ['onBlur'],
                                                    validator: (e, value) =>
                                                        handleValidateRepeat(
                                                            'name_cn',
                                                            {
                                                                name: value,
                                                                repeat_type:
                                                                    ValidDERepeatType.NAME_CN,
                                                                std_type:
                                                                    form.getFieldValue(
                                                                        'std_type',
                                                                    ),
                                                            },
                                                        ),
                                                },
                                            ]}
                                        >
                                            <Input
                                                className={styles.formsBase}
                                                placeholder={__(
                                                    '请输入数据元名称',
                                                )}
                                                maxLength={128}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={labelText('英文名称')}
                                            name="name_en"
                                            required
                                            validateFirst
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            dependencies={['std_type']}
                                            rules={[
                                                {
                                                    validator: validateEmpty(
                                                        __('输入不能为空'),
                                                    ),
                                                },
                                                {
                                                    validator:
                                                        validateValueLegitimacy(
                                                            entendNameEnReg,
                                                            ErrorInfo.EXTENDENNAME,
                                                        ),
                                                },
                                                {
                                                    validateTrigger: ['onBlur'],
                                                    validator: (e, value) =>
                                                        handleValidateRepeat(
                                                            'name_en',
                                                            {
                                                                name: value,
                                                                repeat_type:
                                                                    ValidDERepeatType.NAME_EN,
                                                                std_type:
                                                                    form.getFieldValue(
                                                                        'std_type',
                                                                    ),
                                                            },
                                                        ),
                                                },
                                            ]}
                                        >
                                            <Input
                                                className={styles.formsBase}
                                                placeholder={__(
                                                    '请输入英文名称',
                                                )}
                                                maxLength={128}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            label={labelText(
                                                '同义词',
                                                'synonym',
                                            )}
                                            name="synonym"
                                            // required
                                            validateFirst
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            rules={[
                                                // {
                                                //     validator: validateEmpty(
                                                //         __('输入不能为空'),
                                                //     ),
                                                // },
                                                {
                                                    validator: validateSynonym(
                                                        keyboardCharactersReg,
                                                        ErrorInfo.EXCEPTEMOJI,
                                                    ),
                                                    transform: (
                                                        value: string,
                                                    ) => trim(value),
                                                },
                                                {
                                                    validateTrigger: ['onBlur'],
                                                    validator: (e, value) =>
                                                        handleValidateRepeat(
                                                            'synonym',
                                                            {},
                                                            __(
                                                                '同义词已存在，请重新输入',
                                                            ),
                                                        ),
                                                },
                                            ]}
                                        >
                                            <Input.TextArea
                                                className={styles.formsBase}
                                                placeholder={__(
                                                    '请输入同义词（多个同义词用中文“，”或英文逗号“,”隔开）',
                                                )}
                                                style={{
                                                    height: 80,
                                                    resize: 'none',
                                                }}
                                                maxLength={300}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={labelText('所属目录')}
                                            name="catalog_id"
                                            required
                                            rules={[
                                                {
                                                    validator: validateEmpty(
                                                        __('输入不能为空'),
                                                    ),
                                                },
                                            ]}
                                        >
                                            <TreeSelect
                                                treeData={treeData}
                                                fieldNames={{
                                                    value: 'id',
                                                    label: 'catalog_name',
                                                    children: 'children',
                                                }}
                                                className={styles.formsBase}
                                                popupClassName={
                                                    styles.selectTreeBox
                                                }
                                                switcherIcon={<DownOutlined />}
                                                style={{ width: '100%' }}
                                                getPopupContainer={(n) => n}
                                                showSearch
                                                dropdownStyle={{
                                                    maxHeight: 400,
                                                    overflow: 'auto',
                                                }}
                                                onSearch={(value) => {
                                                    setCatlgKeyword(value)
                                                }}
                                                treeNodeFilterProp="catalog_name"
                                                placeholder={__(
                                                    '请选择所属自定义目录',
                                                )}
                                                notFoundContent={
                                                    selectLoading ? (
                                                        <Spin />
                                                    ) : catlgKeyword ? (
                                                        __('未找到匹配的结果')
                                                    ) : (
                                                        __('暂无数据')
                                                    )
                                                }
                                                treeExpandedKeys={
                                                    treeExpandedKeys
                                                }
                                                onTreeExpand={onTreeExpand}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={labelText('所属组织结构')}
                                            name="department_ids"
                                            required
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        __(
                                                            '请选择所属组织结构',
                                                        ),
                                                },
                                            ]}
                                        >
                                            <DepartmentAndOrgSelect
                                                placeholder={__(
                                                    '请选择所属组织结构',
                                                )}
                                                defaultValue={
                                                    originDetail?.department_id ||
                                                    (selCatlgClass ===
                                                    CatalogOption.DEPARTMENT
                                                        ? oprDirItem?.id ||
                                                          useFirstDepartmentId
                                                        : useFirstDepartmentId) ||
                                                    undefined
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={labelText('关联文件')}
                                            name="std_files"
                                            validateFirst
                                            // rules={[
                                            //     {
                                            //         validator:
                                            //             validateEmpty(
                                            //                 '请选择关联文件',
                                            //             ),
                                            //     },
                                            // ]}
                                        >
                                            <Select
                                                ref={fileRef}
                                                labelInValue
                                                mode="tags"
                                                className={classnames(
                                                    styles.formsBase,
                                                    styles.hideSelectEmpty,
                                                )}
                                                open={false}
                                                placeholder={
                                                    __('请选择关联标准文件') +
                                                    __('（可多选）')
                                                }
                                                onClick={(e) => {
                                                    e.stopPropagation()

                                                    setSelDataType(
                                                        CatalogType.FILE,
                                                    )
                                                    setRowSelectionType(
                                                        'checkbox',
                                                    )
                                                    setSelDataByTypeVisible(
                                                        true,
                                                    )
                                                    fileRef?.current?.blur()
                                                }}
                                                maxTagTextLength={10}
                                                maxTagCount={3}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={labelText('标准分类')}
                                            name="std_type"
                                            required={!hasValidStdType}
                                            validateFirst
                                            rules={[
                                                {
                                                    validator: validateEmpty(
                                                        __('请选择标准分类'),
                                                    ),
                                                },
                                            ]}
                                        >
                                            <Select
                                                className={styles.formsBase}
                                                placeholder={__(
                                                    '请选择标准分类',
                                                )}
                                                options={stdTypeList}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                                disabled={hasValidStdType}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="empty_flag"
                                            label={__('是否为空字段')}
                                            initialValue={0}
                                            required
                                        >
                                            <Radio.Group>
                                                <Radio value={1}>
                                                    {__('是')}
                                                </Radio>
                                                <Radio value={0}>
                                                    {__('否')}
                                                </Radio>
                                            </Radio.Group>
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            label={labelText('说明')}
                                            name="description"
                                        >
                                            <Input.TextArea
                                                className={styles.showCount}
                                                style={{
                                                    height: 100,
                                                    resize: `none`,
                                                }}
                                                placeholder={__('请输入说明')}
                                                showCount
                                                maxLength={300}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <div
                                    className={styles.formSortTitle}
                                    id="techInfo"
                                >
                                    {__('技术属性')}
                                </div>
                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item
                                            label={labelText('数据类型')}
                                            name="data_type"
                                            required
                                            validateFirst
                                            rules={[
                                                {
                                                    validator: validateEmpty(
                                                        __('请选择数据类型'),
                                                    ),
                                                },
                                                {
                                                    validator: (_, val) => {
                                                        if (
                                                            val ===
                                                                __('数字型') ||
                                                            val ===
                                                                DataType.TNUMBER
                                                        ) {
                                                            return Promise.reject(
                                                                new Error(
                                                                    __(
                                                                        '当前数据类型已拆分，请重新选择更具体的类型',
                                                                    ),
                                                                ),
                                                            )
                                                        }
                                                        return Promise.resolve()
                                                    },
                                                },
                                            ]}
                                        >
                                            <Select
                                                className={styles.formsBase}
                                                placeholder={__(
                                                    '请选择数据类型',
                                                )}
                                                options={dataTypeList}
                                                onChange={handleTypeChange}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(prevValues, curValues) =>
                                            prevValues.data_type !==
                                            curValues.data_type
                                        }
                                    >
                                        {({ getFieldValue }) => {
                                            const dataType =
                                                getFieldValue('data_type')

                                            if (
                                                dataType ===
                                                    DataType.TDECIMAL ||
                                                dataType === DataType.TCHAR
                                            ) {
                                                return (
                                                    <Col span={12}>
                                                        <Form.Item
                                                            label={labelText(
                                                                __('数据长度'),
                                                                'data_length',
                                                            )}
                                                            name="data_length"
                                                            validateFirst
                                                            validateTrigger={[
                                                                'onChange',
                                                                'onBlur',
                                                            ]}
                                                            rules={[
                                                                {
                                                                    required:
                                                                        dataType ===
                                                                        DataType.TDECIMAL,
                                                                    message:
                                                                        dataType ===
                                                                        DataType.TDECIMAL
                                                                            ? __(
                                                                                  '请输入1~38之间的整数',
                                                                              )
                                                                            : __(
                                                                                  '请输入1~65535之间的整数',
                                                                              ),
                                                                },
                                                            ]}
                                                        >
                                                            <InputNumber
                                                                className={
                                                                    styles.formsBase
                                                                }
                                                                placeholder={__(
                                                                    '请输入数据长度',
                                                                )}
                                                                min={
                                                                    minDataLengthCommon
                                                                }
                                                                max={
                                                                    dataType ===
                                                                    DataType.TCHAR
                                                                        ? maxDataLengthString
                                                                        : maxDataLengthDecimal
                                                                }
                                                                precision={0}
                                                                onChange={() =>
                                                                    form.validateFields(
                                                                        [
                                                                            'data_precision',
                                                                        ],
                                                                    )
                                                                }
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                )
                                            }

                                            return null
                                        }}
                                    </Form.Item>
                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(prevValues, curValues) =>
                                            prevValues.data_type !==
                                                curValues.data_type ||
                                            prevValues.data_length !==
                                                curValues.data_length
                                        }
                                    >
                                        {({ getFieldValue }) => {
                                            if (
                                                getFieldValue('data_type') ===
                                                DataType.TDECIMAL
                                            ) {
                                                return (
                                                    <Col span={12}>
                                                        <Form.Item
                                                            label={labelText(
                                                                __('数据精度'),
                                                                'data_precision',
                                                            )}
                                                            name="data_precision"
                                                            validateFirst
                                                            validateTrigger={[
                                                                'onChange',
                                                                'onBlur',
                                                            ]}
                                                            rules={[
                                                                {
                                                                    required:
                                                                        true,
                                                                    message:
                                                                        __(
                                                                            '请输入数据精度',
                                                                        ),
                                                                },
                                                                {
                                                                    validator:
                                                                        getFieldValue(
                                                                            'data_length',
                                                                        )
                                                                            ? validateLessThan(
                                                                                  getFieldValue(
                                                                                      'data_length',
                                                                                  ),
                                                                                  __(
                                                                                      '数据精度不能大于数据长度',
                                                                                  ),
                                                                              )
                                                                            : () =>
                                                                                  Promise.resolve(),
                                                                },
                                                            ]}
                                                        >
                                                            <InputNumber
                                                                className={
                                                                    styles.formsBase
                                                                }
                                                                placeholder={__(
                                                                    '请先输入数据长度，再输入数据精度',
                                                                )}
                                                                precision={0}
                                                                min={0}
                                                                max={getFieldValue(
                                                                    'data_length',
                                                                )}
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                )
                                            }

                                            return null
                                        }}
                                    </Form.Item>
                                </Row>

                                <div
                                    className={styles.formSortTitle}
                                    id="qualityInfo"
                                >
                                    {__('质量属性')}
                                </div>
                                <Form.Item
                                    name="relation_type"
                                    required
                                    // rules={[
                                    //     {
                                    //         validator: validateEmpty(
                                    //             __('输入不能为空'),
                                    //         ),
                                    //     },
                                    // ]}
                                >
                                    <Radio.Group
                                        options={dataEleAssociateType}
                                    />
                                </Form.Item>
                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item
                                            noStyle
                                            shouldUpdate={(
                                                prevValues,
                                                curValues,
                                            ) => {
                                                return (
                                                    prevValues.relation_type !==
                                                    curValues.relation_type
                                                )
                                            }}
                                        >
                                            {() => {
                                                const associateType =
                                                    form.getFieldValue(
                                                        'relation_type',
                                                    )

                                                const dictId =
                                                    form.getFieldValue(
                                                        'dict_id',
                                                    )
                                                const rules: any =
                                                    form.getFieldValue(
                                                        'rule_id',
                                                    )
                                                const formItemKey =
                                                    associateType ===
                                                    ValueRangeType.CodeTable
                                                        ? 'dict_id'
                                                        : 'rule_id'
                                                const dataId =
                                                    form.getFieldValue(
                                                        formItemKey,
                                                    )

                                                return associateType ===
                                                    ValueRangeType.None ? null : (
                                                    <Form.Item
                                                        label={labelText(
                                                            associateType ===
                                                                ValueRangeType.CodeTable
                                                                ? __('码表')
                                                                : __(
                                                                      '编码规则',
                                                                  ),
                                                            formItemKey,
                                                        )}
                                                        name={formItemKey}
                                                        className={
                                                            styles.associateItem
                                                        }
                                                        required
                                                        rules={[
                                                            {
                                                                validator:
                                                                    validateEmpty(
                                                                        associateType ===
                                                                            ValueRangeType.CodeTable
                                                                            ? __(
                                                                                  '请选择码表',
                                                                              )
                                                                            : __(
                                                                                  '请选择编码规则',
                                                                              ),
                                                                    ),
                                                            },
                                                        ]}
                                                    >
                                                        <Input
                                                            ref={dictCodeRef}
                                                            className={classnames(
                                                                styles.formsBase,
                                                                styles.hideSelectEmpty,
                                                            )}
                                                            placeholder={
                                                                associateType ===
                                                                ValueRangeType.CodeTable
                                                                    ? __(
                                                                          '请选择码表',
                                                                      )
                                                                    : __(
                                                                          '请选择编码规则',
                                                                      )
                                                            }
                                                            allowClear
                                                            value={
                                                                dataId?.[0]
                                                                    ?.label ||
                                                                undefined
                                                            }
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setSelDataType(
                                                                    associateType ===
                                                                        ValueRangeType.CodeTable
                                                                        ? CatalogType.CODETABLE
                                                                        : CatalogType.CODINGRULES,
                                                                )
                                                                setRowSelectionType(
                                                                    'radio',
                                                                )
                                                                setSelDataByTypeVisible(
                                                                    true,
                                                                )
                                                                dictCodeRef?.current?.blur()
                                                            }}
                                                            onChange={(e) => {
                                                                const {
                                                                    value,
                                                                } = e.target
                                                                if (!value) {
                                                                    form.setFieldValue(
                                                                        formItemKey,
                                                                        [],
                                                                    )
                                                                }
                                                            }}
                                                        />
                                                        {/* 不能去除，加上是为了手动设置input的值 */}
                                                        <div hidden />
                                                    </Form.Item>
                                                )
                                            }}
                                        </Form.Item>
                                    </Col>
                                </Row>
                                {isStart && (
                                    <>
                                        <div className={styles.formSortTitle}>
                                            {__('更多信息')}
                                        </div>
                                        <Row gutter={24}>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="label_id"
                                                    label={__('数据分级')}
                                                >
                                                    <TagCascader />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </>
                                )}
                            </Form>
                        </div>
                        <Anchor
                            getContainer={() => {
                                return (ref?.current as HTMLElement) || window
                            }}
                            onClick={(e: any) => e.preventDefault()}
                            className={styles.anchorWrapper}
                            // items={anchorItems}
                        >
                            {anchorItems?.map((link) => {
                                return (
                                    <Link
                                        href={`${link.href}`}
                                        title={link.title}
                                        key={link.key}
                                    />
                                )
                            })}
                        </Anchor>
                    </div>
                )}
            </CustomDrawer>
            {/* 选择码表/编码规则 */}
            <SelDataByTypeModal
                visible={selDataByTypeVisible}
                ref={selDataRef}
                onClose={onSelDataTypeClose}
                onOk={(oprItems: any) => {
                    switch (selDataType) {
                        case CatalogType.CODETABLE:
                            form.setFieldValue('dict_id', oprItems)
                            break
                        case CatalogType.CODINGRULES:
                            form.setFieldValue('rule_id', oprItems)
                            break
                        case CatalogType.FILE:
                            form.setFieldValue('std_files', oprItems)
                            break
                        default:
                            break
                    }
                }}
                dataType={selDataType}
                rowSelectionType={rowSelectionType}
                oprItems={selDataItems}
                setOprItems={setSelDataItems}
                handleShowDataDetail={handleShowDataDetail}
            />
            {/* 查看码表详情 */}
            {detailIds && detailIds.length > 0 && codeTbDetailVisible && (
                <CodeTableDetails
                    visible={codeTbDetailVisible}
                    title={__('码表详情')}
                    dictId={detailIds[0].key}
                    onClose={() => setCodeTbDetailVisible(false)}
                    handleError={(errorKey: string) => {
                        // 码表不存在(status:400, code:Standardization.ResourceError.DataNotExist)，不显示详情页
                        if (
                            errorKey ===
                            'Standardization.ResourceError.DataNotExist'
                        ) {
                            // 清空码表
                            form.setFieldValue('dict_id', [])
                            selDataRef?.current?.reloadData()
                            setDetailIds([])
                        }
                    }}
                />
            )}
            {/* 查看编码规则详情，支持多选框查看详情 */}
            {detailIds && detailIds.length > 0 && codeRuleDetailVisible && (
                <CodeRuleDetails
                    visible={codeRuleDetailVisible}
                    id={detailIds[0].key}
                    onClose={() => {
                        setCodeRuleDetailVisible(false)
                    }}
                    handleError={(errorKey: string, ruleId: string) => {
                        // 码表不存在(status:400, code:Standardization.ResourceError.DataNotExist)，不显示详情页
                        if (
                            errorKey ===
                            'Standardization.ResourceError.DataNotExist'
                        ) {
                            // 清空码表
                            // let ruleIds = form.getFieldValue('rule_id')
                            if (ruleId) {
                                // // form已选中剔除被删ruleId
                                // ruleIds = ruleIds.filter(
                                //     (item: any) => item.key !== ruleId,
                                // )

                                // 选择框数据对话框选中行中剔除被删ruleId
                                const selDataItemsTemp = selDataItems.filter(
                                    (item: any) => item.key !== ruleId,
                                )
                                setSelDataItems(selDataItemsTemp)
                            }
                            // form.setFieldValue('rule_id', ruleIds)
                            if (codeRuleDetailVisible) {
                                // 刷新数据
                                selDataRef?.current?.reloadData()
                            }
                            // setDetailIds([])
                        }
                    }}
                />
            )}
            {/* 文件详情 */}
            {detailIds && detailIds.length > 0 && fileDetailVisible && (
                <FileDetails
                    visible={fileDetailVisible}
                    fileId={detailIds[0]?.key}
                    onClose={() => setFileDetailVisible(false)}
                />
            )}
            {/* 新建码表 */}
            {createDictVisible && (
                <EditDictForm
                    type={OperateType.CREATE}
                    visible={createDictVisible}
                    showShadow={showShadow}
                    contentWrapperStyle={contentWrapperStyle}
                    getTreeList={getTreeList}
                    onClose={(operate: Operate) =>
                        handleOperateCancel(CatalogType.CODETABLE, operate)
                    }
                    update={(
                        newSelectedDir?: IDirItem,
                        newDict?: IDictItem,
                    ) => {
                        form.setFieldValue(
                            'dict_id',
                            newDict
                                ? [
                                      {
                                          key: newDict.id,
                                          label: newDict.ch_name,
                                          value: newDict.ch_name,
                                      },
                                  ]
                                : undefined,
                        )
                    }}
                    selCatlgClass={selCatlgClass || CatalogOption.AUTOCATLG}
                />
            )}
            {/* 新建编码规则 */}
            {createCRVisible && (
                <EditCodeRule
                    visible={createCRVisible}
                    operateType={OperateType.CREATE}
                    showShadow={showShadow}
                    contentWrapperStyle={contentWrapperStyle}
                    onClose={() => handleOperateCancel(CatalogType.CODINGRULES)}
                    updateCodeRuleList={(newCodeRule: any) => {
                        form.setFieldValue('rule_id', [
                            {
                                key: newCodeRule?.id,
                                value: newCodeRule.name,
                                label: newCodeRule?.name,
                            },
                        ])
                    }}
                />
            )}
        </div>
    )
}

export default EditDataEleForm
