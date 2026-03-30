import React, {
    useEffect,
    useState,
    useRef,
    useImperativeHandle,
    forwardRef,
    useMemo,
} from 'react'
import {
    Drawer,
    Button,
    Tooltip,
    Switch,
    message,
    Select,
    TreeSelect,
} from 'antd'
import classnames from 'classnames'
import { useGetState } from 'ahooks'
import {
    RightOutlined,
    CloseCircleFilled,
    InfoCircleOutlined,
    ExclamationCircleFilled,
    DownOutlined,
} from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import {
    ClassifyType,
    fieldDetailData,
    stateType,
    fieldTagsTips,
    IconType,
    getDefaultDataType,
    DataTypeTransformRules,
    DefaultDataTypeChinese,
    GradeType,
} from './const'
import { DetailsLabel, EllipsisMiddle, SearchInput } from '@/ui'
import {
    ExcelDataTypeOptions,
    getLabelName,
    getStateTag,
    validateRepeatName,
    validateTechnicalRepeatName,
} from './helper'
import { EditOutlined, FontIcon } from '@/icons'
import Loader from '@/ui/Loader'
import SelDataByTypeModal from '@/components/SelDataByTypeModal'
import {
    CatalogType,
    formatError,
    getDataEleDetailById,
    dataTypeMapping,
    allRoleList,
    getCommonDataType,
    getDataGradeLabel,
    HasAccess,
    PermissionScope,
    IStdRecParams,
} from '@/core'
import CodeTableDetails from '@/components/CodeTableManage/Details'
import { excelTechnicalNameReg, useQuery } from '@/utils'
import Confirm from '../Confirm'
import DataEleDetails from '../DataEleManage/Details'
import ChooseAttribute from './ChooseAttribute'
import Icons from './Icons'
import { IconType as FontIconType } from '@/icons/const'
import ConfigParseRule from './ConfigParseRule'
import { useDataViewContext } from './DataViewProvider'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IFieldDetail {
    open: boolean
    loading: boolean
    onClose: () => void
    onFieldDataChange?: (data) => void
    fieldData: any
    optionType: string
    upDateDetails?: () => void
    fieldList?: any
    businessTimestampField: any
    isDataView?: boolean
    dataSheetId?: string
    // 是否编辑自定义和或库表
    isCustomOrLogic?: boolean
    setFieldList?: (data: any[]) => void
    isStart?: boolean
    module?: string
    detailGetContainer?: any
    dataSheetName?: string
}

const FieldDetail = forwardRef((props: IFieldDetail, ref) => {
    const {
        open,
        onClose,
        fieldData,
        loading = false,
        optionType,
        onFieldDataChange,
        upDateDetails,
        fieldList,
        businessTimestampField,
        isDataView,
        dataSheetId = '',
        isCustomOrLogic = false,
        setFieldList,
        isStart = false,
        module,
        detailGetContainer = false,
        dataSheetName,
    } = props
    const query = useQuery()
    const id = query.get('id') || query.get('viewId') || ''
    const dataSourceType = query.get('dataSourceType')
    const [data, setData] = useState<any>()
    const [fieldDetail, setFieldDetail] = useState<any[]>([])
    const [isBusinessNameEdit, setIsBusinessNameEdit] = useState<boolean>(false)
    const [isTechnicalNameEdit, setIsTechnicalNameEdit] =
        useState<boolean>(false)
    const [isCodeNameEdit, setIsCodeNameEdit] = useState<boolean>(false)
    const [isStandardNameEdit, setIsStandardNameEdit] = useState<boolean>(false)
    // 编辑选择数据对话框（用于码表/编码规则/标准文件的选择对话框）
    const [selDataByTypeVisible, setSelDataByTypeVisible] = useState(false)
    const selDataRef: any = useRef()
    const [selDataItems, setSelDataItems] = useState<any[]>([])
    const [selStandardItems, setSelStandardItems] = useState<any[]>([])
    // 查看多个数据元/码表/编码规则详情id
    const [detailIds, setDetailIds] = useState<Array<any> | undefined>([])
    // 仅查看单个数据元/码表/编码规则详情id
    const [detailId, setDetailId] = useState<string | undefined>('')
    const [dataEleMatchType, setDataEleMatchType] = useState<number>(2)
    // 数据元详情
    const [dataEleDetailVisible, setDataEleDetailVisible] =
        useState<boolean>(false)
    // 码表详情
    const [codeTbDetailVisible, setCodeTbDetailVisible] =
        useState<boolean>(false)
    const [isFiledNameRepeat, setIsFiledNameRepeat] = useState(false)
    const [isTechnicalNameRepeat, setIsTechnicalNameRepeat] = useState(false)
    const [isDataEleDict, setIsDataEleDict] = useState(false)
    const [selDataType, setSelDataType] = useState<CatalogType>(
        CatalogType.CODETABLE,
    )
    const [confirmVisible, setConfirmVisible] = useState(false)
    const [confirmBtnLoading, setConfirmBtnLoading] = useState(false)
    const [isTimestamp, setIsTimestamp] = useState(false)
    const [chooseAttrOpen, setChooseAttrOpen] = useState(false)
    const [selectedAttr, setSelectedAttr] = useState<any>({})
    const { checkPermission, checkPermissions } = useUserPermCtx()
    const [configParseRuleOpen, setConfigParseRuleOpen] = useState(false)
    const [excelTechnicalNameErr, setExcelTechnicalNameErr] = useState(false)
    const [isConfig, setIsConfig] = useState(false)
    const [gradeLabelOptions, setGradeLabelOptions, getGradeLabelOptions] =
        useGetState<any[]>([])
    const [stdRecParams, setStdRecParams] = useState<IStdRecParams>()

    const nodeRef = useRef<any>(null)
    const { datasheetInfo } = useDataViewContext()

    const isTrueRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermission])

    // 安全管理员
    const hasSafeAdmin = useMemo(() => {
        return checkPermission(allRoleList.SecurityAdmin) ?? false
    }, [checkPermission])

    useEffect(() => {
        if (fieldData) {
            setData(fieldData)
            updateFieldDetail()
        }
        if (optionType === 'view') {
            setIsCodeNameEdit(false)
            setIsStandardNameEdit(false)
        }
    }, [
        fieldData,
        optionType,
        isBusinessNameEdit,
        isTechnicalNameEdit,
        isCodeNameEdit,
        isStandardNameEdit,
        isFiledNameRepeat,
        isTechnicalNameRepeat,
        excelTechnicalNameErr,
    ])

    useEffect(() => {
        if (
            fieldData?.code_table_id &&
            fieldData?.standard_code &&
            ['create', 'edit'].includes(optionType)
        ) {
            getDataEleDetails(fieldData?.standard_code)
        }
        setIsFiledNameRepeat(validateRepeatName(fieldList, fieldData))
        const testValueResult = excelTechnicalNameReg.test(
            fieldData.technical_name,
        )
        if (!testValueResult) {
            setExcelTechnicalNameErr(true)
        } else {
            setIsTechnicalNameRepeat(
                validateTechnicalRepeatName(fieldList, fieldData),
            )
        }
    }, [fieldData, optionType])

    useEffect(() => {
        if (fieldData.attribute_id) {
            setSelectedAttr({
                attribute_id: fieldData.attribute_id,
                attribute_name: fieldData.attribute_name,
                attribute_path: fieldData.attribute_path,
            })
        } else {
            setSelectedAttr({})
        }
    }, [fieldData])

    useEffect(() => {
        if (dataSheetName && fieldData?.business_name) {
            setStdRecParams({
                table_name: dataSheetName,
                table_fields: [
                    {
                        table_field: fieldData?.business_name,
                    },
                ],
            })
        }
    }, [fieldData, dataSheetName])

    useEffect(() => {
        setSelDataItems([])
        setSelStandardItems([])
    }, [fieldData?.id, optionType])

    useEffect(() => {
        getAllGradeLabel()
    }, [])

    /**
     * 获取所有分级标签
     */
    const getAllGradeLabel = async () => {
        try {
            const gradeRules = await getDataGradeLabel({
                keyword: '',
                is_show_label: true,
            })
            setGradeLabelOptions(formatDataToTreeData(gradeRules.entries))
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 将数据格式化为树形结构
     * @param treeData 数据
     * @returns 树形结构
     */
    const formatDataToTreeData = (treeData: any) => {
        return treeData.map((item) => ({
            ...item,
            label: !item?.children?.length ? (
                <div className={styles.selectOptionWrapper}>
                    <FontIcon
                        name="icon-biaoqianicon"
                        style={{
                            fontSize: 20,
                            color: item.icon,
                        }}
                        className={styles.icon}
                    />
                    <span title={item.name} className={styles.name}>
                        {item.name}
                    </span>
                </div>
            ) : (
                item.name
            ),
            value: item.id,
            isLeaf: !item?.children?.length,
            selectable: !item?.children?.length,
            name: item.name,
            children: item?.children?.length
                ? formatDataToTreeData(item.children)
                : undefined,
        }))
    }

    const updateFieldDetail = (isStandardDict?: boolean) => {
        const details = fieldDetailData(isStart)
            .map((item) => {
                const filterKes: string[] = []
                if (optionType === 'edit') {
                    filterKes.push(
                        'sensitive_type',
                        'shared_type',
                        'open_type',
                        'secret_type',
                    )
                }
                return {
                    ...item,
                    label:
                        item.key === 'classificationInfo' && !hasSafeAdmin ? (
                            <div className={styles.classifyTitleBarWrapper}>
                                <span>{item.label}</span>
                                <Tooltip
                                    title={__(
                                        '您的角色权限不足，不能编辑此类信息',
                                    )}
                                    color="#fff"
                                    overlayInnerStyle={{
                                        color: 'rgba(0,0,0,0.85)',
                                    }}
                                    placement="bottom"
                                    overlayStyle={{
                                        maxWidth: 400,
                                    }}
                                >
                                    <InfoCircleOutlined
                                        className={styles.icon}
                                    />
                                </Tooltip>
                            </div>
                        ) : (
                            item.label
                        ),
                    fields: item?.fields?.map((it) => {
                        let value = fieldData[it.key]
                        // fieldData[it.key] === 0 ? '--' : fieldData[it.key]
                        if (
                            optionType !== 'view' &&
                            filterKes.includes(it.key)
                        ) {
                            value = fieldData[it.key] || undefined
                        }
                        const obj = {
                            ...it,
                            value,
                        }
                        if (it.key === 'business_name') {
                            obj.render = () => businessNameRender(value)
                        }
                        if (
                            it.key === 'technical_name' &&
                            dataSourceType === 'excel' &&
                            !datasheetInfo.id
                        ) {
                            obj.render = () => technicalNameRender(value)
                        }
                        if (it.key === 'code_table') {
                            obj.render = () => codeRender(value, isStandardDict)
                        }
                        if (it.key === 'standard') {
                            obj.render = () => standardRender(value)
                        }
                        if (it.key === 'attribute_name') {
                            obj.render = () => attributeRender(value, fieldData)
                        }
                        // if (it.key === 'grade_name' && isStart) {
                        //     return labelRender(value, fieldData)
                        // }
                        if (it.key === 'label_id' && isStart) {
                            obj.render = () => labelRender(value, fieldData)
                        }
                        if (it.key === 'grade_name' && !isStart) {
                            obj.render = null
                        }
                        // if (it.key === 'data_type') {
                        //     if (
                        //         (dataSourceType === 'excel' &&
                        //             datasheetInfo?.id) ||
                        //         datasheetInfo.publish_status === 'published'
                        //     ) {
                        //         obj.render = value
                        //     }
                        //     if (dataSourceType === 'excel') {
                        //         obj.render = () => renderDataTypeExcel(value)
                        //     }
                        //     obj.render = () => renderDataType(value, fieldData)
                        // }
                        if (it.key === 'reset_convert_rules') {
                            obj.render = () =>
                                renderDataAnalysisRule(value, fieldData)
                        }
                        if (it.key === 'data_length') {
                            obj.render = () =>
                                dataLengthRender(value, fieldData)
                        }
                        if (it.key === 'data_accuracy') {
                            obj.render = () =>
                                dataAccuracyRender(value, fieldData)
                        }
                        if (filterKes.includes(it.key)) {
                            const disabled =
                                it.key === 'open_type' &&
                                fieldData.shared_type === 3
                            obj.render = () =>
                                renderShareType(
                                    it.key,
                                    value,
                                    it.options,
                                    disabled,
                                )
                        }
                        return obj
                    }),
                    // ?.filter((o) => !filterKes.includes(o.key)),
                }
            })
            .filter((item) => {
                if (item.key === 'classificationInfo') {
                    return checkPermission('manageDataClassification')
                }
                return true
            })
        // 能配置更新时间戳的数据类型
        const timesType = [
            ...dataTypeMapping.date,
            ...dataTypeMapping.datetime,
            ...dataTypeMapping.char,
            ...dataTypeMapping.number,
            ...dataTypeMapping.time,
        ]
        const hideTimestamp: boolean =
            (optionType === 'view' && !fieldData?.business_timestamp) ||
            (['create', 'edit'].includes(optionType) &&
                !timesType.includes(fieldData?.data_type)) ||
            (optionType === 'create' && isCustomOrLogic)
        setFieldDetail(
            hideTimestamp
                ? details.filter((item) => item.key !== 'timestamp')
                : details,
        )
        setIsTimestamp(businessTimestampField?.id === fieldData?.id)
    }

    const getTempleInfo = () => {
        return loading ? (
            <div style={{ paddingTop: '56px' }}>
                <Loader tip={__('正在获取数据...')} />
            </div>
        ) : fieldData?.sample_data?.length ? (
            fieldData?.sample_data?.map((item, index) => {
                return (
                    <div
                        className={styles.detailInfo}
                        title={item}
                        key={`${item}_${index}`}
                    >
                        {item || '--'}
                    </div>
                )
            })
        ) : (
            <div className={styles.detailInfo}>{__('无样例数据')}</div>
        )
    }

    const businessNameRender = (text) => {
        return (
            <div className={styles.editName}>
                {isBusinessNameEdit ? (
                    <>
                        <SearchInput
                            placeholder={__('请输入业务名称')}
                            value={text}
                            className={classnames(
                                styles.searchInput,
                                isFiledNameRepeat && styles.errInput,
                            )}
                            autoFocus
                            allowClear={false}
                            onChange={(e) => {
                                const value = e.target.value.trim()
                                const isReName = validateRepeatName(fieldList, {
                                    ...fieldData,
                                    business_name: value,
                                })
                                setIsFiledNameRepeat(isReName)
                            }}
                            onBlur={(e) => {
                                const value = e.target.value.trim()
                                if (
                                    !value ||
                                    value === fieldData?.business_name
                                ) {
                                    setIsBusinessNameEdit(false)
                                    return
                                }
                                // if (!isFiledNameRepeat) {
                                // toEditBusinessName(value)
                                editViewDetails({ business_name: value })
                                setIsBusinessNameEdit(false)
                                // }
                            }}
                            showIcon={false}
                        />
                        {isFiledNameRepeat && (
                            <div className={styles.errText}>
                                {__('此名称和其他字段的业务名称重复，请修改')}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <span title={text}>{text || '--'}</span>
                        {isFiledNameRepeat && (
                            <Tooltip
                                title={fieldData.tips}
                                placement="right"
                                color="#fff"
                                overlayClassName="datasheetViewTreeTipsBox"
                                overlayInnerStyle={{
                                    color: '#000',
                                }}
                            >
                                <Icons
                                    type={IconType.ERROR}
                                    style={{ color: '#F5222D', marginLeft: 8 }}
                                />
                            </Tooltip>
                        )}
                    </>
                )}
                {['create', 'edit'].includes(optionType) &&
                    isTrueRole &&
                    !isBusinessNameEdit &&
                    !isCustomOrLogic && (
                        <EditOutlined
                            onClick={() => {
                                setIsBusinessNameEdit(true)
                                // setIsFiledNameRepeat(false)
                            }}
                            className={styles.editIcon}
                        />
                    )}
            </div>
        )
    }
    /**
     * 技术名称渲染
     * @param text
     * @returns
     */
    const technicalNameRender = (text: string) => {
        return (
            <div className={styles.editName}>
                {isTechnicalNameEdit ? (
                    <>
                        <SearchInput
                            placeholder={__('请输入技术名称')}
                            value={text}
                            className={classnames(
                                styles.searchInput,
                                isTechnicalNameRepeat && styles.errInput,
                            )}
                            autoFocus
                            allowClear={false}
                            maxLength={100}
                            onChange={(e) => {
                                const value = e.target.value.trim()
                                const testValueResult =
                                    excelTechnicalNameReg.test(value)
                                if (!testValueResult) {
                                    setExcelTechnicalNameErr(true)
                                    return
                                }
                                setExcelTechnicalNameErr(false)
                                const isReName = validateTechnicalRepeatName(
                                    fieldList,
                                    {
                                        ...fieldData,
                                        technical_name: value,
                                    },
                                )
                                setIsTechnicalNameRepeat(isReName)
                            }}
                            onBlur={(e) => {
                                const value = e.target.value.trim()
                                if (
                                    !value ||
                                    value === fieldData?.technical_name
                                ) {
                                    setIsTechnicalNameEdit(false)
                                    return
                                }
                                // if (!isFiledNameRepeat) {
                                // toEditBusinessName(value)
                                editViewDetails({ technical_name: value })
                                setIsTechnicalNameEdit(false)
                                // }
                            }}
                            showIcon={false}
                        />
                        {excelTechnicalNameErr && (
                            <div className={styles.errText}>
                                {__(
                                    '技术名称不能使用\\ /:*?"<>|，且不能使用大写字母',
                                )}
                            </div>
                        )}
                        {isTechnicalNameRepeat && (
                            <div className={styles.errText}>
                                {__('此名称和其他字段的技术名称重复，请修改')}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <span title={text}>{text || '--'}</span>
                        {(isTechnicalNameRepeat || excelTechnicalNameErr) && (
                            <Tooltip
                                title={fieldData.tips}
                                placement="right"
                                color="#fff"
                                overlayClassName="datasheetViewTreeTipsBox"
                                overlayInnerStyle={{
                                    color: '#000',
                                }}
                            >
                                <Icons
                                    type={IconType.ERROR}
                                    style={{
                                        color: '#F5222D',
                                        marginLeft: 8,
                                    }}
                                />
                            </Tooltip>
                        )}
                    </>
                )}
                {['create', 'edit'].includes(optionType) &&
                    isTrueRole &&
                    !isTechnicalNameEdit &&
                    !isCustomOrLogic && (
                        <EditOutlined
                            onClick={() => {
                                setIsTechnicalNameEdit(true)
                                // validateTechnicalRepeatName(false)
                            }}
                            className={styles.editIcon}
                        />
                    )}
            </div>
        )
    }

    // 获取字段原始数据类型 可转换的类型
    const options = useMemo(() => {
        if (!(fieldData.reset_before_data_type || fieldData.data_type))
            return []
        const originDefaultDataType = getDefaultDataType(
            fieldData.reset_before_data_type || fieldData.data_type,
        )
        return [
            {
                value: fieldData.reset_before_data_type || fieldData.data_type,
                label: (
                    <>
                        <div
                            className={styles['data-type-item']}
                            onClick={() => {
                                editViewDetails({
                                    data_type:
                                        fieldData.reset_before_data_type ||
                                        fieldData.data_type,
                                    reset_before_data_type: '',
                                    reset_data_length: fieldData.data_length,
                                    reset_data_accuracy:
                                        fieldData.data_accuracy,
                                })
                            }}
                        >
                            <span
                                className={styles['data-type-name-en']}
                                title={
                                    fieldData.reset_before_data_type ||
                                    fieldData.data_type
                                }
                            >
                                {fieldData.reset_before_data_type ||
                                    fieldData.data_type}
                            </span>
                            <div className={styles['data-type-item-right']}>
                                <Tooltip
                                    title={__(
                                        '通过扫描原始数据类型获取，选中还原预设属性',
                                    )}
                                >
                                    <div className={styles['preset-flag']}>
                                        {__('预设')}
                                    </div>
                                </Tooltip>
                                <span className={styles['data-type-text']}>
                                    {
                                        DefaultDataTypeChinese[
                                            originDefaultDataType
                                        ]
                                    }
                                </span>
                            </div>
                        </div>
                        <div style={{ height: 4, background: 'white' }} />
                    </>
                ),
            },
            ...DataTypeTransformRules[originDefaultDataType].map((item) => {
                return {
                    value: item.value,
                    label: (
                        <div
                            className={styles['data-type-item']}
                            key={item.key}
                            onClick={() => {
                                if (item.value === fieldData.data_type) return
                                // 恢复上次已更改且发布的类型，不需要测试
                                if (
                                    fieldData.custom_data_type &&
                                    item.value === fieldData.custom_data_type
                                ) {
                                    editViewDetails?.({
                                        data_type: fieldData.custom_data_type,
                                        reset_before_data_type:
                                            fieldData.data_type,
                                    })
                                    return
                                }
                                editViewDetails?.({
                                    reset_before_data_type:
                                        fieldData.reset_before_data_type ||
                                        fieldData.data_type,
                                    data_type: item.value,
                                    // 用户自定义的类型 ，为了再次更改时 取消 恢复自定义类型
                                    custom_data_type:
                                        fieldData.reset_before_data_type
                                            ? fieldData.data_type
                                            : '',
                                })
                                setTimeout(() => {
                                    setConfigParseRuleOpen(true)
                                }, 0)
                                message.success({
                                    className: styles['type-change-tip'],
                                    content: ['date', 'timestamp'].includes(
                                        item.value,
                                    )
                                        ? __(
                                              '数据类型转换为 "${type}"，需要配置解析规则并进行测试',
                                              { type: item.value },
                                          )
                                        : item.value === 'decimal'
                                        ? __(
                                              '数据类型转换为 "${type}"，需要指定长度和精度信息并进行测试',
                                              { type: item.value },
                                          )
                                        : __(
                                              '数据类型转换为 "${type}"，需要进行测试',
                                              { type: item.value },
                                          ),
                                    icon: <span />,
                                    duration: 3,
                                })
                            }}
                        >
                            <span>{item.value}</span>
                            <span className={styles['data-type-text']}>
                                {item.label}
                            </span>
                        </div>
                    ),
                    showLabel: (
                        <>
                            {!['custom', 'logic_entity'].includes(
                                module || '',
                            ) &&
                                fieldData.reset_before_data_type &&
                                fieldData.reset_before_data_type !==
                                    fieldData.data_type && (
                                    <FontIcon
                                        type={FontIconType.FONTICON}
                                        name="icon-zhuanhuanjiantou"
                                        style={{
                                            color: '#1890FF',
                                            marginRight: 8,
                                        }}
                                    />
                                )}
                            {item.value}
                        </>
                    ),
                }
            }),
        ]
    }, [fieldData])

    // reset_before_data_type为预设类型，首次进来为空。改之后变化
    const renderDataType = (value: string, currentFieldData) => {
        if (['custom', 'logic_entity'].includes(module || '')) {
            return value
        }
        if (!value && !['custom', 'logic_entity'].includes(module || '')) {
            return (
                <span>
                    -- <span>{__('（未知类型，无法转换）')}</span>
                </span>
            )
        }
        const isShowTransformFlag =
            !['custom', 'logic_entity'].includes(module || '') &&
            currentFieldData.reset_before_data_type &&
            currentFieldData.reset_before_data_type !==
                currentFieldData.data_type
        // value 先取值用户更改的类型 否则取值预设类型
        // 已更改后的类型查看“库表”和编辑“库表”，字段类型增加标记，代表当前库表进行过转换（仅元数据库表）
        return (
            <Tooltip
                placement="left"
                arrowPointAtCenter
                color="#fff"
                overlayInnerStyle={{
                    color: '#000',
                }}
                title={
                    isShowTransformFlag ? (
                        <span>
                            <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                                {currentFieldData.reset_before_data_type}
                            </span>
                            <span className={styles.typeTransformFlag}>转</span>
                            <span>{currentFieldData.data_type}</span>
                        </span>
                    ) : (
                        ''
                    )
                }
            >
                {['create', 'edit'].includes(optionType) &&
                isTrueRole &&
                options.length > 1 ? (
                    <Select
                        style={{ width: '100%' }}
                        getPopupContainer={(node) => node.parentNode}
                        className={styles['data-type-select']}
                        options={options}
                        value={currentFieldData.data_type || value}
                        optionLabelProp="showLabel"
                    />
                ) : (
                    <>
                        {isShowTransformFlag && (
                            <FontIcon
                                type={FontIconType.FONTICON}
                                name="icon-zhuanhuanjiantou"
                                style={{ color: '#1890FF', marginRight: 8 }}
                            />
                        )}
                        {currentFieldData.data_type || value}
                    </>
                )}
            </Tooltip>
        )
    }

    /**
     * 渲染Excel数据类型
     * @param value
     * @returns
     */
    const renderDataTypeExcel = (value: string) => {
        return (
            <Select
                style={{ width: '100%' }}
                getPopupContainer={(node) => node.parentNode}
                className={styles['data-type-select']}
                options={ExcelDataTypeOptions}
                value={value}
                onChange={(newValue) => {
                    editViewDetails({ data_type: newValue })
                }}
                optionLabelProp="showLabel"
            />
        )
    }
    /**
     * 渲染更多信息多个属性
     * @param value
     * @returns
     */
    const renderShareType = (
        key: string,
        value: string,
        ops: any[],
        disabled?: boolean,
    ) => {
        return (
            <Select
                style={{ width: '100%' }}
                getPopupContainer={(node) => node.parentNode}
                placeholder={__('请选择')}
                options={ops}
                value={value}
                onChange={(newValue: any) => {
                    const info: any = {
                        [key]: newValue,
                    }
                    if (key === 'shared_type' && newValue === 3) {
                        info.open_type = 3
                    }
                    editViewDetails(info)
                }}
                disabled={disabled}
                // optionLabelProp="showLabel"
            />
        )
    }

    const toEditBusinessName = (business_name: string) => {
        onFieldDataChange?.({
            ...fieldData,
            business_name,
        })
        editViewDetails({ business_name })
    }

    const codeRender = (text: any, isStandardDict?: boolean) => {
        const codeItem = {
            key: fieldData?.code_table_id,
            label: fieldData?.code_table,
        }
        const codeName = text || codeItem?.label
        const showSelectBtn =
            ['create', 'edit'].includes(optionType) && !isStandardDict
        const showDetailsBtn =
            codeName && (isStandardDict || optionType === 'view')
        const showClearBtn =
            codeName &&
            ['create', 'edit'].includes(optionType) &&
            !isStandardDict
        const showStatueTag =
            fieldData.code_table_status &&
            fieldData.code_table_status !== 'enable'
        return (
            <div>
                <div
                    className={classnames(
                        styles.codeSelect,
                        ['create', 'edit'].includes(optionType) &&
                            styles.isEdit,
                    )}
                >
                    <div className={styles.codeSelectBox}>
                        <div className={styles.codeSelectText}>
                            <span
                                title={codeItem?.label}
                                onClick={() => {
                                    handleShowDataDetail(
                                        CatalogType.CODETABLE,
                                        codeItem?.key,
                                    )
                                }}
                                className={classnames(
                                    styles.codeText,
                                    codeName && styles.codeSelectEnumName,
                                    fieldData.code_table_status !== 'enable' &&
                                        styles.hasTag,
                                    isStandardDict && styles.hasTips,
                                )}
                            >
                                {codeItem?.label || '--'}
                            </span>
                            {showStatueTag && (
                                <span
                                    className={classnames(
                                        styles.delTag,
                                        fieldData.code_table_status ===
                                            'disable' && styles.disable,
                                    )}
                                >
                                    {fieldData.code_table_status === 'deleted'
                                        ? __('已删除')
                                        : __('已停用')}
                                </span>
                            )}
                            {showClearBtn && (
                                <Tooltip title={__('清空')} placement="bottom">
                                    <CloseCircleFilled
                                        className={classnames(
                                            styles.codeDel,
                                            codeItem?.label && styles.hasName,
                                        )}
                                        onClick={() => {
                                            if (isCustomOrLogic) {
                                                setFieldList?.(
                                                    fieldList.map((f) => {
                                                        if (
                                                            f.id ===
                                                            fieldData.id
                                                        ) {
                                                            return {
                                                                ...f,
                                                                code_table: '',
                                                                code_table_id:
                                                                    '',
                                                            }
                                                        }
                                                        return f
                                                    }),
                                                )
                                                return
                                            }
                                            setSelDataItems([])
                                            editViewDetails({
                                                code_table: '',
                                                code_table_id: '',
                                            })
                                            setIsCodeNameEdit(false)
                                        }}
                                    />
                                </Tooltip>
                            )}
                        </div>
                        {showDetailsBtn && (
                            <>
                                {isStandardDict && (
                                    <Tooltip
                                        title={__('数据标准所关联的码表')}
                                        placement="bottom"
                                    >
                                        <InfoCircleOutlined
                                            className={styles.codeTips}
                                        />
                                    </Tooltip>
                                )}
                                <Button
                                    type="link"
                                    className={styles.codeDetailBtn}
                                    onClick={() => {
                                        handleShowDataDetail(
                                            CatalogType.CODETABLE,
                                            codeItem?.key,
                                        )
                                    }}
                                >
                                    {__('详情')}
                                </Button>
                            </>
                        )}
                        {showSelectBtn && isTrueRole && (
                            <Button
                                type="link"
                                className={styles.codeDetailBtn}
                                onClick={() => {
                                    setSelDataByTypeVisible(true)
                                    const enumObj: any = {
                                        key: codeItem?.key,
                                        label: codeItem?.label,
                                    }
                                    setSelDataType(CatalogType.CODETABLE)
                                    setSelDataItems(
                                        codeItem?.label && codeItem?.key
                                            ? [enumObj]
                                            : [],
                                    )
                                }}
                            >
                                {__('选择')}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const standardRender = (text: any) => {
        const codeItem = {
            key: fieldData?.standard_code,
            label: fieldData?.standard,
        }
        const codeName = text || codeItem?.label
        const showDetailsBtn = codeName && optionType === 'view'
        return (
            <div>
                <div
                    className={classnames(
                        styles.codeSelect,
                        ['create', 'edit'].includes(optionType) &&
                            styles.isEdit,
                    )}
                >
                    <div className={styles.codeSelectBox}>
                        <div className={styles.codeSelectText}>
                            <span
                                title={codeItem?.label}
                                className={classnames(
                                    styles.codeText,
                                    codeName && styles.codeSelectEnumName,
                                )}
                                onClick={() => {
                                    setDetailId(codeItem?.key)
                                    setDataEleDetailVisible(true)
                                    setDataEleMatchType(2)
                                }}
                            >
                                {codeItem?.label || '--'}
                            </span>
                            {codeItem?.label &&
                                ['create', 'edit'].includes(optionType) && (
                                    <Tooltip
                                        title={__('清空')}
                                        placement="bottom"
                                    >
                                        <CloseCircleFilled
                                            className={classnames(
                                                styles.codeDel,
                                                codeItem?.label &&
                                                    styles.hasName,
                                            )}
                                            onClick={() => {
                                                if (isCustomOrLogic) {
                                                    setFieldList?.(
                                                        fieldList.map((f) => {
                                                            if (
                                                                f.id ===
                                                                fieldData.id
                                                            ) {
                                                                return {
                                                                    ...f,
                                                                    standard:
                                                                        '',
                                                                    standard_code:
                                                                        '',
                                                                }
                                                            }
                                                            return f
                                                        }),
                                                    )
                                                    return
                                                }
                                                setSelStandardItems([])
                                                editViewDetails({
                                                    standard: '',
                                                    standard_code: '',
                                                })
                                                setIsStandardNameEdit(false)
                                            }}
                                        />
                                    </Tooltip>
                                )}
                        </div>
                        {showDetailsBtn && (
                            <Button
                                type="link"
                                className={styles.codeDetailBtn}
                                onClick={() => {
                                    setDetailId(codeItem?.key)
                                    setDataEleDetailVisible(true)
                                    setDataEleMatchType(2)
                                }}
                            >
                                {__('详情')}
                            </Button>
                        )}
                        {['create', 'edit'].includes(optionType) &&
                            isTrueRole && (
                                <Button
                                    type="link"
                                    className={styles.codeDetailBtn}
                                    onClick={() => {
                                        setSelDataByTypeVisible(true)
                                        setSelDataType(CatalogType.DATAELE)
                                    }}
                                >
                                    {__('选择')}
                                </Button>
                            )}
                    </div>
                </div>
            </div>
        )
    }

    const AbandonUse = async () => {
        editViewDetails({
            attribute_id: '',
            attribute_name: '',
            attribute_path: '',
            label_id: '',
            label_name: '',
            clear_attribute_id: fieldData.attribute_id,
        })
    }

    const attributeRender = (text: string, fieldInfo) => {
        return (
            <>
                <div className={styles.attrContainer}>
                    <div className={styles.left}>
                        <div className={styles.attrInfo}>
                            {text && (
                                <FontIcon
                                    name="icon-shuxing"
                                    className={styles.attrIcon}
                                />
                            )}
                            <div className={styles.nameContainer}>
                                <div
                                    // title={__('逻辑实体属性：${name}', {
                                    //     name: fieldInfo.attribute_path,
                                    // })}
                                    className={classnames(
                                        text &&
                                            ['create', 'edit'].includes(
                                                optionType,
                                            ) &&
                                            fieldInfo.classfity_type !==
                                                ClassifyType.Auto &&
                                            module !== 'logic_entity'
                                            ? styles.selectedAttrName
                                            : '',
                                        styles.attrName,
                                    )}
                                >
                                    {text || '--'}
                                </div>
                                {fieldInfo.attribute_path && (
                                    <div
                                        className={styles.attrPath}
                                        title={fieldInfo.attribute_path}
                                    >
                                        <EllipsisMiddle>
                                            {fieldInfo.attribute_path}
                                        </EllipsisMiddle>
                                    </div>
                                )}
                            </div>
                            {text &&
                                ['create', 'edit'].includes(optionType) &&
                                fieldInfo.classfity_type ===
                                    ClassifyType.Auto && (
                                    <Tooltip title={__('不准确，放弃使用')}>
                                        <FontIcon
                                            name="icon-buzhunque"
                                            className={styles.inaccuracyIcon}
                                            onClick={AbandonUse}
                                        />
                                    </Tooltip>
                                )}
                        </div>
                        {text &&
                            ['create', 'edit'].includes(optionType) &&
                            fieldInfo.classfity_type !== ClassifyType.Auto &&
                            hasSafeAdmin &&
                            module !== 'logic_entity' && (
                                <Tooltip title={__('清空')} placement="bottom">
                                    <CloseCircleFilled
                                        className={styles.clearIcon}
                                        onClick={() => {
                                            if (isCustomOrLogic) {
                                                setFieldList?.(
                                                    fieldList.map((f) => {
                                                        if (
                                                            f.id ===
                                                            fieldInfo.id
                                                        ) {
                                                            return {
                                                                ...f,
                                                                attribute_id:
                                                                    '',
                                                                attribute_name:
                                                                    '',
                                                                attribute_path:
                                                                    '',
                                                                label_id: '',
                                                                label_name: '',
                                                                grade_type:
                                                                    GradeType.Manual,
                                                            }
                                                        }
                                                        return f
                                                    }),
                                                )
                                                return
                                            }

                                            editViewDetails({
                                                attribute_id: '',
                                                attribute_name: '',
                                                attribute_path: '',
                                                label_id: '',
                                                label_name: '',
                                                grade_type: GradeType.Manual,
                                            })
                                        }}
                                    />
                                </Tooltip>
                            )}
                    </div>
                    {['create', 'edit'].includes(optionType) &&
                        hasSafeAdmin &&
                        module !== 'logic_entity' && (
                            <Button
                                type="link"
                                className={styles.codeDetailBtn}
                                onClick={() => {
                                    setChooseAttrOpen(true)
                                }}
                            >
                                {__('选择')}
                            </Button>
                        )}
                </div>
                {fieldInfo.classfity_type === ClassifyType.Auto && (
                    <div
                        className={styles.autoClassifyTag}
                        title={__('根据探查结果自动分类')}
                    >
                        {__('探查分类')}
                    </div>
                )}
                {text &&
                    ['create', 'edit'].includes(optionType) &&
                    ['custom', 'logic_entity'].includes(module || '') &&
                    isTrueRole && (
                        <div className={styles.classifyTipWrapper}>
                            {__('来源构建库表模型时，引用库表的字段分类属性')}
                        </div>
                    )}
            </>
        )
    }

    const labelRender = (text: string, fieldInfo) => {
        const labelName = getLabelName(text, getGradeLabelOptions())
        // 判断分类属性是否已选择或有数据
        const hasAttribute = fieldInfo.attribute_id || fieldInfo.attribute_name

        return (
            <div className={styles.tagContainer}>
                {['create', 'edit'].includes(optionType) && hasSafeAdmin ? (
                    <TreeSelect
                        placeholder={
                            hasAttribute
                                ? __('请选择分级')
                                : __('请先选择分类属性再分级')
                        }
                        treeData={getGradeLabelOptions()}
                        switcherIcon={<DownOutlined />}
                        disabled={!hasAttribute}
                        onChange={(value) => {
                            const newLabelName = getLabelName(
                                value,
                                gradeLabelOptions,
                            )
                            editViewDetails({
                                label_id: value,
                                grade_type: GradeType.Manual,
                                label_name: newLabelName || '',
                            })
                        }}
                        value={text || undefined}
                        style={{ width: 220 }}
                        allowClear
                    />
                ) : (
                    <div className={styles.tagName}>
                        {labelName && (
                            <FontIcon
                                name="icon-biaoqianicon"
                                className={styles.tagIcon}
                                style={{ color: fieldInfo.label_icon }}
                            />
                        )}
                        <span
                            title={text ? `${__('数据分级标签：')}${text}` : ''}
                        >
                            {labelName || '--'}
                        </span>
                    </div>
                )}

                {fieldInfo.grade_type === GradeType.Auto && (
                    <div
                        className={styles.autoClassifyTag}
                        title={__('根据探查结果自动分级')}
                    >
                        {__('探查分级')}
                    </div>
                )}

                {/* {text && module !== 'logic_entity' && optionType === 'edit' && (
                    <div className={styles.tagTips}>
                        {__('来源于“分类属性”标签，不能直接更改')}
                    </div>
                )} */}
            </div>
        )
    }

    const renderDataAnalysisRule = (value: string, fieldInfo: any) => {
        return (
            <div className={styles['data-analysis-rule']}>
                {value || '--'}
                {['create', 'edit'].includes(optionType) && (
                    <Button
                        type="link"
                        className={styles.codeDetailBtn}
                        onClick={() => {
                            setConfigParseRuleOpen(true)
                            editViewDetails?.({
                                custom_data_type: fieldData.data_type,
                            })
                            setIsConfig(true)
                        }}
                    >
                        {__('配置')}
                    </Button>
                )}
            </div>
        )
    }

    const dataLengthRender = (value: string, fieldInfo: any) => {
        return (
            <div className={styles['data-analysis-rule']}>
                {fieldInfo.reset_data_length || value || '--'}
                {['create', 'edit'].includes(optionType) &&
                    fieldInfo.reset_before_data_type &&
                    fieldInfo.data_type === 'decimal' &&
                    !['logic_entity', 'custom'].includes(module || '') && (
                        <Button
                            type="link"
                            className={styles.codeDetailBtn}
                            onClick={() => {
                                setConfigParseRuleOpen(true)
                                editViewDetails?.({
                                    // 用户自定义的类型 ，为了再次更改时 取消 恢复自定义类型
                                    custom_data_type:
                                        fieldData.reset_before_data_type
                                            ? fieldData.data_type
                                            : '',
                                })
                                setIsConfig(true)
                            }}
                        >
                            {__('编辑')}
                        </Button>
                    )}
            </div>
        )
    }

    const dataAccuracyRender = (value: number, fieldInfo: any) => {
        const showDataAccuracy = fieldInfo.reset_before_data_type
            ? fieldInfo.reset_data_accuracy
            : fieldInfo.data_accuracy
        return (
            <div className={styles['data-analysis-rule']}>
                {showDataAccuracy}
                {['create', 'edit'].includes(optionType) &&
                    fieldInfo.reset_before_data_type &&
                    !['logic_entity', 'custom'].includes(module || '') && (
                        <Button
                            type="link"
                            className={styles.codeDetailBtn}
                            onClick={() => {
                                setConfigParseRuleOpen(true)
                                editViewDetails?.({
                                    // 用户自定义的类型 ，为了再次更改时 取消 恢复自定义类型
                                    custom_data_type:
                                        fieldData.reset_before_data_type
                                            ? fieldData.data_type
                                            : '',
                                })
                                setIsConfig(true)
                            }}
                        >
                            {__('编辑')}
                        </Button>
                    )}
            </div>
        )
    }

    /**
     * 展示详情页面（如编码规则/码表详情）
     * @param dataType 查看数据类型
     * @param dataId 查看的数据id
     */
    const handleShowDataDetail = (dataType: CatalogType, dataId?: string) => {
        let myDetailIds: any[] = []
        // 码表详情
        if (dataId) {
            // 选择对话框中选择列表中码表查看详情
            myDetailIds = [{ key: dataId }]
            setDetailId(dataId)
        }
        const firstId = myDetailIds.length > 0 ? myDetailIds[0] : ''
        if (myDetailIds.length && firstId !== '') {
            setDetailIds(myDetailIds)
            if (dataType === CatalogType.DATAELE) {
                setDataEleDetailVisible(true)
                setDataEleMatchType(1)
            } else {
                setCodeTbDetailVisible(true)
            }
        }
    }

    const editViewDetails = async (param: any) => {
        setFieldList?.(
            fieldList.map((f) => {
                if (f.id === fieldData?.id) {
                    return {
                        ...f,
                        ...param,
                    }
                }
                return f
            }),
        )
    }

    // 获取数据数据标准详情
    const getDataEleDetails = async (standardId: string) => {
        try {
            const res = await getDataEleDetailById({
                type: 2,
                value: standardId,
            })
            const flag = res?.data?.dict_id === fieldData?.code_table_id
            updateFieldDetail(flag)
        } catch (err) {
            formatError(err)
        }
    }

    const toEditDatasheetView = async () => {
        try {
            setConfirmBtnLoading(true)
            setIsTimestamp(!isTimestamp)
            setConfirmVisible(false)
            setFieldList?.(
                fieldList.map((f) => {
                    if (f.id === fieldData.id) {
                        return {
                            ...f,
                            business_timestamp: !isTimestamp,
                        }
                    }
                    return {
                        ...f,
                        business_timestamp: !isTimestamp
                            ? false
                            : f.business_timestamp,
                    }
                }),
            )
        } catch (err) {
            formatError(err)
        } finally {
            setConfirmBtnLoading(false)
        }
    }

    const resetEditStatus = () => {
        setIsFiledNameRepeat(false)
    }

    const getDetailsList = (fields: any[]) => {
        const dataType = fieldData.data_type
            ? getCommonDataType(fieldData.data_type)
            : ''
        let result = fields
        // 除char和decimal外 不展示数据长度和数据精度
        if (!dataType || !['char', 'decimal'].includes(dataType)) {
            result = result.filter(
                (item) =>
                    item.key !== 'data_length' && item.key !== 'data_accuracy',
            )
        }
        // 非'date', 'datetime', 'time' 或者 为转换过类型的 或 逻辑实体/自定义 不展示转换规则
        if (
            !['date', 'datetime', 'time'].includes(dataType) ||
            !fieldData.reset_before_data_type ||
            ['logic_entity', 'custom'].includes(module || '')
        ) {
            result = result.filter((it) => it.key !== 'reset_convert_rules')
        }

        // 非 'decimal' 类型 不展示数据精度

        if (dataType !== 'decimal') {
            result = result.filter((it) => it.key !== 'data_accuracy')
        }

        return result
    }

    return (
        <div>
            <Drawer
                // title={
                //     <span style={{ cursor: 'pointer' }} onClick={onClose}>
                //         <RightOutlined style={{ marginRight: '12px' }} />
                //         <span className={styles.detailsBtn}>
                //             {__('收起字段详情')}
                //         </span>
                //     </span>
                // }
                title={__('字段详情')}
                placement="right"
                onClose={onClose}
                open={open}
                // closable={false}
                width={460}
                style={
                    isCustomOrLogic
                        ? {}
                        : {
                              height: `calc(100% - ${
                                  optionType === 'view' && isDataView ? 114 : 52
                              }px)`,
                              marginTop:
                                  optionType === 'view' && isDataView
                                      ? 114
                                      : 52,
                          }
                }
                getContainer={false}
                mask={false}
            >
                <div className={styles.fieldDetailBox} ref={nodeRef}>
                    {fieldDetail.map((item) => {
                        return (
                            <div key={item.key}>
                                <div className={styles.detailTitle}>
                                    <span className={styles.detailTitleLine} />
                                    {item.label}
                                    {isCustomOrLogic &&
                                        item.key === 'fieldInfo' && (
                                            <span
                                                className={
                                                    styles.detailSubTitle
                                                }
                                            >
                                                {__(
                                                    '（当前类型的库表只能在“模型”页面更改）',
                                                )}
                                            </span>
                                        )}
                                    {isCustomOrLogic &&
                                        module === 'logic_entity' &&
                                        item.key === 'classificationInfo' && (
                                            <span
                                                className={
                                                    styles.detailSubTitle
                                                }
                                            >
                                                {__(
                                                    '（来源于“逻辑实体属性”，不能直接更改）',
                                                )}
                                            </span>
                                        )}
                                    {/* {isTrueRole &&
                                        item.key === 'tecInfo' &&
                                        !['logic_entity', 'custom'].includes(
                                            module || '',
                                        ) &&
                                        ['create', 'edit'].includes(
                                            optionType,
                                        ) && (
                                            <Tooltip
                                                color="#fff"
                                                placement="bottomRight"
                                                arrowPointAtCenter
                                                autoAdjustOverflow
                                                overlayInnerStyle={{
                                                    width: 518,
                                                    color: '#000',
                                                    wordBreak: 'break-word',
                                                }}
                                                title={
                                                    <div>
                                                        <div>
                                                            {__('属性说明：')}
                                                        </div>
                                                        <div>
                                                            {__(
                                                                '1、若字段“预设”的“数据类型”被手动转换（更改），且转换后为“date/timestamp/time”，则当前字段增加“解析规则”属性。',
                                                            )}
                                                        </div>
                                                        <div>
                                                            {__(
                                                                '2、仅“decimal”的数据类型有“数据精度”属性，预设的“decimal”类型，不可以编辑数据长度和精度，只有将其它类型手动转换为“decimal”时才可以编辑。',
                                                            )}
                                                        </div>
                                                    </div>
                                                }
                                            >
                                                <InfoCircleOutlined
                                                    className={
                                                        styles.tecInfoIcon
                                                    }
                                                />
                                            </Tooltip>
                                        )} */}
                                </div>
                                <div className={styles.detailBox}>
                                    {item.key === 'templeInfo' ? (
                                        <div className={styles.templeInfoBox}>
                                            {getTempleInfo()}
                                        </div>
                                    ) : item.key === 'timestamp' ? (
                                        <div className={styles.moreInfoBox}>
                                            {optionType === 'view' ? (
                                                __('已设置为业务数据更新时间戳')
                                            ) : (
                                                <>
                                                    <div
                                                        className={
                                                            styles.firstLine
                                                        }
                                                    >
                                                        <div>
                                                            {__(
                                                                '设为业务数据更新时间戳：',
                                                            )}
                                                        </div>
                                                        <Switch
                                                            checked={
                                                                isTimestamp
                                                            }
                                                            size="small"
                                                            onChange={() =>
                                                                businessTimestampField?.id &&
                                                                !isTimestamp
                                                                    ? setConfirmVisible(
                                                                          true,
                                                                      )
                                                                    : toEditDatasheetView()
                                                            }
                                                        />
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.secondLine
                                                        }
                                                    >
                                                        {__('当前配置字段：')}
                                                        {businessTimestampField?.business_name ||
                                                            '--'}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <DetailsLabel
                                            detailsList={getDetailsList(
                                                item.fields,
                                            )}
                                            labelWidth="120px"
                                        />
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    {(data?.status === stateType.delete ||
                        data?.status === stateType.modify) && (
                        <div className={styles.delDesc}>
                            {getStateTag(
                                data?.status === stateType.delete
                                    ? 'del'
                                    : 'modify',
                            )}
                            <span className={styles.delText}>
                                {fieldTagsTips[data?.status]}
                            </span>
                        </div>
                    )}
                </div>
            </Drawer>

            {/* 选择码表/编码规则 */}
            {selDataByTypeVisible && (
                <SelDataByTypeModal
                    visible={selDataByTypeVisible}
                    ref={selDataRef}
                    onClose={() => {
                        setSelDataByTypeVisible(false)
                        if (selDataType === CatalogType.CODETABLE) {
                            setIsCodeNameEdit(false)
                        } else {
                            setIsStandardNameEdit(false)
                        }
                    }}
                    dataType={selDataType}
                    oprItems={
                        selDataType === CatalogType.CODETABLE
                            ? selDataItems
                            : selStandardItems
                    }
                    setOprItems={(o) => {
                        const [selectData] = o
                        if (selDataType === CatalogType.CODETABLE) {
                            if (isCustomOrLogic) {
                                setFieldList?.(
                                    fieldList.map((f) => {
                                        if (f.id === fieldData.id) {
                                            return {
                                                ...f,
                                                code_table: selectData?.label,
                                                code_table_id: selectData?.key,
                                            }
                                        }
                                        return f
                                    }),
                                )
                                return
                            }
                            setSelDataItems(o)
                            setIsCodeNameEdit(false)
                            editViewDetails({
                                code_table: selectData?.label,
                                code_table_id: selectData?.key,
                            })
                        } else {
                            if (isCustomOrLogic) {
                                setFieldList?.(
                                    fieldList.map((f) => {
                                        if (f.id === fieldData.id) {
                                            return {
                                                ...f,
                                                ...(selectData?.dict_id
                                                    ? {
                                                          code_table:
                                                              selectData?.dict_name ||
                                                              '',
                                                          code_table_id:
                                                              selectData?.dict_id ||
                                                              '',
                                                          standard:
                                                              selectData?.label,
                                                          standard_code:
                                                              selectData?.code,
                                                      }
                                                    : {
                                                          standard:
                                                              selectData?.label,
                                                          standard_code:
                                                              selectData?.code,
                                                      }),
                                            }
                                        }
                                        return f
                                    }),
                                )
                                return
                            }
                            if (selectData?.dict_id) {
                                setIsDataEleDict(true)
                                setSelDataItems([
                                    {
                                        key: selectData?.dict_id || '',
                                        label: selectData?.dict_name || '',
                                    },
                                ])
                            }
                            setSelStandardItems(o)
                            setIsStandardNameEdit(false)
                            editViewDetails(
                                selectData?.dict_id
                                    ? {
                                          code_table:
                                              selectData?.dict_name || '',
                                          code_table_id:
                                              selectData?.dict_id || '',
                                          standard: selectData?.label,
                                          standard_code: selectData?.code,
                                      }
                                    : {
                                          standard: selectData?.label,
                                          standard_code: selectData?.code,
                                      },
                            )
                        }
                    }}
                    handleShowDataDetail={handleShowDataDetail}
                    stdRecParams={stdRecParams}
                />
            )}

            {/* 查看码表详情 */}
            {detailIds && detailIds.length > 0 && codeTbDetailVisible && (
                <CodeTableDetails
                    visible={codeTbDetailVisible}
                    title={__('码表详情')}
                    dictId={detailIds[0].key}
                    onClose={() => setCodeTbDetailVisible(false)}
                    handleError={(errorKey: string) => {
                        if (
                            errorKey ===
                            'Standardization.ResourceError.DataNotExist'
                        ) {
                            // 清空码表
                            // form.setFieldValue('dict_id', [])
                            selDataRef?.current?.reloadData()
                            setDetailIds([])
                        }
                    }}
                    zIndex={1001}
                    getContainer={detailGetContainer}
                />
            )}
            {/* 查看数据元详情 */}
            {dataEleDetailVisible && !!detailId && (
                <DataEleDetails
                    visible={dataEleDetailVisible}
                    dataEleId={detailId}
                    onClose={() => setDataEleDetailVisible(false)}
                    dataEleMatchType={dataEleMatchType}
                    zIndex={1001}
                />
            )}
            {chooseAttrOpen && (
                <ChooseAttribute
                    open={chooseAttrOpen}
                    onClose={() => setChooseAttrOpen(false)}
                    onOk={(attrInfo) => {
                        if (isCustomOrLogic) {
                            setFieldList?.(
                                fieldList.map((f) => {
                                    if (f.id === fieldData.id) {
                                        return {
                                            ...f,
                                            ...attrInfo,
                                            label_id: attrInfo.label_id,
                                            label_name: attrInfo.label_name,
                                            grade_type: GradeType.Manual,
                                        }
                                    }
                                    return f
                                }),
                            )
                        } else {
                            editViewDetails({
                                ...attrInfo,
                                classfity_type: ClassifyType.Manual,
                                label_id: attrInfo.label_id,
                                label_name: attrInfo.label_name,
                                grade_type: GradeType.Manual,
                            })
                        }
                        setSelectedAttr(attrInfo)
                    }}
                    dataSheetId={dataSheetId}
                    fieldId={fieldData.id}
                    isStart={isStart}
                    selectedData={selectedAttr}
                />
            )}
            <Confirm
                open={confirmVisible}
                title={__('确定要替换吗？')}
                content={
                    <span style={{ color: 'rgb(0 0 0 / 45%)' }}>
                        {`${__('字段「 ')}${
                            businessTimestampField?.business_name
                        }${__(' 」已被设置为数据更新时间戳，是否替换为「 ')}${
                            fieldData?.business_name
                        }${__(' 」？')}`}
                    </span>
                }
                icon={
                    <ExclamationCircleFilled
                        style={{ color: '#FF8600', fontSize: 22 }}
                    />
                }
                onOk={toEditDatasheetView}
                onCancel={() => {
                    setConfirmVisible(false)
                }}
                width={432}
                okButtonProps={{ loading: confirmBtnLoading }}
            />
            {configParseRuleOpen && (
                <ConfigParseRule
                    open={configParseRuleOpen}
                    currentType={fieldData.reset_before_data_type}
                    targetType={fieldData.data_type}
                    fieldData={fieldData}
                    onClose={() => setConfigParseRuleOpen(false)}
                    onCancel={() => {
                        setConfigParseRuleOpen(false)
                        // 弹出内取消时，还原数据类型
                        editViewDetails?.({
                            data_type:
                                fieldData.custom_data_type ||
                                fieldData.reset_before_data_type,
                            reset_before_data_type:
                                fieldData.reset_before_data_type,
                            reset_data_length: fieldData.reset_data_length,
                            reset_data_accuracy: fieldData.reset_data_accuracy,
                            reset_convert_rules: [
                                'date',
                                'timestamp',
                                'time',
                            ].includes(
                                fieldData.custom_data_type ||
                                    fieldData.reset_before_data_type,
                            )
                                ? fieldData.reset_convert_rules
                                : '',
                        })
                        if (isConfig) {
                            setIsConfig(false)
                            return
                        }
                        message.success({
                            className: classnames(
                                styles['type-change-tip'],
                                styles['message-in-drawer'],
                            ),
                            content:
                                fieldData.data_type === 'decimal'
                                    ? __(
                                          '未完成数据长度和精度信息配置，已还原之前的数据',
                                      )
                                    : __('未完成测试，已还原之前的数据类型'),
                            icon: <span />,
                            duration: 3,
                        })
                    }}
                    onOk={(vals) => {
                        if (fieldData.data_type === 'decimal') {
                            editViewDetails({
                                reset_data_length: Number(vals.data_length),
                                reset_data_accuracy: Number(vals.data_accuracy),
                                reset_convert_rules: '',
                            })
                        } else {
                            editViewDetails({
                                ...vals,
                            })
                        }
                    }}
                />
            )}
        </div>
    )
})

export default FieldDetail
