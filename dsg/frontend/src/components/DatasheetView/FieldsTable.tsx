import { Badge, Dropdown, Tooltip } from 'antd'
import {
    forwardRef,
    ReactNode,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'

import {
    ClockCircleFilled,
    DownOutlined,
    ExclamationCircleFilled,
    InfoCircleFilled,
    LeftOutlined,
    RightOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import { useDebounceFn } from 'ahooks'
import classnames from 'classnames'
import dataEmpty from '@/assets/dataEmpty.svg'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import {
    allRoleList,
    formatError,
    getDataViewRepeat,
    getVirtualEngineExample,
    HasAccess,
    IGradeLabel,
    LogicViewType,
} from '@/core'
import { databaseTypesEleData } from '@/core/dataSource'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { FontIcon } from '@/icons'
import { SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import { useQuery, isSemanticGovernanceApp } from '@/utils'
import { info } from '@/utils/modalHelper'
import { highLight } from '../ApiServices/const'
import { AutoCompletionIcon } from './AutoCompletion/AutoCompletionIcon'
import DataClassifyFilters from './DataClassifyFilters'
import { useDataViewContext } from './DataViewProvider'
import FieldDetail from './FieldDetail'
import Icons from './Icons'
import { ClassifyType, GradeType, IconType, stateType } from './const'
import {
    ErrorTips,
    fieldSearchList,
    getFieldTypeEelment,
    getStateTag,
    updateExcelFieldsStatus,
    validateRepeatName,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'

interface IFieldsTable {
    fieldList: any[]
    setFieldList: (data: any[]) => void
    datasheetInfo: {
        business_name: string
        technical_name: string
        datasource_type?: IconType
        view_source_catalog_name?: string
        datasource_id?: string
        [key: string]: any
    }
    setDatasheetInfo: (value) => void
    dataViewList?: any[]
    upDateDetails?: () => void
    openDataViewDetail?: boolean
    setDataViewDetailOpen?: (open: boolean) => void
    isDataView?: boolean
    isStart?: boolean
    tagData?: IGradeLabel[]
    dataSheetId?: string
    // 是否编辑自定义和或库表
    isCustomOrLogic?: boolean
    detailGetContainer?: any
    // 自定义和实体库表使用，选中字段相关信息
    moreOffset?: number
    selectFieldId?: string
    // 点击补全
    onClickCompletion?: () => void
    taskIsCompleted?: boolean
}

// 页面路径中获取参数
const FieldsTable = forwardRef((props: IFieldsTable, ref) => {
    const {
        fieldList,
        setFieldList,
        datasheetInfo,
        setDatasheetInfo,
        dataViewList = [],
        upDateDetails,
        openDataViewDetail,
        setDataViewDetailOpen,
        isDataView,
        isStart,
        tagData,
        dataSheetId,
        isCustomOrLogic = false,
        detailGetContainer = false,
        moreOffset,
        selectFieldId,
        onClickCompletion,
        taskIsCompleted,
    } = props

    const fieldDetailRef: any = useRef()
    const query = useQuery()
    const tableId = query.get('id') || ''
    const dataSourceType = query.get('dataSourceType') || ''

    const { optionType, completeStatus, logicViewType, dataOriginType } =
        useDataViewContext()
    // semanticGovernance 专用
    const isSemanticGovernance = isSemanticGovernanceApp()
    const [dataviewInfo, setDataviewInfo] = useState<any>()
    const [tableList, setTableList] = useState<any[]>([])
    const [fieldSearchData, setFieldSearchData] =
        useState<any[]>(fieldSearchList)
    const [total, setTotal] = useState<number>(1)
    const [offset, setOffset] = useState<number>(1)
    const [limit, setLimit] = useState<number>(8)
    const [currentData, setCurrentData] = useState<any>(
        selectFieldId ? { id: selectFieldId } : {},
    )

    const [isSearch, setIsSearch] = useState<boolean>(false)
    const [exampleLoading, setExampleLoading] = useState<boolean>(false)
    const [searchKey, setSearchKey] = useState<string>('')
    const [searchEditValue, setSearchEditValue] = useState<string>('')
    const [fieldSearchValue, setFieldSearchValue] = useState<string>('')
    const [editTableNameValue, setEditTableNameValue] = useState<string>()
    const [editTableNameFlag, setEditTableNameFlag] = useState<boolean>(false)
    const [openFieldDetail, setOpenFieldDetail] = useState<boolean>(
        !!selectFieldId,
    )
    const [manualOpenFieldDetail, setManualOpenFieldDetail] =
        useState<boolean>(true)
    const [ColoredIcon, setColoredIcon] = useState<ReactNode | null>(null)
    const [businessTimestampField, setBusinessTimestampField] = useState<any>()
    const [classifyFilters, setClassifyFilters] = useState<{
        classfity_type: ClassifyType
        label_id: string[]
        sensitive_type?: number | ''
        secret_type?: number | ''
    }>()
    const { checkPermission, checkPermissions } = useUserPermCtx()
    const [userInfo] = useCurrentUser()

    // 使用useRef绑定DOM对象
    const domRef = useRef<HTMLDivElement>(null)

    const isTrueRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])

    // 安全管理员
    const hasSafeAdmin = useMemo(() => {
        return checkPermission(allRoleList.SecurityAdmin) ?? false
    }, [checkPermission])

    // 组件初始化绑定点击事件
    // useEffect(() => {
    //     const handleClickOutSide = (e: MouseEvent) => {
    //         // 判断用户点击的对象是否在DOM节点内部
    //         if (!domRef.current?.contains(e.target as Node)) {
    //             // setCurrentData({})
    //             // setOpenFieldDetail(false)
    //         }
    //     }
    //     document.addEventListener('mousedown', handleClickOutSide)
    //     return () => {
    //         document.removeEventListener('mousedown', handleClickOutSide)
    //     }
    // }, [])

    useImperativeHandle(ref, () => ({
        showErrorModal,
        offset,
        currentDataId: currentData?.id,
        hideFieldDetails,
    }))

    const hideFieldDetails = () => {
        setOpenFieldDetail(false)
    }

    useEffect(() => {
        if (fieldList) {
            const list =
                optionType === 'edit'
                    ? dataSourceType === 'excel'
                        ? updateExcelFieldsStatus(fieldList)
                        : fieldList
                              .filter(
                                  (item) => item.status !== stateType.delete,
                              )
                              .map((item, index, arry) => ({
                                  ...item,
                                  tips: validateRepeatName(arry, item)
                                      ? __(
                                            '此名称和其他字段的业务名称重复，请修改',
                                        )
                                      : '',
                              }))
                    : fieldList.map((item) => ({
                          ...item,
                          tips: '',
                      }))
            setTableList(list)
            setTotal(list.length || 1)
            if (optionType === 'view') {
                setOffset(1)
                setFieldSearchValue('')
            }
            if (fieldSearchValue || searchKey) {
                searchField(searchKey, fieldSearchValue, list)
            }
            if (currentData?.id && fieldList?.length > 0) {
                setCurrentData(
                    fieldList.find((item) => item.id === currentData.id),
                )
            }
            if (moreOffset) {
                setOffset(moreOffset)
            }
            setBusinessTimestampField(
                fieldList.find((item) => item.business_timestamp),
            )
            const fielsSearchDot = {
                '1':
                    list.filter((it) => it.status === stateType.new)?.length >
                    0,
                '2': list.filter((it) => !!it.tips)?.length > 0,
                '3':
                    list.filter((it) => it.status === stateType.modify)
                        ?.length > 0,
            }
            setFieldSearchData(
                fieldSearchList.map((item) => ({
                    ...item,
                    dot:
                        item.value === ''
                            ? Object.values(fielsSearchDot).some((it) => it)
                            : fielsSearchDot[item.value],
                })),
            )
        }
    }, [fieldList, optionType])

    useEffect(() => {
        if (datasheetInfo) {
            setDataviewInfo({
                ...datasheetInfo,
                business_name_tips:
                    datasheetInfo?.business_name_tips ||
                    (datasheetInfo?.business_name
                        ? ''
                        : __('库表业务名称不能为空')),
                technical_name_tips:
                    datasheetInfo?.technical_name_tips ||
                    (datasheetInfo?.technical_name
                        ? ''
                        : __('库表技术名称不能为空')),
            })
        }
    }, [datasheetInfo])

    useEffect(() => {
        if (datasheetInfo?.datasource_type) {
            const { Colored } =
                databaseTypesEleData.dataBaseIcons[
                    datasheetInfo.datasource_type
                ]
            setColoredIcon(<Colored className={styles.icon} />)
        }
    }, [datasheetInfo?.datasource_type])

    useEffect(() => {
        searchField(searchKey, fieldSearchValue)
    }, [searchKey, fieldSearchValue, isStart, classifyFilters])

    useEffect(() => {
        initParams()
    }, [optionType])

    useEffect(() => {
        setOpenFieldDetail(currentData?.id && !openDataViewDetail)
    }, [openDataViewDetail])

    const initParams = () => {
        setSearchKey('')
        setIsSearch(false)
        setClassifyFilters(undefined)
        if (optionType === 'view') {
            setEditTableNameFlag(false)
        }
    }

    const fieldEdit = (id: string, isEdit: boolean, name?: string) => {
        const data = searchKey || fieldSearchValue ? tableList : fieldList
        const list = data
            .map((item) => ({
                ...item,
                isEdit: id === item.id ? isEdit : false,
                business_name:
                    name && id === item.id ? name : item.business_name,
            }))
            .map((item, index, arry) => {
                return {
                    ...item,
                    tips: validateRepeatName(arry, item)
                        ? __('此名称和其他字段的业务名称重复，请修改')
                        : '',
                }
            })
        setTableList(list)
        if (!isEdit) {
            setFieldList(
                fieldList.map((item) => ({
                    ...item,
                    ...list.find((it) => it.id === item.id),
                })),
            )
            const curData = fieldList?.find((item) => item.id === id)
            setCurrentData({
                ...curData,
                business_name: name || curData.business_name,
            })
        }
        if (!isEdit && list.filter((item) => item.tips).length === 0) {
            setFieldSearchValue('')
        }
    }

    const showEmpty = () => {
        return (
            <div className={styles.indexEmptyBox}>
                {/* <Empty /> */}
                {searchKey
                    ? __('抱歉，没有找到相关内容')
                    : fieldSearchValue === '2'
                    ? __('无异常字段')
                    : fieldSearchValue === '1'
                    ? __('无新增字段')
                    : __('抱歉，没有找到相关内容')}
            </div>
        )
    }

    const searchField = (kw: string, value: string, dataList?: any) => {
        const list =
            dataList ||
            (optionType === 'edit'
                ? fieldList?.filter((item) => item.status !== stateType.delete)
                : fieldList)
        if (!kw && !value && !classifyFilters) {
            setTableList(list)
            setTotal(list.length || 1)
            if (Math.ceil(list.length / limit) < offset) {
                setOffset(1)
            }
            return
        }
        let data = list
            .filter(
                (item) =>
                    item.business_name
                        .toLocaleLowerCase()
                        .includes(kw.toLocaleLowerCase()) ||
                    item.technical_name
                        .toLocaleLowerCase()
                        .includes(kw.toLocaleLowerCase()),
            )
            .filter((item) =>
                value === '1'
                    ? item.status === stateType.new
                    : value === '2'
                    ? item.tips
                    : value === '3'
                    ? item.status === stateType.modify
                    : value === '4'
                    ? item.reset_before_data_type &&
                      item.data_type &&
                      item.reset_before_data_type !== item.data_type
                    : item,
            )
        if (classifyFilters) {
            data = data.filter((item) => {
                // 1 敏感/涉密， 0 未分类，初始值为0
                const sensitiveFlag =
                    classifyFilters.sensitive_type === undefined
                        ? true
                        : item.sensitive_type === classifyFilters.sensitive_type
                const secretFlag =
                    classifyFilters.secret_type === undefined
                        ? true
                        : item.secret_type === classifyFilters.secret_type
                const flag = sensitiveFlag && secretFlag
                if (classifyFilters.classfity_type === ClassifyType.NotLimit) {
                    if (classifyFilters.label_id.length > 0) {
                        return (
                            classifyFilters.label_id.includes(item.label_id) &&
                            flag
                        )
                    }
                    return flag
                }
                if (classifyFilters.classfity_type === ClassifyType.No) {
                    if (classifyFilters.label_id.length > 0) {
                        return (
                            classifyFilters.label_id.includes(item.label_id) &&
                            ![ClassifyType.Auto, ClassifyType.Manual].includes(
                                item.classfity_type,
                            ) &&
                            flag
                        )
                    }
                    return !item.classfity_type && flag
                }

                if (classifyFilters.label_id.length === 0) {
                    return (
                        item.classfity_type ===
                            classifyFilters.classfity_type && flag
                    )
                }

                return (
                    classifyFilters.label_id.includes(item.label_id) &&
                    item.classfity_type === classifyFilters.classfity_type &&
                    flag
                )
            })
        }

        setTableList(data)
        setTotal(data.length || 1)
        if (Math.ceil(data.length / limit) < offset) {
            setOffset(1)
        }
    }

    const getExampleList = async (item: any) => {
        const table = datasheetInfo?.technical_name
        const [catalog, schema] = datasheetInfo?.view_source_catalog_name
            ? datasheetInfo.view_source_catalog_name.split('.')
            : []
        if (!table || !schema || !catalog || !userInfo) return
        setExampleLoading(true)
        try {
            const data = await getVirtualEngineExample({
                catalog,
                schema,
                table,
                user: userInfo?.Account || '',
                limit: 10,
                type: 0,
                user_id: userInfo?.ID || '',
            })
            const list: any[] = []
            const resColumns = data?.columns?.map((it) => it.name)
            data?.data.forEach((it) => {
                const obj: any = {}
                resColumns.forEach((i, inx) => {
                    obj[i] = it[inx]
                })
                list.push(obj)
            })
            const sample_data =
                list
                    .filter((it, index) => index < 3)
                    .map((it) => it[item.technical_name]) || []
            setCurrentData({ ...item, sample_data })
        } catch (err) {
            formatError(err)
        } finally {
            setExampleLoading(false)
        }
    }
    const dropdownItems = [
        {
            key: '1',
            label: (
                <div className={styles.fieldsDropdownOverlay}>
                    {fieldSearchData.map((item, index) => {
                        return (
                            <div
                                onClick={() => {
                                    setFieldSearchValue(item.value)
                                }}
                                className={classnames(
                                    styles.typeItem,
                                    item.value === fieldSearchValue &&
                                        styles.active,
                                    item.value === '4' &&
                                        styles.typeTransformItem,
                                )}
                                key={`${item.value}-${index}`}
                            >
                                <Badge
                                    offset={[4, 0]}
                                    dot={item.value && item.dot}
                                >
                                    {item.label}
                                </Badge>
                            </div>
                        )
                    })}
                </div>
            ),
        },
    ]

    const showErrorModal = () => {
        info({
            title: __('无法发布'),
            icon: <ExclamationCircleFilled style={{ color: '#1890FF' }} />,
            content: (
                <div>
                    <span>{__('请检查并完善带')}</span>
                    <span style={{ margin: '0 4px' }}>
                        <Icons type={IconType.ERROR} />
                    </span>
                    <span>{__('的异常字段信息')}</span>
                </div>
            ),
            onOk() {
                if (dataviewInfo?.business_name_tips) return
                const data = tableList.find((item) => item.tips) || {}
                const dataIndex = tableList.findIndex((item) => item.tips)
                setCurrentData(data)
                setOffset(Math.ceil((dataIndex + 1) / limit))
                // 选择异常字段
                setFieldSearchValue('2')
            },
            okText: __('确定'),
        })
    }

    const onFieldClick = (item) => {
        setCurrentData(item)
        setOpenFieldDetail(true)
        setDataViewDetailOpen?.(false)
        setManualOpenFieldDetail(true)
    }

    const nameVerify = async (
        name: string,
        flag: 'business_name' | 'technical_name',
    ) => {
        try {
            const res = await getDataViewRepeat({
                form_id: tableId,
                name,
                datasource_id: dataviewInfo?.datasource_id,
                name_type: flag,
                type: logicViewType,
            })
            setDataviewInfo({
                ...dataviewInfo,
                business_name: name,
                business_name_tips: res
                    ? __('业务名称和其他库表重复，请修改')
                    : '',
            })
        } catch (err) {
            formatError(err)
        }
    }
    const { run: nameVerifyFn } = useDebounceFn(nameVerify, {
        wait: 400,
        leading: false,
        trailing: true,
    })

    const onFieldDataChange = (curData) => {
        const list = fieldList.map((item) => ({
            ...item,
            business_name:
                curData.id === item.id
                    ? curData.business_name
                    : item.business_name,
        }))
        setCurrentData(curData)
        setFieldList(list)
    }

    return (
        <div className={styles.fieldsTableWrapper}>
            {optionType === 'view' &&
                isDataView &&
                dataviewInfo?.status === stateType.modify &&
                dataviewInfo?.edit_status === 'draft' && (
                    <div className={styles.modifyTips}>
                        <InfoCircleFilled className={styles.icon} />
                        {__(
                            '扫描发现源表更改，已自动生成草稿，通过${state}库表来查看和发布内容。',
                            {
                                state: dataviewInfo.last_publish_time
                                    ? __('变更')
                                    : __('编辑'),
                            },
                        )}
                    </div>
                )}
            {optionType !== 'edit' && (
                <div className={styles.tableTitle}>
                    <div />
                    <div className={styles.classificationFilter}>
                        <DataClassifyFilters
                            onChange={setClassifyFilters}
                            isStart={isStart}
                            tagData={tagData}
                        />
                    </div>
                </div>
            )}
            {optionType === 'edit' &&
                (dataOriginType !== 'excel' || datasheetInfo) && (
                    <div className={styles.tableTitle}>
                        {!isCustomOrLogic ? (
                            <div className={styles.desc}>
                                {__('双击下方列表可更改对应字段')}
                            </div>
                        ) : (
                            <div />
                        )}
                        <div className={styles.filterContainer}>
                            {!isCustomOrLogic && (
                                <Dropdown
                                    menu={{ items: dropdownItems }}
                                    getPopupContainer={(node) =>
                                        node.parentElement || node
                                    }
                                    trigger={['click']}
                                    // overlayStyle={{
                                    //     width: 180,
                                    // }}
                                >
                                    <div className={styles.filterBox}>
                                        <span className={styles.filterText}>
                                            <Badge
                                                offset={[4, 0]}
                                                dot={
                                                    fieldSearchData.find(
                                                        (it) =>
                                                            it.value ===
                                                            fieldSearchValue,
                                                    )?.dot
                                                }
                                            >
                                                {
                                                    fieldSearchData.find(
                                                        (it) =>
                                                            it.value ===
                                                            fieldSearchValue,
                                                    )?.label
                                                }
                                            </Badge>
                                        </span>
                                        <span className={styles.dropIcon}>
                                            <DownOutlined />
                                        </span>
                                    </div>
                                </Dropdown>
                            )}
                            <div className={styles.classificationFilter}>
                                <DataClassifyFilters
                                    onChange={setClassifyFilters}
                                    isStart={isStart}
                                    tagData={tagData}
                                />
                            </div>
                        </div>
                    </div>
                )}
            {dataOriginType !== 'excel' || datasheetInfo ? (
                <div className={styles.tableContainer}>
                    <div className={styles.tableHeader}>
                        {isSemanticGovernance &&
                            logicViewType === LogicViewType.DataSource &&
                            !taskIsCompleted && (
                                <AutoCompletionIcon
                                    viewModal="table"
                                    onClick={() => onClickCompletion?.()}
                                />
                            )}
                        {isSearch ? (
                            <div className={styles.tableHeaderSearch}>
                                <SearchInput
                                    value={searchKey}
                                    onBlur={() => {
                                        setIsSearch(!!searchKey)
                                    }}
                                    placeholder={__(
                                        '搜索字段业务名称、技术名称',
                                    )}
                                    onKeyChange={(kw: string) => {
                                        setSearchKey(kw)
                                    }}
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <>
                                <div
                                    className={classnames(
                                        styles.tableItem,
                                        styles.headerLeft,
                                    )}
                                    onClick={() => {
                                        if (dataSourceType === 'excel') {
                                            setOpenFieldDetail(false)
                                            setDataViewDetailOpen?.(true)
                                            setCurrentData({})
                                        } else {
                                            if (
                                                !dataviewInfo?.business_name &&
                                                !dataviewInfo?.technical_name
                                            )
                                                return
                                            setOpenFieldDetail(false)
                                            setDataViewDetailOpen?.(true)
                                            setCurrentData({})
                                        }
                                    }}
                                >
                                    <span className={styles.iconBox}>
                                        {dataviewInfo?.datasource_type &&
                                            ColoredIcon}
                                    </span>

                                    <div
                                        className={classnames(
                                            styles.nameBox,
                                            optionType === 'edit' &&
                                                styles.pointer,
                                        )}
                                        onDoubleClick={() => {
                                            if (
                                                optionType === 'view' ||
                                                isCustomOrLogic
                                            ) {
                                                return
                                            }
                                            setEditTableNameFlag(true)
                                            setEditTableNameValue(
                                                dataviewInfo?.business_name,
                                            )
                                        }}
                                    >
                                        <div
                                            title={`${__('业务名称')}：${
                                                dataviewInfo?.business_name
                                            }`}
                                            className={styles.name}
                                        >
                                            {editTableNameFlag ? (
                                                <SearchInput
                                                    value={editTableNameValue}
                                                    onBlur={(e) => {
                                                        const value =
                                                            e.target?.value.trim()
                                                        setEditTableNameFlag(
                                                            false,
                                                        )
                                                        setEditTableNameValue(
                                                            '',
                                                        )
                                                        setDatasheetInfo(
                                                            (prev) => ({
                                                                ...prev,
                                                                ...dataviewInfo,
                                                                business_name:
                                                                    value ||
                                                                    datasheetInfo?.business_name,
                                                            }),
                                                        )
                                                    }}
                                                    maxLength={255}
                                                    placeholder={__(
                                                        '请填写库表业务名称',
                                                    )}
                                                    onChange={(e) => {
                                                        const value =
                                                            e.target?.value.trim()
                                                        setEditTableNameValue(
                                                            value,
                                                        )
                                                        if (value) {
                                                            nameVerifyFn(
                                                                value,
                                                                'business_name',
                                                            )
                                                        }
                                                    }}
                                                    autoFocus
                                                    showIcon={false}
                                                    allowClear={false}
                                                    status={
                                                        dataviewInfo?.business_name_tips
                                                            ? 'error'
                                                            : ''
                                                    }
                                                    suffix={
                                                        dataviewInfo?.business_name_tips && (
                                                            <ErrorTips
                                                                title={
                                                                    dataviewInfo?.business_name_tips
                                                                }
                                                            />
                                                        )
                                                    }
                                                />
                                            ) : (
                                                <div
                                                    className={
                                                        styles.nameTextBox
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            styles.nameText
                                                        }
                                                    >
                                                        {
                                                            dataviewInfo?.business_name
                                                        }
                                                    </span>
                                                    {dataviewInfo?.business_name_tips &&
                                                        (optionType ===
                                                            'edit' ||
                                                            optionType ===
                                                                'create') && (
                                                            <ErrorTips
                                                                title={
                                                                    !dataviewInfo?.business_name &&
                                                                    !dataviewInfo?.technical_name
                                                                        ? __(
                                                                              '库表业务名称和技术名称不能为空',
                                                                          )
                                                                        : dataviewInfo?.business_name_tips
                                                                }
                                                            />
                                                        )}
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            title={
                                                dataviewInfo?.technical_name
                                                    ? `${__('技术名称')}：${
                                                          dataviewInfo?.technical_name
                                                      }`
                                                    : ''
                                            }
                                            className={styles.code}
                                        >
                                            <span className={styles.codeText}>
                                                {dataviewInfo?.technical_name}
                                                {dataviewInfo?.business_name &&
                                                    !dataviewInfo?.technical_name && (
                                                        <ErrorTips
                                                            title={__(
                                                                '库表技术名称不能为空',
                                                            )}
                                                        />
                                                    )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <Tooltip
                                        placement="bottom"
                                        title={__('搜索')}
                                    >
                                        <SearchOutlined
                                            onClick={() => {
                                                setIsSearch(true)
                                            }}
                                            className={styles.headerSearchBtn}
                                        />
                                    </Tooltip>
                                </div>
                            </>
                        )}
                    </div>
                    <div>
                        <div
                            ref={domRef}
                            className={classnames(
                                tableList.length > limit && styles.fieldBox,
                            )}
                        >
                            {tableList.length === 0
                                ? showEmpty()
                                : tableList
                                      .filter(
                                          (item, index) =>
                                              index < offset * limit &&
                                              index > (offset - 1) * limit - 1,
                                      )
                                      .map((item) => {
                                          return (
                                              <div
                                                  className={classnames(
                                                      styles.tableItemBox,
                                                      currentData?.id ===
                                                          item.id &&
                                                          styles.active,
                                                  )}
                                                  key={item.id}
                                                  onClick={() =>
                                                      onFieldClick(item)
                                                  }
                                                  onDoubleClick={() => {
                                                      if (
                                                          optionType ===
                                                              'view' ||
                                                          isCustomOrLogic
                                                      ) {
                                                          return
                                                      }
                                                      setSearchEditValue(
                                                          item.business_name,
                                                      )
                                                      fieldEdit(item.id, true)
                                                  }}
                                              >
                                                  <div
                                                      className={
                                                          styles.tableItem
                                                      }
                                                  >
                                                      <span
                                                          className={
                                                              styles.iconBox
                                                          }
                                                      >
                                                          {getFieldTypeEelment(
                                                              {
                                                                  ...item,
                                                                  type: item.data_type,
                                                              },
                                                              20,
                                                              'left',
                                                              ![
                                                                  LogicViewType.Custom,
                                                                  LogicViewType.LogicEntity,
                                                              ].includes(
                                                                  logicViewType ||
                                                                      '',
                                                              ),
                                                          )}
                                                      </span>
                                                      <div
                                                          className={
                                                              styles.nameBox
                                                          }
                                                      >
                                                          <div
                                                              className={
                                                                  styles.name
                                                              }
                                                          >
                                                              {item.isEdit ? (
                                                                  <SearchInput
                                                                      className={classnames(
                                                                          item.tips &&
                                                                              styles.errInput,
                                                                      )}
                                                                      showIcon={
                                                                          false
                                                                      }
                                                                      value={
                                                                          searchEditValue
                                                                      }
                                                                      onBlur={() => {
                                                                          fieldEdit(
                                                                              item.id,
                                                                              false,
                                                                              searchEditValue,
                                                                          )
                                                                      }}
                                                                      maxLength={
                                                                          255
                                                                      }
                                                                      placeholder={__(
                                                                          '请填写业务字段名称',
                                                                      )}
                                                                      onChange={(
                                                                          e,
                                                                      ) => {
                                                                          const value =
                                                                              e.target.value.trim()
                                                                          setSearchEditValue(
                                                                              value,
                                                                          )
                                                                          fieldEdit(
                                                                              item.id,
                                                                              true,
                                                                              value,
                                                                          )
                                                                      }}
                                                                      autoFocus
                                                                      allowClear={
                                                                          false
                                                                      }
                                                                      suffix={
                                                                          item.tips && (
                                                                              <ErrorTips
                                                                                  title={
                                                                                      item.tips
                                                                                  }
                                                                              />
                                                                          )
                                                                      }
                                                                  />
                                                              ) : (
                                                                  <span
                                                                      title={`${__(
                                                                          '业务名称',
                                                                      )}：${
                                                                          item.business_name
                                                                      }`}
                                                                      className={
                                                                          styles.nameTextBox
                                                                      }
                                                                  >
                                                                      <span
                                                                          className={
                                                                              styles.nameText
                                                                          }
                                                                          dangerouslySetInnerHTML={{
                                                                              __html: highLight(
                                                                                  item.business_name,
                                                                                  searchKey,
                                                                                  'datasheetHighLight',
                                                                              ),
                                                                          }}
                                                                      />
                                                                      {item.tips &&
                                                                          optionType ===
                                                                              'edit' && (
                                                                              <ErrorTips
                                                                                  title={
                                                                                      item.tips
                                                                                  }
                                                                              />
                                                                          )}
                                                                  </span>
                                                              )}
                                                          </div>
                                                          <div
                                                              className={
                                                                  styles.code
                                                              }
                                                          >
                                                              <span
                                                                  className={
                                                                      styles.codeText
                                                                  }
                                                                  title={`${__(
                                                                      '技术名称',
                                                                  )}：${
                                                                      item.technical_name
                                                                  }`}
                                                                  dangerouslySetInnerHTML={{
                                                                      __html: highLight(
                                                                          item.technical_name,
                                                                          searchKey,
                                                                          'datasheetHighLight',
                                                                      ),
                                                                  }}
                                                              />
                                                          </div>
                                                      </div>
                                                      <div
                                                          className={
                                                              styles.itemTagBox
                                                          }
                                                      >
                                                          {item.classfity_type &&
                                                          item.attribute_id ? (
                                                              <Tooltip
                                                                  title={
                                                                      <div>
                                                                          {__(
                                                                              '分类属性：',
                                                                          )}
                                                                          {
                                                                              item.attribute_path
                                                                          }
                                                                          {item.classfity_type ===
                                                                              ClassifyType.Auto &&
                                                                              (isTrueRole ||
                                                                                  hasSafeAdmin) && (
                                                                                  <div
                                                                                      className={
                                                                                          styles.autoClassifyTag
                                                                                      }
                                                                                  >
                                                                                      {__(
                                                                                          '探查分类',
                                                                                      )}
                                                                                  </div>
                                                                              )}
                                                                      </div>
                                                                  }
                                                                  color="#fff"
                                                                  overlayInnerStyle={{
                                                                      color: '#000',
                                                                  }}
                                                              >
                                                                  <Badge
                                                                      dot={
                                                                          item.classfity_type ===
                                                                              ClassifyType.Auto &&
                                                                          isTrueRole
                                                                      }
                                                                      color="#1890FF"
                                                                      offset={[
                                                                          -16,
                                                                          16,
                                                                      ]}
                                                                  >
                                                                      <FontIcon
                                                                          name="icon-shuxing"
                                                                          className={
                                                                              styles.attrIcon
                                                                          }
                                                                      />
                                                                  </Badge>
                                                              </Tooltip>
                                                          ) : null}

                                                          {item.label_name &&
                                                          isStart ? (
                                                              <Tooltip
                                                                  title={
                                                                      <div>
                                                                          {`${__(
                                                                              '数据分级：',
                                                                          )}${
                                                                              item.label_name
                                                                          }`}
                                                                          {item.grade_type ===
                                                                              GradeType.Auto &&
                                                                              (isTrueRole ||
                                                                                  hasSafeAdmin) && (
                                                                                  <div
                                                                                      className={
                                                                                          styles.autoClassifyTag
                                                                                      }
                                                                                  >
                                                                                      {__(
                                                                                          '探查分级',
                                                                                      )}
                                                                                  </div>
                                                                              )}
                                                                      </div>
                                                                  }
                                                                  color="#fff"
                                                                  overlayInnerStyle={{
                                                                      color: '#000',
                                                                  }}
                                                              >
                                                                  <Badge
                                                                      dot={
                                                                          item.grade_type ===
                                                                              GradeType.Auto &&
                                                                          (isTrueRole ||
                                                                              hasSafeAdmin)
                                                                      }
                                                                      color="#1890FF"
                                                                      offset={[
                                                                          -16,
                                                                          16,
                                                                      ]}
                                                                  >
                                                                      <FontIcon
                                                                          name="icon-biaoqianicon"
                                                                          className={
                                                                              styles.tagIcon
                                                                          }
                                                                          style={{
                                                                              color: item.label_icon,
                                                                          }}
                                                                      />
                                                                  </Badge>
                                                              </Tooltip>
                                                          ) : null}

                                                          {item.business_timestamp && (
                                                              <div
                                                                  className={
                                                                      styles.isTimes
                                                                  }
                                                              >
                                                                  <Tooltip
                                                                      title={__(
                                                                          '已设置为业务数据更新时间戳',
                                                                      )}
                                                                      color="#fff"
                                                                      overlayInnerStyle={{
                                                                          color: '#000',
                                                                      }}
                                                                  >
                                                                      <ClockCircleFilled />
                                                                  </Tooltip>
                                                              </div>
                                                          )}
                                                          {(item.status ===
                                                              stateType.delete ||
                                                              item.status ===
                                                                  stateType.new ||
                                                              item.status ===
                                                                  stateType.modify) &&
                                                              optionType ===
                                                                  'edit' && (
                                                                  <Tooltip
                                                                      title={
                                                                          item.status ===
                                                                          stateType.delete
                                                                              ? __(
                                                                                    '源数据表删除了此字段',
                                                                                )
                                                                              : item.status ===
                                                                                stateType.modify
                                                                              ? __(
                                                                                    '源数据表更改了此字段',
                                                                                )
                                                                              : __(
                                                                                    '源数据表新增字段',
                                                                                )
                                                                      }
                                                                      placement="right"
                                                                      color="#fff"
                                                                      overlayInnerStyle={{
                                                                          color: '#000',
                                                                      }}
                                                                  >
                                                                      <span
                                                                          className={
                                                                              styles.del
                                                                          }
                                                                      >
                                                                          {getStateTag(
                                                                              item.status ===
                                                                                  stateType.delete
                                                                                  ? 'del'
                                                                                  : item.status ===
                                                                                    stateType.modify
                                                                                  ? stateType.modify
                                                                                  : stateType.new,
                                                                          )}
                                                                      </span>
                                                                  </Tooltip>
                                                              )}
                                                          {item.primary_key && (
                                                              <div
                                                                  className={
                                                                      styles.tag
                                                                  }
                                                              >
                                                                  {getStateTag(
                                                                      'key',
                                                                  )}
                                                              </div>
                                                          )}
                                                      </div>
                                                  </div>
                                              </div>
                                          )
                                      })}
                            {openFieldDetail && manualOpenFieldDetail && (
                                <FieldDetail
                                    ref={fieldDetailRef}
                                    open={openFieldDetail}
                                    onClose={() => {
                                        setOpenFieldDetail(false)
                                        setManualOpenFieldDetail(false)
                                    }}
                                    fieldData={currentData}
                                    loading={exampleLoading}
                                    optionType={optionType}
                                    onFieldDataChange={(curData) =>
                                        onFieldDataChange(curData)
                                    }
                                    businessTimestampField={
                                        businessTimestampField
                                    }
                                    upDateDetails={upDateDetails}
                                    fieldList={fieldList}
                                    isDataView
                                    dataSheetId={dataSheetId}
                                    isCustomOrLogic={isCustomOrLogic}
                                    setFieldList={setFieldList}
                                    isStart={isStart}
                                    module={logicViewType}
                                    detailGetContainer={detailGetContainer}
                                    dataSheetName={dataviewInfo?.business_name}
                                />
                            )}
                        </div>
                        <div className={styles.tabelPage}>
                            <LeftOutlined
                                onClick={() => {
                                    if (offset > 1) {
                                        setOffset(offset - 1)
                                    }
                                }}
                                className={classnames(
                                    styles.pageIcon,
                                    offset === 1 && styles.disable,
                                )}
                            />
                            <span className={styles.page}>
                                {offset}/{Math.ceil(total / limit)}
                            </span>
                            <RightOutlined
                                onClick={() => {
                                    if (offset < Math.ceil(total / limit)) {
                                        setOffset(offset + 1)
                                    }
                                }}
                                className={classnames(
                                    styles.pageIcon,
                                    offset === Math.ceil(total / limit) &&
                                        styles.disable,
                                )}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.excelEmpty}>
                    <Empty
                        iconSrc={dataEmpty}
                        desc={__(
                            '请先在右侧选取库表的数据范围，再在表格中补全字段属性信息',
                        )}
                    />
                </div>
            )}
        </div>
    )
})

export default FieldsTable
