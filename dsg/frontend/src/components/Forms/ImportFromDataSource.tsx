import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Modal, Space, Spin, Tooltip } from 'antd'
import {
    CheckCircleFilled,
    CaretDownOutlined,
    ExclamationCircleOutlined,
    LeftOutlined,
    RightOutlined,
    CaretRightOutlined,
} from '@ant-design/icons'
import { useLocalStorageState } from 'ahooks'
import { cloneDeep } from 'lodash'
import styles from './styles.module.less'
import DataSource from './DataSource'
import { ClearOutlined } from '@/icons'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import emptyFolder from '@/assets/emptySmall.svg'
import CreateForm from './CreateForm'
import {
    formatError,
    TaskType,
    getDataFormFields,
    getFormsFromDatasource,
    importDatasourceMultiple,
    importDatasourceSingle,
    IImportBussinessFormInfo,
    ICoreBusinessDetails,
    flowCellBindFormModel,
} from '@/core'
import { ImportMode, NewFormType } from './const'
import Loader from '@/ui/Loader'
import __ from './locale'
import { SearchInput } from '@/ui'
import { getSource } from '@/utils'
import DataTypeIcons from '../DataSynchronization/Icons'
import ChooseInfoSystems from './ChooseInfoSystems'
import { DrawioInfoContext } from '@/context/DrawioProvider'
import FlowchartInfoManager from '../DrawioMgt/helper'
import { databaseTypesEleData } from '@/core/dataSource'

interface DatasourceTable {
    datasource_id: string
    table: string
}

interface DatasourceTables {
    datasource_id: string
    tables: string[]
}

interface IImportFromDataSource {
    open: boolean
    onClose: () => void
    mid: string
    onUpdate: () => void
    taskId?: string
    taskType?: TaskType
    isDrawio?: boolean
    flowchartId?: string
    jumpUrl?: string
    node_id?: string
    pMbid: string
    jumpWithWindow?: boolean
}
const ImportFromDataSource: React.FC<IImportFromDataSource> = ({
    open,
    onClose,
    mid,
    onUpdate,
    taskId,
    taskType,
    isDrawio,
    flowchartId,
    jumpUrl,
    node_id,
    pMbid,
    jumpWithWindow = false,
}) => {
    // 流程图相关信息
    const { drawioInfo } = useContext(DrawioInfoContext)
    // 选中数据源的id
    const [selectedSourceId, setSelectedSourceId] = useState('')
    // '1' : [1,2,3] 保存数据源与选中的数据表关系
    const [selectedTablesKeys, setSelectedTablesKeys] = useState({})
    // 选中数据源下的数据表(带搜索后的数据)
    const [currentTables, setCurrentTables] = useState<any[]>([])
    // 选中数据源下的全量数据表(不带搜索后的数据)
    const [currentAllTables, setCurrentAllTables] = useState<any[]>([])

    const [searchValue, setSearchValue] = useState('')

    const [importSuccessOpen, setImportSuccessOpen] = useState(false)

    const [completeFormOpen, setCompleteFormOpen] = useState(false)

    // 单表导入成功后返回的业务表信息
    const [formInfo, setFormInfo] = useState<IImportBussinessFormInfo>()

    const [successForms, setSuccessForms] = useState<string[]>([])
    const [failForms, setFailForms] = useState<string[]>([])

    const [loading, setLoading] = useState(false)

    const [selectedSourceType, setSelectedSourceType] = useState('')

    const [importMode, setImportMode] = useState(ImportMode.SINGLE)

    const [spinning, setSpinning] = useState(false)

    const [chooseInfoSysOpen, setChooseInfoSysOpen] = useState(false)
    const [hasInfoSys, setHasInfoSys] = useState(false)
    // 业务模型的详情---可获取是否关联信息系统
    const [cbDetails, setCbDetails] = useState<ICoreBusinessDetails>()
    const [afFlowchartInfo, setAfFlowchartInfo] = useLocalStorageState<any>(
        `${flowchartId}`,
    )

    // 获取最新数据
    const getLatestData = () => {
        const tempStr = window.localStorage.getItem(`${flowchartId}`)
        if (tempStr !== null) {
            const temp = JSON.parse(tempStr || '')
            setAfFlowchartInfo(temp)
            return new FlowchartInfoManager(
                temp?.flowchartData?.infos || [],
                temp?.flowchartData?.current,
            )
        }
        return undefined
    }

    // 全选的中间状态
    const indeterminate = useMemo(() => {
        // 展示在页面中的数据的选中数量 与 展示页面中的全部数量 比较 二者之间为中间状态
        const selectedCountInCurrentTables = currentTables.reduce(
            (count, item) => {
                return selectedTablesKeys[selectedSourceId]?.find(
                    (key) => key === item.table_name,
                )
                    ? count + 1
                    : count
            },
            0,
        )

        return (
            selectedCountInCurrentTables > 0 &&
            selectedCountInCurrentTables < currentTables.length
        )
    }, [selectedSourceId, currentTables, selectedTablesKeys])

    useEffect(() => {
        if (!open) {
            setCurrentAllTables([])
            setCurrentTables([])
            setSelectedTablesKeys({})
            setSearchValue('')
        }
    }, [open])

    // 是否全选 ：选中的个数  === 当前全部数据表的个数
    const checkedAll = useMemo(() => {
        return currentTables.every((ct) =>
            selectedTablesKeys[selectedSourceId]?.includes(ct.table_name),
        )
        // return (
        //     selectedTablesKeys[selectedSourceId]?.length ===
        //     currentTables.length
        // )
    }, [selectedTablesKeys, currentTables, selectedSourceId])

    // 全部选中数据表的长度
    const selectedKeys = useMemo(() => {
        let keys: string[] = []
        Object.keys(selectedTablesKeys).forEach((key) => {
            keys = [...selectedTablesKeys[key], ...keys]
        })
        return keys
    }, [selectedTablesKeys])

    useEffect(() => {
        setCurrentTables(
            currentAllTables.filter((table) =>
                table.table_name
                    .toLocaleLowerCase()
                    .includes(searchValue.toLocaleLowerCase()),
            ),
        )
    }, [searchValue])

    const getSelectedSource = (sid: string) => {
        setSelectedSourceId(sid)
    }

    const getSelectedSourceType = (type: string) => {
        setSelectedSourceType(type)
    }

    // 获取数据源下的数据表
    const getForms = async () => {
        if (!selectedSourceId) return
        try {
            setLoading(true)
            const tables = await getFormsFromDatasource(selectedSourceId)
            setCurrentTables(
                tables.map((t) => ({
                    table_name: t,
                    isExpand: false,
                })),
            )
            setCurrentAllTables(
                tables.map((t) => ({
                    table_name: t,
                    isExpand: false,
                })),
            )
        } catch (error) {
            if (error.data.code === 'ERR_CANCELED') return
            formatError(error)
            setCurrentTables([])
            setCurrentAllTables([])
        } finally {
            setLoading(false)
        }
    }

    // 选择的数据源变化时 查询下面的数据表
    useEffect(() => {
        const sor = getSource()
        if (sor.length > 0) {
            sor.forEach((info) => {
                if (info.config?.url?.includes('/forms/data-tables')) {
                    info.source.cancel()
                }
            })
        }
        getForms()
        setSearchValue('')
    }, [selectedSourceId])

    // 点击全选
    const handleCheckedAll = (e) => {
        if (e.target.checked) {
            setSelectedTablesKeys({
                ...selectedTablesKeys,
                // 之前已选的 与 现在全选的数据 之和  后再去重
                [selectedSourceId]: [
                    ...(selectedTablesKeys[selectedSourceId] || []),
                    ...currentTables.map((table) => {
                        return table.table_name
                    }),
                ].reduce((unique, item) => {
                    return unique.includes(item) ? unique : [...unique, item]
                }, []),
            })
        } else {
            setSelectedTablesKeys({
                ...selectedTablesKeys,
                // 在所有已选的数据中 过滤掉当前全数据的 （搜索状态下的数据 可能 小于当前的全量数据）
                [selectedSourceId]: selectedTablesKeys[selectedSourceId].filter(
                    (sId) => {
                        if (
                            !currentTables.find((ct) => ct.table_name === sId)
                        ) {
                            return true
                        }
                        return false
                    },
                ),
            })
        }
    }

    // 点击某个表
    const handleCheckItem = (e, key: string) => {
        if (e.target.checked) {
            setSelectedTablesKeys({
                ...selectedTablesKeys,
                [selectedSourceId]: [
                    ...(selectedTablesKeys[selectedSourceId] || []),
                    key,
                ],
            })
        } else {
            setSelectedTablesKeys({
                ...selectedTablesKeys,
                [selectedSourceId]: (
                    selectedTablesKeys[selectedSourceId] || []
                ).filter((item) => item !== key),
            })
        }
    }

    // 清空选中项
    const clearSelectedForms = () => {
        setSelectedTablesKeys({})
    }

    // 获取数据表的字段列表
    const getFormFields = async (tName: string, tIndex: number) => {
        const res = await getDataFormFields(tName, selectedSourceId)
        const tempTables = cloneDeep(currentTables)
        tempTables[tIndex].isExpand = !tempTables[tIndex].isExpand
        tempTables[tIndex].fields = res
        tempTables[tIndex].offset = 0
        setCurrentTables(tempTables)
    }

    const handleFoldTableFields = (tIndex: number, tName: string) => {
        if (
            !currentTables[tIndex].isExpand &&
            !(currentTables[tIndex].fields?.length > 0)
        ) {
            // 获取数据表的字段
            getFormFields(tName, tIndex)
        } else {
            const tempTables = cloneDeep(currentTables)
            tempTables[tIndex].isExpand = !tempTables[tIndex].isExpand
            setCurrentTables(tempTables)
        }
    }

    const handleClick = async () => {
        if (spinning) return
        setSpinning(true)
        // 单个导入
        if (selectedKeys.length === 1) {
            const data: DatasourceTable = { datasource_id: '', table: '' }
            Object.keys(selectedTablesKeys).forEach((key) => {
                if (selectedTablesKeys[key]?.length === 1) {
                    data.datasource_id = key
                    const [tName] = selectedTablesKeys[key]
                    data.table = tName
                }
            })
            try {
                const res = await importDatasourceSingle(mid, {
                    ...data,
                    task_id: taskId || '',
                })
                setFormInfo(res)
                onClose()
                setImportSuccessOpen(true)
                setImportMode(ImportMode.SINGLE)
                if (isDrawio) {
                    addFlowCellBindForm([res?.id])
                }
            } catch (error) {
                formatError(error)
            } finally {
                setSpinning(false)
            }
        }
        if (selectedKeys.length > 1) {
            const data: DatasourceTables[] = []
            Object.keys(selectedTablesKeys).forEach((key) => {
                if (selectedTablesKeys[key]?.length > 0) {
                    data.push({
                        datasource_id: key,
                        tables: selectedTablesKeys[key],
                    })
                }
            })
            try {
                const res = await importDatasourceMultiple(mid, {
                    data,
                    task_id: taskId || '',
                })
                setSuccessForms(res.success)
                setFailForms(res.fail)
                onClose()
                setImportSuccessOpen(true)
                setImportMode(ImportMode.MULTIPLE)
                if (isDrawio) {
                    addFlowCellBindForm(res?.success_ids)
                }
            } catch (error) {
                formatError(error)
            } finally {
                setSpinning(false)
            }
        }
    }

    const addFlowCellBindForm = async (formIDs: string[] = ['']) => {
        try {
            const fm = await getLatestData()
            await flowCellBindFormModel(
                drawioInfo?.cellInfos?.id,
                formIDs,
                'form',
                fm?.current?.mid,
                fm?.current?.fid,
            )
        } catch (e) {
            formatError(e)
        }
    }

    // 立即完善
    const completeNow = () => {
        setImportSuccessOpen(false)
        setCompleteFormOpen(true)
    }

    // 表字段分页信息
    const getPage = (ct) => {
        return `${ct.offset + 1}/${Math.ceil(ct.fields.length / 10)}`
    }

    // 获取表下的字段（带分页）
    const getTableFields = (ct) => {
        if (!Array.isArray(ct.fields)) return []
        const totalPages = Math.ceil(ct.fields.length / 10)
        if (ct.offset === totalPages - 1) {
            return ct.fields?.slice(ct.offset * 10)
        }

        // 从下标10 截取到 下标 10+10
        return ct.fields?.slice(ct.offset * 10, ct.offset * 10 + 10)
    }

    // 字段上一页
    const handleLastPage = (tIndex) => {
        const tempData = cloneDeep(currentTables)
        if (tempData[tIndex].offset === 0) return
        tempData[tIndex].offset -= 1
        setCurrentTables(tempData)
    }

    // 字段下一页
    const handleNextPage = (tIndex) => {
        const tempData = cloneDeep(currentTables)
        if (
            tempData[tIndex].offset + 1 ===
            Math.ceil(tempData[tIndex].fields.length / 10)
        )
            return
        tempData[tIndex].offset += 1
        setCurrentTables(tempData)
    }

    // 系统中是否数据源
    const [isHasDataSource, setIsHasDataSource] = useState(true)

    const handleNoDataSource = () => {
        setIsHasDataSource(false)
    }

    return (
        <>
            <Modal
                title={__('从数据源导入业务表')}
                open={open}
                onCancel={onClose}
                width={800}
                className={styles.importDBModal}
                bodyStyle={{ padding: 0, height: 556 }}
                getContainer={false}
                destroyOnClose
                maskClosable={false}
                footer={
                    <div className={styles.importFromDSFooter}>
                        <div
                            className={styles.selectedCount}
                            style={
                                isHasDataSource
                                    ? undefined
                                    : { visibility: 'hidden' }
                            }
                        >
                            {__('已选：')}
                            {selectedKeys.length}
                            <Tooltip title={__('清空')}>
                                <ClearOutlined
                                    className={styles.clearIcon}
                                    onClick={clearSelectedForms}
                                />
                            </Tooltip>
                        </div>
                        <Space>
                            <Button onClick={onClose}>{__('取消')}</Button>
                            <Button
                                type="primary"
                                onClick={handleClick}
                                disabled={selectedKeys.length === 0}
                            >
                                {__('确定')}
                            </Button>
                        </Space>
                    </div>
                }
            >
                <Spin spinning={spinning} className={styles.spining}>
                    {isHasDataSource ? (
                        <div className={styles.importFromDBWrapper}>
                            <div className={styles.left}>
                                <div className={styles.title}>
                                    {__('数据源')}
                                </div>
                                <DataSource
                                    getSelectedSourceId={getSelectedSource}
                                    pMbid={pMbid}
                                    getSelectedSourceType={
                                        getSelectedSourceType
                                    }
                                    noDataCallBack={handleNoDataSource}
                                />
                            </div>
                            <div className={styles.right}>
                                {loading ? (
                                    <Loader />
                                ) : (
                                    <>
                                        <div className={styles.title}>
                                            {__('数据表')}
                                        </div>
                                        {currentTables.length === 0 &&
                                        !searchValue ? (
                                            <div className={styles.empty}>
                                                <Empty
                                                    desc={__('暂无数据')}
                                                    iconSrc={dataEmpty}
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <SearchInput
                                                    placeholder={__(
                                                        '搜索数据表名称',
                                                    )}
                                                    value={searchValue}
                                                    onKeyChange={(kw: string) =>
                                                        setSearchValue(kw)
                                                    }
                                                    className={
                                                        styles.searchInput
                                                    }
                                                />
                                                {searchValue &&
                                                    currentTables.length ===
                                                        0 && (
                                                        <div
                                                            className={
                                                                styles.empty
                                                            }
                                                        >
                                                            <Empty />
                                                        </div>
                                                    )}
                                                {currentTables.length > 0 && (
                                                    <>
                                                        <div
                                                            className={
                                                                styles.checkedAll
                                                            }
                                                        >
                                                            <Checkbox
                                                                checked={
                                                                    checkedAll
                                                                }
                                                                onChange={
                                                                    handleCheckedAll
                                                                }
                                                                indeterminate={
                                                                    indeterminate
                                                                }
                                                            />
                                                            <span
                                                                className={
                                                                    styles.checkAllText
                                                                }
                                                            >
                                                                {__('全选')}
                                                            </span>
                                                        </div>
                                                        <div
                                                            className={
                                                                styles.tableListWrapper
                                                            }
                                                        >
                                                            {currentTables.map(
                                                                (
                                                                    ct,
                                                                    tIndex,
                                                                ) => {
                                                                    const {
                                                                        Outlined,
                                                                    } =
                                                                        databaseTypesEleData
                                                                            ?.dataBaseIcons?.[
                                                                            selectedSourceType
                                                                        ] || {}
                                                                    const ICons =
                                                                        Outlined ? (
                                                                            <Outlined
                                                                                style={{
                                                                                    fontSize: 16,
                                                                                }}
                                                                            />
                                                                        ) : null
                                                                    return (
                                                                        <div
                                                                            key={
                                                                                ct.table_name
                                                                            }
                                                                            className={
                                                                                styles.tableItemContentWrapper
                                                                            }
                                                                        >
                                                                            <Checkbox
                                                                                className={
                                                                                    styles.checkBox
                                                                                }
                                                                                checked={(
                                                                                    selectedTablesKeys?.[
                                                                                        selectedSourceId
                                                                                    ] ||
                                                                                    []
                                                                                ).includes(
                                                                                    ct.table_name,
                                                                                )}
                                                                                onClick={(
                                                                                    e,
                                                                                ) =>
                                                                                    handleCheckItem(
                                                                                        e,
                                                                                        ct.table_name,
                                                                                    )
                                                                                }
                                                                            />
                                                                            <div
                                                                                className={
                                                                                    styles.tableItem
                                                                                }
                                                                            >
                                                                                <div
                                                                                    className={
                                                                                        styles.tableItemHeader
                                                                                    }
                                                                                >
                                                                                    {ct.isExpand ? (
                                                                                        <CaretDownOutlined
                                                                                            className={
                                                                                                styles.arrow
                                                                                            }
                                                                                            onClick={() =>
                                                                                                handleFoldTableFields(
                                                                                                    tIndex,
                                                                                                    ct.table_name,
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    ) : (
                                                                                        <CaretRightOutlined
                                                                                            className={
                                                                                                styles.arrow
                                                                                            }
                                                                                            onClick={() =>
                                                                                                handleFoldTableFields(
                                                                                                    tIndex,
                                                                                                    ct.table_name,
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    )}
                                                                                    <div
                                                                                        className={
                                                                                            styles.tableIcon
                                                                                        }
                                                                                    >
                                                                                        {
                                                                                            ICons
                                                                                        }
                                                                                    </div>
                                                                                    <div
                                                                                        className={
                                                                                            styles.tableName
                                                                                        }
                                                                                        title={
                                                                                            ct.table_name
                                                                                        }
                                                                                    >
                                                                                        {
                                                                                            ct.table_name
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                                <div
                                                                                    className={
                                                                                        styles.fieldsWrapper
                                                                                    }
                                                                                    hidden={
                                                                                        !ct.isExpand
                                                                                    }
                                                                                >
                                                                                    {getTableFields(
                                                                                        ct,
                                                                                    )?.map(
                                                                                        (
                                                                                            field,
                                                                                        ) => (
                                                                                            <div
                                                                                                key={
                                                                                                    field.name
                                                                                                }
                                                                                                className={
                                                                                                    styles.fieldItem
                                                                                                }
                                                                                            >
                                                                                                <div
                                                                                                    className={
                                                                                                        styles.fieldType
                                                                                                    }
                                                                                                    // style={{
                                                                                                    //     color: 'rgba(0,0,0,0.65)',
                                                                                                    // }}
                                                                                                >
                                                                                                    {/* 后端返回类型包括类型长度，前端截断处理 */}
                                                                                                    <DataTypeIcons
                                                                                                        type={
                                                                                                            field.origType?.split(
                                                                                                                '(',
                                                                                                            )[0]
                                                                                                        }
                                                                                                    />
                                                                                                </div>
                                                                                                <div
                                                                                                    className={
                                                                                                        styles.fieldName
                                                                                                    }
                                                                                                >
                                                                                                    {
                                                                                                        field.name
                                                                                                    }
                                                                                                </div>
                                                                                            </div>
                                                                                        ),
                                                                                    )}
                                                                                    {/* 大于10条数据展示分页 */}
                                                                                    {ct
                                                                                        .fields
                                                                                        ?.length >
                                                                                        10 && (
                                                                                        <div
                                                                                            className={
                                                                                                styles.pageInfo
                                                                                            }
                                                                                        >
                                                                                            <LeftOutlined
                                                                                                className={
                                                                                                    styles.arrowIcon
                                                                                                }
                                                                                                onClick={() =>
                                                                                                    handleLastPage(
                                                                                                        tIndex,
                                                                                                    )
                                                                                                }
                                                                                            />
                                                                                            <span
                                                                                                className={
                                                                                                    styles.pageContent
                                                                                                }
                                                                                            >
                                                                                                {getPage(
                                                                                                    ct,
                                                                                                )}
                                                                                            </span>
                                                                                            <RightOutlined
                                                                                                className={
                                                                                                    styles.arrowIcon
                                                                                                }
                                                                                                onClick={() =>
                                                                                                    handleNextPage(
                                                                                                        tIndex,
                                                                                                    )
                                                                                                }
                                                                                            />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                },
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <Empty
                            className={styles.noDataSource}
                            desc={
                                <>
                                    <div>{__('暂无数据源')}</div>
                                    <div>{__('无法从数据源导入业务表')}</div>
                                </>
                            }
                            iconSrc={emptyFolder}
                        />
                    )}
                </Spin>
            </Modal>
            <Modal
                open={importSuccessOpen}
                footer={null}
                closable={false}
                maskClosable={false}
                width={432}
                getContainer={false}
                bodyStyle={{ padding: 0 }}
            >
                <div className={styles.resultContainer}>
                    <CheckCircleFilled className={styles.successIcon} />
                    <span className={styles.successText}>
                        {__('导入成功')}&nbsp;
                        {importMode === ImportMode.MULTIPLE &&
                            __('${successFormsLen} 张表', {
                                successFormsLen: successForms.length,
                            })}
                    </span>
                    <div
                        className={styles.formName}
                        title={
                            importMode === ImportMode.MULTIPLE
                                ? `${successForms.join('、')}`
                                : formInfo?.name
                        }
                    >
                        {importMode === ImportMode.MULTIPLE
                            ? `${successForms.join('、')}`
                            : formInfo?.name}
                    </div>
                    {failForms.length > 0 && (
                        <div
                            className={styles.failTips}
                            title={`${failForms.join('、')}`}
                        >
                            <ExclamationCircleOutlined />
                            &nbsp;
                            {__('${failFormsLen} 张已存在的数据表未被导入：', {
                                failFormsLen: failForms.length,
                            })}
                            {`${failForms.join('、')}`}
                        </div>
                    )}
                    <div className={styles.tips}>
                        {importMode === ImportMode.SINGLE
                            ? __('您是否现在去完善业务表信息？')
                            : __('导入的业务表完善信息后才能正常使用')}
                    </div>
                    <div className={styles.resultbButton}>
                        {importMode === ImportMode.MULTIPLE ? (
                            <Button
                                type="primary"
                                className={styles.btn}
                                onClick={() => {
                                    setImportSuccessOpen(false)
                                    // 清空多表导入错误信息
                                    setFailForms([])
                                    onUpdate()
                                }}
                            >
                                {__('我知道了')}
                            </Button>
                        ) : (
                            <Space size={12}>
                                <Button
                                    className={styles.btn}
                                    onClick={() => {
                                        setImportSuccessOpen(false)
                                        onUpdate()
                                    }}
                                >
                                    {__('稍后完善')}
                                </Button>
                                <Button
                                    className={styles.btn}
                                    type="primary"
                                    onClick={completeNow}
                                >
                                    {__('立即完善')}
                                </Button>
                            </Space>
                        )}
                    </div>
                </div>
            </Modal>
            {/* 完善业务表 */}
            <CreateForm
                visible={completeFormOpen}
                onClose={() => {
                    setCompleteFormOpen(false)
                    onUpdate()
                }}
                mid={mid}
                onUpdate={onUpdate}
                taskId={taskId}
                taskType={taskType}
                formType={NewFormType.DSIMPORT}
                formInfo={formInfo}
                jumpUrl={jumpUrl}
                flowchart_id={flowchartId}
                node_id={node_id}
                jumpWithWindow={jumpWithWindow}
            />
            <ChooseInfoSystems
                open={chooseInfoSysOpen}
                onClose={(isClose) => {
                    setChooseInfoSysOpen(false)
                    // 关闭按钮需要调用，保存配置不调用
                    if (isClose) {
                        onClose()
                    }
                }}
                cbDetails={cbDetails}
                openImportFromDS={() => setHasInfoSys(true)}
                taskId={taskId || ''}
            />
        </>
    )
}

export default ImportFromDataSource
