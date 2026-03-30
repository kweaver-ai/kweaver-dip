import * as React from 'react'
import {
    useState,
    FC,
    useEffect,
    forwardRef,
    useImperativeHandle,
    useRef,
} from 'react'
import { Spin, Table, Tooltip } from 'antd'
import {
    CheckCircleFilled,
    DownOutlined,
    ExclamationCircleFilled,
    UpOutlined,
} from '@ant-design/icons'
import { useAntdTable, useGetState, useSize } from 'ahooks'
import { trim } from 'lodash'
import __ from '../locale'
import Editor from '@/ui/Editor'
import styles from '../styles.module.less'
import Empty from '@/ui/Empty'
import empty from '../../../assets/dataEmpty.svg'
import { OperationRunlined } from '@/icons'
import { ExecError } from '../const'
import { TaskExecutableStatus, execProcessSql } from '@/core'
import { splitDataType } from '../helper'
import DataTypeIcons from '@/components/DataSynchronization/Icons'
import DragVeticalBox from '@/components/DragVeticalBox'

interface EditorModalType {
    ref?: any
    dataForms: Array<any>
    insertSql: string
    onChangeSql: (sqlValue: string) => void
    originResultData: any
    taskStatus: TaskExecutableStatus
    setTabsErrorStatus: (boolean) => void
}
const EditorModal: FC<EditorModalType> = forwardRef((props: any, ref) => {
    const {
        dataForms,
        insertSql,
        onChangeSql,
        originResultData,
        taskStatus,
        setTabsErrorStatus,
    } = props
    const [resultExpand, setResultExpand] = useState<boolean>(false)
    const [sqlScript, setSqlScript] = useState<string>('')
    const [errorStatus, setErrorStatus, getErrorStatus] = useGetState<any>(null)
    const [resultData, setResultData] = useState<Array<any>>([])
    const [sourceKeyword, setSourceKeyword] = useState<Array<any>>([])
    const [dataColumns, setDataColumns] = useState<Array<any>>([])
    const [resultCount, setResultCount] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const editRef = useRef<HTMLDivElement>(null)
    const listSize = useSize(editRef)

    // 分割大小
    const [defaultSize, setDefaultSize, getDefaultSize] = useGetState<
        Array<number>
    >([99, 1])

    const initTableData = async () => {
        return Promise.resolve({
            total: 0,
            list: [],
        })
    }
    useEffect(() => {
        setSqlScript(insertSql)
    }, [insertSql])

    useEffect(() => {
        setSourceKeyword([
            {
                detail: 'Table',
                keywords: dataForms.map(
                    (currentData) =>
                        `${currentData.catalog_name}.${currentData.schema}.${currentData.table_name}`,
                ),
            },
            {
                detail: 'Column',
                keywords: dataForms.reduce(
                    (preData, currentData) => [
                        ...preData,
                        ...currentData.fields,
                    ],
                    [],
                ),
            },
        ])
    }, [dataForms])

    useEffect(() => {
        if (originResultData) {
            if (originResultData?.defaultSize) {
                const close =
                    ((window.innerHeight - 126) *
                        originResultData.defaultSize[1]) /
                        100 <
                    40

                setResultExpand(!close)
                if (close) {
                    setDefaultSize([99, 1])
                } else {
                    setDefaultSize(originResultData.defaultSize)
                }
            }
            if (originResultData.errorStatus) {
                setErrorStatus(originResultData.errorStatus)
            } else {
                run({
                    ...pagination,
                    current: 1,
                    dataResult: originResultData.dataResult,
                })
            }
        }
    }, [originResultData])

    const exeSqlInfo = async (args) => {
        if (args.dataResult) {
            const { dataSource, columns, ...rest } = args.dataResult
            if (rest.resultCount) {
                setResultCount(rest.resultCount)
                return {
                    total: 0,
                    list: [],
                }
            }
            setDataColumns(columns)
            return {
                total: dataSource?.length || 0,
                list: dataSource || [],
            }
        }
        try {
            setLoading(true)
            setErrorStatus(null)
            setResultData([])
            const res = await execProcessSql({
                db_type: 'hive',
                sql_str: sqlScript,
            })
            const resultResData = JSON.parse(res.data)
            setLoading(false)
            if (resultResData[0]) {
                const { count, result } = resultResData[0]
                if (result) {
                    setResultCount(`${count}`)
                }
                if (!resultExpand) {
                    setResultExpand(true)
                    setDefaultSize([60, 40])
                }
                return {
                    total: 0,
                    list: [],
                }
            }
            const { total_count, data, columns, count, result } = resultResData
            const before20Data = data?.slice(0, 19) || []
            setResultExpand(true)
            setDefaultSize([60, 40])
            setTabsErrorStatus(false)
            if (total_count && columns) {
                setResultData(before20Data)
                setDataColumns(
                    columns?.map((item) => {
                        const { newType } = splitDataType(item.type)
                        return {
                            title: (
                                <div
                                    title={item.name}
                                    style={{ display: 'flex' }}
                                >
                                    <DataTypeIcons type={newType} />
                                    <span style={{ marginLeft: '8px' }}>
                                        {item.name}
                                    </span>
                                </div>
                            ),
                            dataIndex: item.name,
                            key: item.name,
                            ellipsis: true,
                            render: (value) => {
                                return (
                                    <div className={styles.tableTDContnet}>
                                        {value}
                                    </div>
                                )
                            },
                        }
                    }),
                )
                return {
                    total: total_count || 0,
                    list: before20Data.map((currentData) =>
                        currentData.reduce((preData, columnsData, index) => {
                            return {
                                ...preData,
                                [columns[index].name]: columnsData,
                            }
                        }, {}),
                    ),
                }
            }
            setTabsErrorStatus(false)
            return {
                total: 0,
                list: [],
            }
        } catch (ex) {
            setLoading(false)
            setErrorStatus(ex)
            setTabsErrorStatus(true)
            setResultExpand(true)
            setDefaultSize([60, 40])
            return Promise.reject(ex)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(exeSqlInfo, {
        defaultPageSize: 20,
        manual: true,
    })

    useImperativeHandle(ref, () => ({
        getResultData: () => {
            return {
                errorStatus: getErrorStatus() || null,
                defaultSize: getDefaultSize(),
                dataResult: {
                    dataSource: tableProps.dataSource,
                    columns: dataColumns,
                    resultCount,
                },
            }
        },
    }))

    const getResultComponent = () => {
        if (loading) {
            return (
                <div className={styles.errorBox}>
                    <Spin />
                </div>
            )
        }
        if (errorStatus) {
            return (
                <div className={styles.errorBox}>
                    <div className={styles.icon}>
                        <ExclamationCircleFilled />
                    </div>
                    <div className={styles.textTip}>
                        <div className={styles.text}>{__('运行失败')}</div>
                        <div>
                            {sqlScript
                                ? __('SQL存在错误，请修改代码')
                                : __('SQL语句不能为空， 请输入')}
                        </div>
                    </div>
                    {sqlScript && (
                        <div className={styles.detail}>
                            {(errorStatus?.data?.detail[0] &&
                                errorStatus?.data?.detail[0].Message) ||
                                errorStatus?.data?.description ||
                                ''}
                        </div>
                    )}
                </div>
            )
        }
        if (!trim(sqlScript)) {
            return (
                <div>
                    <Empty
                        iconSrc={empty}
                        desc={
                            <div className={styles.emptyData}>
                                <div className={styles.text}>
                                    {__('暂无数据')}
                                </div>
                                <div>
                                    <span>{__('可点击')}</span>
                                    <span
                                        className={styles.execBtn}
                                        onClick={() => {
                                            if (!trim(sqlScript)) {
                                                setErrorStatus({
                                                    type: ExecError.EMPTY,
                                                })
                                                setResultExpand(true)
                                                setDefaultSize([60, 40])
                                                setTabsErrorStatus(true)
                                            } else {
                                                run({
                                                    ...pagination,
                                                    current: 1,
                                                })
                                            }
                                        }}
                                    >
                                        {__('【执行】')}
                                    </span>
                                    <span>{__('按钮查看运行结果')}</span>
                                </div>
                            </div>
                        }
                    />
                </div>
            )
        }
        if (resultData?.length) {
            return (
                <div style={{ height: '100%', width: '100%', padding: '16px' }}>
                    {tableProps?.dataSource?.length && (
                        <Table
                            columns={dataColumns}
                            pagination={false}
                            dataSource={tableProps.dataSource}
                            rowKey={(record) => record.index}
                            bordered={false}
                            scroll={{
                                y: 280,
                                x: dataColumns.length * 200,
                            }}
                        />
                    )}
                </div>
            )
        }

        if (resultCount) {
            return (
                <div className={styles.errorBox}>
                    <div className={styles.icon}>
                        <CheckCircleFilled style={{ color: '#52C41A' }} />
                    </div>
                    <div className={styles.textTip}>
                        <div className={styles.text}>{__('插入数据成功')}</div>
                        <div>
                            {__('成功插入${number}条数据', {
                                number: resultCount,
                            })}
                        </div>
                    </div>
                </div>
            )
        }
        return (
            <div>
                <Empty
                    iconSrc={empty}
                    desc={
                        <div className={styles.emptyData}>
                            <div className={styles.text}>{__('暂无数据')}</div>
                        </div>
                    }
                />
            </div>
        )
    }

    return (
        <div className={styles.editorContainer}>
            <div className={styles.titleBar}>
                <div className={styles.leftBtn}>
                    <div
                        className={styles.btn}
                        onClick={() => {
                            if (!trim(sqlScript)) {
                                setErrorStatus({
                                    type: ExecError.EMPTY,
                                })
                                setResultExpand(true)
                                setDefaultSize([60, 40])
                                setTabsErrorStatus(true)
                            } else {
                                run({ ...pagination, current: 1 })
                            }
                        }}
                    >
                        <OperationRunlined style={{ marginRight: '4px' }} />
                        {__('测试')}
                    </div>
                </div>
            </div>

            <div className={styles.editorWrap}>
                <DragVeticalBox
                    defaultSize={defaultSize}
                    minSize={32}
                    onDragEnd={(rate) => {
                        const close =
                            ((window.innerHeight - 126) * rate[1]) / 100 < 40

                        setResultExpand(!close)
                        if (close) {
                            setDefaultSize([99, 1])
                        } else {
                            setDefaultSize(rate)
                        }
                    }}
                    collapsed={resultExpand ? undefined : 1}
                    gutterSize={8}
                >
                    <div className={styles.editorExpand} ref={editRef}>
                        <Editor
                            initSource={sourceKeyword}
                            value={sqlScript}
                            onChange={(value) => {
                                setSqlScript(value)
                                onChangeSql(value)
                            }}
                            readOnly={
                                taskStatus === TaskExecutableStatus.COMPLETED
                            }
                            height={
                                listSize?.height
                                    ? listSize.height - 22
                                    : 'calc(100% - 22px)'
                            }
                        />
                    </div>
                    {resultExpand ? (
                        <div className={styles.resultExpand}>
                            <div className={styles.titleBar}>
                                <div>{__('执行结果')}</div>
                                <div>
                                    <Tooltip placement="top" title={__('收起')}>
                                        <DownOutlined
                                            onClick={(e) => {
                                                setResultExpand(false)
                                                setDefaultSize([99, 1])
                                            }}
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                            <div className={styles.content}>
                                {getResultComponent()}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.resultUnExpand}>
                            <div>{__('执行结果')}</div>
                            <div>
                                <Tooltip placement="top" title={__('展开')}>
                                    <UpOutlined
                                        onClick={(e) => {
                                            setResultExpand(true)
                                            setDefaultSize([60, 40])
                                        }}
                                    />
                                </Tooltip>
                            </div>
                        </div>
                    )}
                </DragVeticalBox>
            </div>
        </div>
    )
})
export default EditorModal
