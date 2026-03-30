/* eslint-disable no-useless-escape */
import {
    useState,
    FC,
    useEffect,
    forwardRef,
    useImperativeHandle,
    useRef,
    useMemo,
    useContext,
} from 'react'
import { Spin, Table, Tooltip, Tree, Checkbox } from 'antd'
import { Resizable } from 're-resizable'
import { Graph, Node } from '@antv/x6'
import {
    DownOutlined,
    ExclamationCircleFilled,
    InfoCircleOutlined,
} from '@ant-design/icons'
import { useAntdTable, useGetState, useSize } from 'ahooks'
import { filter, forEach, isString, trim, uniqBy } from 'lodash'
import classnames from 'classnames'
import {
    getExecSqlRequest,
    TaskExecutableStatus,
    execCustomViewSqlRequest,
    formatError,
} from '@/core'
import __ from '../locale'
import Editor from '../Editor'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import empty from '@/assets/dataEmpty.svg'
import { getPreorderNode, getRunViewParam } from '../helper'
import {
    splitDataType,
    findParentNode,
    handleRunSqlParam,
    getFormatSql,
    checkBeforeRun,
} from './helper'
import {
    TableSearchOutlined,
    OperationRunlined,
    FullScreenOutlined,
    CloseOutlined,
    ShouQiOutlined,
    FontIcon,
} from '@/icons'
import DataTypeIcons from '@/components/DataSynchronization/Icons'
import DragBox from '@/components/DragBox'
import Loader from '@/ui/Loader'
import {
    ListDefaultPageSize,
    ListPageSizerOptions,
    ListType,
    SearchInput,
} from '@/ui'
import {
    CustomViewContext,
    CHANGE_SQL_INFO,
    CHANGE_SQL_RESULT_FULL_SCREEN,
    CHANGE_SQL_TEXT,
} from '../CustomViewRedux'
import { FieldsData } from '../FieldsData'
import dragVertical from '@/icons/svg/colored/dragVertical.svg'
import { getPolicyFields } from '@/components/SceneAnalysis/UnitForm/helper'
import { cancelRequest } from '@/utils'

/** 默认无数据空库表 */
const DefaultEmpty = <Empty />

interface EditorModalType {
    ref?: any
    dataForms: Array<any>
    insertSql: string
    onChangeSql: (sqlValue: string) => void
    originResultData: any
    taskStatus: TaskExecutableStatus
    setTabsErrorStatus: (boolean) => void
    graph?: Graph
    node?: Node
    fieldsData: FieldsData
    onChangeExpand?: (closed: boolean) => void
    inViewMode?: boolean
}
const EditorModal: FC<EditorModalType> = forwardRef((props: any, ref) => {
    const {
        dataForms,
        insertSql,
        onChangeSql,
        originResultData,
        taskStatus,
        setTabsErrorStatus,
        graph,
        node,
        fieldsData,
        onChangeExpand,
        inViewMode = false,
    } = props
    const [resultExpand, setResultExpand] = useState<boolean>(false)
    const [sqlScript, setSqlScript] = useState<string>('')
    const [errorStatus, setErrorStatus, getErrorStatus] = useGetState<any>(null)
    const [resultData, setResultData] = useState<Array<any>>([])
    const [sourceKeyword, setSourceKeyword] = useState<Array<any>>([])
    const [execResult, setExecResult] = useState<any>()
    const [dataColumns, setDataColumns] = useState<Array<any>>([])
    const [resultCount, setResultCount] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const editRef = useRef<HTMLDivElement>(null)
    const resDataRef = useRef(null)
    const [flag, setFlag] = useState(true)
    const bodySize = useSize(document.body) || { width: 0, height: 0 }
    const [oldBodySize, setOldBodySize] = useState(bodySize)
    const editerSize = useSize(editRef) || { width: 0, height: 0 }

    // 分割大小
    const [defaultSize, setDefaultSize, getDefaultSize] = useGetState<
        Array<number>
    >([100, 0])

    // sql
    // 左右分割
    const [defaultHorizontalSize, setDefaultHorizontalSize] = useState<
        Array<number>
    >([12, 88])
    const [closeLeftSide, setCloseLeftSide] = useState(false)

    const reactCodeMirrorRef = useRef<any>(null)
    const editorWrapperRef = useRef<any>(null)

    const [isTreeLoading, setIsTreeLoading] = useState(false)
    const [treeData, setTreeData, getTreeData] = useGetState<any>([])
    const isEmpty = useMemo(() => !treeData.length, [treeData])
    const [selectedKeys, setSelectedKeys] = useState<any[]>()
    const [expandedKeys, setExpandedKeys] = useState<any[]>([])
    const [prevNodeMap, setPrevNodeMap] = useState<any>({})
    const [resHeight, setResHeight] = useState<any>(312)
    const [resInitalHeight, setResInitalHeight] = useState<any>(312)
    const [resMaxHeight, setResMaxHeight] = useState(700)
    // 执行分页
    const [runOffset, setRunOffset] = useState<number>(1)
    // 执行limit
    const [runPageSize, setRunPageSize] = useState<number>(10)
    // 执行结果总数
    const [runTotal, setRunTotal] = useState<number>()
    // sql语句中是否有分页
    const [sqlLimit, setSqlLimit] = useState(false)
    const onResizeStart = (e) => {}
    const onResize = (e) => {}

    // 是否搜索前序节点
    const [showPrevSearch, setShowPrevSearch] = useState(false)
    // 搜索关键字
    const [prevKeyword, setKeyword] = useState('')
    const [prevNodeArrs, setPrevNodeArrs] = useState([])
    // 选中的字段
    const [selectedFields, setSelectedFields] = useState<any[]>([])

    const { data: contextData, dispatch } = useContext(CustomViewContext)
    const { sqlInfo } = contextData.toJS()

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

    // 取消执行请求
    const cancelRunGraph = () => {
        cancelRequest(
            '/api/scene-analysis/v1/scene/exec-sql?type=data_fusion&need=true',
            'post',
        )
    }

    const getPrevFormula = async (srcNodes) => {
        const tmp = {}
        try {
            forEach(srcNodes, async (srcNode) => {
                let preNodeArr: any = []
                if (srcNode.data.src?.length) {
                    preNodeArr = getPreorderNode(graph.getNodes(), srcNode)
                } else {
                    preNodeArr = [srcNode]
                }
                const params = getRunViewParam(preNodeArr, fieldsData)
                const prevRes = await getExecSqlRequest({
                    canvas: params.canvas,
                    id: 'id',
                    type: 'data_fusion',
                })
                const { name } = srcNode.data
                tmp[name] = prevRes.exec_sql
            })
            setPrevNodeMap(tmp)
        } catch (error) {
            formatError(error)
        }
    }
    const exeSqlInfo = async (args) => {
        try {
            setLoading(true)
            if (!resultExpand) {
                initResHright()
                setResultExpand(true)
            }
            setErrorStatus(null)
            setResultData([])
            if (resDataRef.current) {
                // @ts-ignore
                resDataRef.current.scrollTop = 0
            }
            const { sqlScriptNew, sqlTableArr, hasLimit } = handleRunSqlParam(
                prevNodeMap,
                sqlScript,
            )
            setSqlLimit(hasLimit)
            const queryParams = hasLimit
                ? `need_count=${true}`
                : `need_count=${true}&offset=${args.current}&limit=${
                      args.pageSize
                  }`
            const resultResData = await execCustomViewSqlRequest(
                {
                    sql_type: 'data_fusion',
                    exec_sql: sqlScriptNew,
                },
                queryParams,
            )
            setExecResult({
                ...resultResData,
                exec_sql: sqlScriptNew,
                srcNodes: filter(graph.getNodes(), (info) => {
                    return node.data.src.includes(info.id)
                }),
            })
            const { data, columns, count, err } = resultResData
            setRunTotal(count)
            const before20Data = data || []
            // setDefaultSize([1, 99])
            setTabsErrorStatus(false)
            if (count && columns.length) {
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
                    total: count || 0,
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
            setErrorStatus(err)
            return {
                total: 0,
                list: [],
            }
        } catch (ex) {
            if (ex?.data?.code === 'ERR_CANCELED') {
                return Promise.resolve({
                    total: 0,
                    list: [],
                })
            }
            setErrorStatus(ex.data)
            setTabsErrorStatus(true)
            setResultExpand(true)
            setDefaultSize([1, 99])
            return Promise.reject(ex)
        } finally {
            setLoading(false)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(exeSqlInfo, {
        defaultPageSize: 10,
        manual: true,
        // @ts-ignore
        offset: runOffset,
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
        getPrevNodeMap: () => {
            return prevNodeMap
        },
        getLastResult: () => execResult,
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
                            {errorStatus?.description || ''}
                        </div>
                    )}
                </div>
            )
        }

        if (resultData?.length) {
            return (
                <div style={{ height: '100%', width: '100%', padding: '16px' }}>
                    {tableProps?.dataSource?.length && (
                        <Table
                            columns={dataColumns}
                            dataSource={tableProps.dataSource}
                            rowKey={(record) => record.index}
                            bordered={false}
                            scroll={{
                                x: dataColumns.length * 200,
                                y:
                                    resHeight -
                                    (flag ? 153 : 175) +
                                    (sqlLimit ? 48 : 0),
                            }}
                            pagination={
                                sqlLimit
                                    ? false
                                    : {
                                          current: runOffset,
                                          pageSize: runPageSize,
                                          total: runTotal,
                                          showSizeChanger:
                                              (runTotal || 0) >
                                              ListDefaultPageSize[
                                                  ListType.WideList
                                              ],
                                          pageSizeOptions:
                                              ListPageSizerOptions[
                                                  ListType.WideList
                                              ],
                                          showTotal(total, range) {
                                              return `${__(
                                                  '总计',
                                              )} ${runTotal} ${__('条数据')}`
                                          },
                                          onChange: (page, pageSize) => {
                                              const current =
                                                  pageSize !== runPageSize
                                                      ? 1
                                                      : page
                                              run({
                                                  ...pagination,
                                                  current,
                                                  pageSize,
                                              })
                                              setRunOffset(current)
                                              setRunPageSize(pageSize)
                                          },
                                      }
                            }
                        />
                    )}
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

    const onExpand = (eks: any[]) => {
        setExpandedKeys(eks)
    }

    // kind1.来自库表的插入
    useEffect(() => {
        if (sqlInfo.flag && reactCodeMirrorRef?.current?.insertText) {
            const newSql = `[[FFF.${sqlInfo.text}]]`
            reactCodeMirrorRef?.current?.insertText(newSql, false)
            dispatch({
                type: CHANGE_SQL_INFO,
                data: {
                    flag: false,
                    text: ``,
                },
            })
            onChangeExpand?.(false, true)
        }
    }, [sqlInfo])

    // kind2.来自前序节点的插入
    const handleTreeSelect = (selectedArrs, info) => {
        const { selectedNodes } = info
        const selectedNode = selectedNodes[0]
        if (isString(selectedNode?.op_name)) {
            let sqlText = ''
            if (!selectedNode.isLeaf) {
                sqlText = `${selectedNode.op_name}`
            } else {
                // 选中的是叶子节点
                const parentNode = findParentNode(treeData, selectedNode.key)
                if (parentNode) {
                    sqlText = `${parentNode.title}.${selectedNode.op_name}`
                }
            }
            const newSql = `[[FFF.\$\{${sqlText}\}]]`
            if (reactCodeMirrorRef?.current?.insertText) {
                reactCodeMirrorRef?.current?.insertText(newSql, false)
            }
        }
    }

    // 单个字段选中变更
    const handleCheck = (keys, info) => {
        const { checked, checkedNodes, node: clickNode } = info
        if (checked) {
            setSelectedFields(
                uniqBy([...selectedFields, ...checkedNodes], 'key'),
            )
            return
        }
        setSelectedFields(
            selectedFields.filter((item) => clickNode.key !== item.key),
        )
    }

    // 全选变更
    const handleCheckChange = (e, srcNode) => {
        const parentNode = getTreeData().find((item) => item.key === srcNode.id)
        if (e.target.checked) {
            setSelectedFields((prev) =>
                uniqBy(
                    [
                        ...prev,
                        ...parentNode.children.filter(
                            (item) =>
                                item.key !== `allSelect_${srcNode.id}` &&
                                !item.disabled,
                        ),
                    ],
                    'key',
                ),
            )
        } else {
            setSelectedFields((prev) =>
                prev.filter(
                    (item) =>
                        !parentNode.children.find((c) => c.key === item.key),
                ),
            )
        }
    }

    // 批量插入字段
    const handleBatchInsertField = () => {
        if (selectedFields.length) {
            const sqlText = selectedFields
                .map((item) => {
                    const parentNode = findParentNode(treeData, item.key)
                    const sql = `${parentNode.title}.${item.op_name}`
                    const newSql = `[[FFF.\$\{${sql}\}]]`
                    return newSql
                })
                .join(',')
            if (reactCodeMirrorRef?.current?.insertText) {
                reactCodeMirrorRef?.current?.insertText(sqlText, false)
            }
            setSelectedFields([])
        }
    }

    useEffect(() => {
        init()
    }, [graph, node, node?.data?.src, prevKeyword, selectedFields])

    const init = async () => {
        if (!graph || !node) {
            return
        }
        const preNodes = getPreorderNode(graph.getNodes(), node)
        const currentSrcArr: any = node.data.src
        const srcNodes: any = filter(preNodes, (info) => {
            return currentSrcArr.includes(info.id)
        })
        getPrevFormula(srcNodes)
        setPrevNodeArrs(srcNodes)
        const formViewId = srcNodes[0]?.data?.formula?.[0]?.config?.form_id
        const policyFields = await getPolicyFields(formViewId)
        const tmpTreeArr = srcNodes.map((srcNode: any) => {
            const showFields = prevKeyword
                ? srcNode.data.output_fields.filter((item) =>
                      item.alias
                          .toLocaleLowerCase()
                          .includes(prevKeyword.toLocaleLowerCase()),
                  )
                : srcNode.data.output_fields
            let selectAll = true
            let selectOne = false
            showFields.forEach((item) => {
                const findItem = selectedFields.find(
                    (field) => field.key === `${item.id}_${item.sourceId}`,
                )
                if (findItem) {
                    selectOne = true
                } else {
                    selectAll = false
                }
            })
            const selectAllNode =
                showFields.length > 0
                    ? [
                          {
                              title: (
                                  <div className={styles.tree_selectAll}>
                                      <Checkbox
                                          disabled={inViewMode}
                                          className={styles.checkbox}
                                          checked={selectAll}
                                          indeterminate={
                                              !selectAll && selectOne
                                          }
                                          onChange={(e) => {
                                              e.stopPropagation()
                                              e.preventDefault()
                                              handleCheckChange(e, srcNode)
                                          }}
                                      />
                                      {__('全选')}
                                  </div>
                              ),
                              key: `allSelect_${srcNode.id}`,
                              srcNode,
                              isLeaf: true,
                              checkable: false,
                              selectable: false,
                              disabled: inViewMode,
                          },
                      ]
                    : []
            return {
                title: srcNode.data.formula[0]?.errorMsg ? (
                    <span>
                        <span style={{ marginRight: 8 }}>
                            {srcNode.data.name}
                        </span>
                        <Tooltip
                            placement="bottom"
                            title={__('算子配置有误，请在对应的节点更改配置')}
                        >
                            <InfoCircleOutlined
                                style={{ color: 'rgba(255, 77, 79, 1)' }}
                            />
                        </Tooltip>
                    </span>
                ) : (
                    srcNode.data.name
                ),
                op_name: srcNode.data.name,
                key: srcNode.id,
                icon: (
                    <FontIcon
                        name="icon-xinjianjiedian"
                        style={{
                            color: 'rgba(144, 127, 236, 1)',
                            marginRight: 4,
                            fontSize: 16,
                        }}
                    />
                ),
                isLeaf: false,
                checkable: false,
                children: [
                    ...selectAllNode,
                    ...showFields.map((item) => {
                        const name_en =
                            item.name_en ||
                            fieldsData.data.find((f) => item?.id === f.id)
                                ?.name_en
                        const original_name =
                            item.original_name ||
                            fieldsData.data.find((f) => item?.id === f.id)
                                ?.original_name
                        const data_type =
                            item.data_type ||
                            fieldsData.data.find((f) => item?.id === f.id)
                                ?.data_type
                        const disabled = policyFields?.fields
                            ?.map((o) => o.id)
                            ?.includes(item?.id)
                        return {
                            alias: item.alias,
                            op_name: item.alias,
                            title: (
                                <div className={styles.field_box}>
                                    <div>
                                        <div
                                            className={styles.field_name}
                                            title={item.alias}
                                        >
                                            {item.alias}
                                        </div>
                                        <div
                                            className={styles.field_name_en}
                                            title={name_en}
                                        >
                                            {name_en}
                                        </div>
                                    </div>
                                    {disabled && (
                                        <Tooltip
                                            color="#fff"
                                            overlayInnerStyle={{
                                                color: 'rgba(0,0,0,0.85)',
                                            }}
                                            overlayStyle={{
                                                maxWidth: 600,
                                            }}
                                            placement="bottomRight"
                                            title={__(
                                                '当前字段数据受脱敏管控，不能查询最大值、最小值、分组求和以及根据分组计算平均值，也不能作为分析维度查询其他数据',
                                            )}
                                        >
                                            <InfoCircleOutlined
                                                style={{ cursor: 'default' }}
                                            />
                                        </Tooltip>
                                    )}
                                </div>
                            ),
                            key: `${item.id}_${item.sourceId}`,
                            isLeaf: true,
                            checkable: true,
                            disabled,
                            icon: <DataTypeIcons type={data_type} />,
                        }
                    }),
                ],
            }
        })
        if (prevKeyword) {
            const arr: any = []
            forEach(srcNodes, (srcNode) => {
                if (
                    srcNode.data.name
                        .toLocaleLowerCase()
                        .includes(prevKeyword.toLocaleLowerCase())
                ) {
                    arr.push(srcNode.id)
                } else {
                    forEach(srcNode.data.output_fields, (field) => {
                        if (
                            field.alias
                                .toLocaleLowerCase()
                                .includes(prevKeyword.toLocaleLowerCase())
                        ) {
                            arr.push(srcNode.id)
                        }
                    })
                }
            })
            if (arr.length === 0) {
                setTreeData([])
            } else {
                const treeRes = tmpTreeArr.filter((item) =>
                    arr.includes(item.key),
                )
                setTreeData(treeRes)
            }
            setExpandedKeys(arr)
        } else {
            setTreeData(tmpTreeArr)
        }
    }

    // 搜索字段
    const handleSearchField = (kw: string) => {
        setKeyword(kw)
    }

    const sqlEditorRender = () => {
        return (
            <div className={styles.sqlv_editorExpand}>
                <div className={styles.sqlv_titleBar}>
                    <div
                        className={classnames(
                            styles.sqlv_btn,
                            !sqlScript.length && styles.sqlv_btn_disabled,
                        )}
                        onClick={() => {
                            if (trim(sqlScript)) {
                                setRunOffset(1)
                                setRunPageSize(10)
                                if (
                                    !checkBeforeRun(
                                        graph,
                                        prevNodeMap,
                                        sqlScript,
                                    )
                                ) {
                                    return
                                }
                                run({
                                    ...pagination,
                                    current: 1,
                                    pageSize: 10,
                                })
                            }
                        }}
                    >
                        <Tooltip
                            title={
                                sqlScript.length ? '' : __('当前SQL代码为空')
                            }
                            placement="bottom"
                        >
                            <OperationRunlined className={styles.icon} />
                            <span>{__('执行')}</span>
                        </Tooltip>
                    </div>
                    <div
                        className={classnames(
                            styles.sqlv_btn,
                            !sqlScript.length && styles.sqlv_btn_disabled,
                        )}
                        onClick={() => {
                            const formattedSql = getFormatSql(sqlScript)
                            setSqlScript(formattedSql)
                            onChangeSql(formattedSql)
                            dispatch({
                                type: CHANGE_SQL_TEXT,
                                data: formattedSql,
                            })
                        }}
                    >
                        <Tooltip
                            title={
                                sqlScript.length ? '' : __('当前SQL代码为空')
                            }
                            placement="bottom"
                        >
                            <FontIcon
                                name="icon-geshi"
                                className={styles.icon}
                            />
                            <span>{__('格式化')}</span>
                        </Tooltip>
                    </div>
                    {/* <div
                        className={styles.sqlv_btn}
                        onClick={() => {
                            setSqlScript('')
                        }}
                    >
                        <CleanUpColored style={{ marginRight: '4px' }} />
                        {__('清理')}
                    </div> */}
                </div>
                <div className={styles.sqlv_editorBox} ref={editRef}>
                    <Editor
                        // initSource={sourceKeyword}
                        value={sqlScript}
                        onChange={(value) => {
                            setSqlScript(value)
                            onChangeSql(value)
                            dispatch({
                                type: CHANGE_SQL_TEXT,
                                data: value,
                            })
                        }}
                        readOnly={
                            taskStatus === TaskExecutableStatus.COMPLETED ||
                            inViewMode
                        }
                        height={`${editerSize.height}px`}
                        width={`${editerSize.width}px`}
                        ref={reactCodeMirrorRef}
                        prevNodeMap={prevNodeMap}
                    />
                </div>
            </div>
        )
    }

    const initResHright = () => {
        if (editorWrapperRef.current) {
            setFlag(true)
            const { height } = editorWrapperRef.current.getBoundingClientRect()
            const h = Math.abs((height * 3) / 4)
            setResInitalHeight(h)
            setResHeight(h)
        }
    }

    useEffect(() => {
        const graphBodyDom = document.querySelector('#fusionGraphContent')
        if (graphBodyDom) {
            const { height } = graphBodyDom.getBoundingClientRect()
            setResMaxHeight(height)
        }
        initResHright()
    }, [editorWrapperRef.current])

    // useDebounceEffect(() => {
    //     setResMaxHeight(bodySize.height - 52 - 54)
    //     if (
    //         (bodySize.height < 710 &&
    //             bodySize.height - oldBodySize.height < 0) ||
    //         bodySize.height - oldBodySize.height > 0
    //     ) {
    //         setResHeight(bodySize.height - oldBodySize.height + resHeight)
    //     }
    //     setOldBodySize(bodySize)
    // }, [bodySize])

    const resultTopHandle = () => {
        return (
            <div className={styles.topHandle}>
                <img
                    src={dragVertical}
                    alt=""
                    draggable={false}
                    className={styles.dragIcon}
                />
            </div>
        )
    }

    return (
        <div className={styles.sqlv_editorContainer}>
            <div className={styles.sqlv_editorWrap} ref={editorWrapperRef}>
                {resultExpand && (
                    <Resizable
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            zIndex: 1000,
                            borderTop: '1px solid rgba(217, 217, 217, 1)',
                            background: '#fff',
                        }}
                        defaultSize={{ height: resHeight }}
                        size={{ height: resHeight }}
                        onResize={(e) => onResize(e)}
                        onResizeStart={(e) => onResizeStart(e)}
                        onResizeStop={(e, direction, resizeRef, d) => {
                            const newH = resHeight + d.height
                            setResHeight(newH)
                            setResInitalHeight(newH)
                        }}
                        handleComponent={{ top: resultTopHandle() }}
                        enable={{
                            top: flag,
                            right: false,
                            bottom: false,
                            left: false,
                            topRight: false,
                            bottomRight: false,
                            bottomLeft: false,
                            topLeft: false,
                        }}
                        minWidth="100%"
                        maxWidth="100%"
                        minHeight={0}
                        // eslint-disable-next-line
                        maxHeight={flag ? resMaxHeight - 40 : resMaxHeight}
                    >
                        <div className={styles.sqlv_resultExpand}>
                            <div
                                className={
                                    !flag
                                        ? `${styles.sqlv_titleBar} ${styles.sqlv_titleBarExpand}`
                                        : styles.sqlv_titleBar
                                }
                            >
                                {!flag ? (
                                    <div
                                        className={styles.sqlv_titleTextExpand}
                                    >
                                        {__('查询结果')}
                                    </div>
                                ) : (
                                    <div>{__('查询结果')}</div>
                                )}
                                <div className={styles.sqlv_titleIcons}>
                                    {flag ? (
                                        <FullScreenOutlined
                                            className={styles.fullScreenIcon}
                                            onClick={() => {
                                                setResHeight(resMaxHeight - 2)
                                                setFlag(false)
                                                dispatch({
                                                    type: CHANGE_SQL_RESULT_FULL_SCREEN,
                                                    data: true,
                                                })
                                            }}
                                        />
                                    ) : (
                                        <ShouQiOutlined
                                            className={styles.fullScreenIcon}
                                            onClick={() => {
                                                setFlag(true)
                                                setResHeight(resInitalHeight)
                                                dispatch({
                                                    type: CHANGE_SQL_RESULT_FULL_SCREEN,
                                                    data: false,
                                                })
                                            }}
                                        />
                                    )}

                                    <Tooltip
                                        title={__('关闭')}
                                        placement="bottom"
                                    >
                                        <CloseOutlined
                                            className={styles.closeIcon}
                                            onClick={() => {
                                                cancelRunGraph()
                                                dispatch({
                                                    type: CHANGE_SQL_RESULT_FULL_SCREEN,
                                                    data: false,
                                                })
                                                setResultExpand(false)
                                            }}
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                            <div
                                className={styles.sqlv_resultContent}
                                ref={resDataRef}
                            >
                                {getResultComponent()}
                            </div>
                        </div>
                    </Resizable>
                )}
                <div className={styles.sqlv_selectWrap}>
                    {!prevNodeArrs.length ? (
                        sqlEditorRender()
                    ) : (
                        <DragBox
                            defaultSize={defaultHorizontalSize}
                            minSize={[280, 270]}
                            maxSize={[480, Infinity]}
                            onDragEnd={(size) => {
                                setDefaultHorizontalSize(size)
                            }}
                            gutterStyles={{ borderTop: 'none' }}
                            expandCloseText={__('前序节点')}
                            unExpandFunc={(bool) => setCloseLeftSide(bool)}
                        >
                            {!closeLeftSide && (
                                <div className={styles.sqlv_left}>
                                    {showPrevSearch ? (
                                        <h5 className={styles.sqlv_leftTitle}>
                                            <SearchInput
                                                maxLength={255}
                                                style={{ width: 264 }}
                                                placeholder={__(
                                                    '搜索节点名称、字段名称',
                                                )}
                                                value={prevKeyword}
                                                onKeyChange={handleSearchField}
                                                onPressEnter={(e: any) =>
                                                    handleSearchField(
                                                        e.target.value.trim(),
                                                    )
                                                }
                                                autoFocus
                                                onBlur={(e) => {
                                                    if (
                                                        !e.target.value.trim()
                                                    ) {
                                                        setShowPrevSearch(false)
                                                    }
                                                }}
                                            />
                                        </h5>
                                    ) : (
                                        <h5 className={styles.sqlv_leftTitle}>
                                            <span
                                                className={
                                                    styles.sqlv_leftTitleText
                                                }
                                            >
                                                {__('前序节点')}(
                                                {treeData.length})
                                            </span>
                                            <TableSearchOutlined
                                                styles={{
                                                    fontSize: 16,
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() =>
                                                    setShowPrevSearch(true)
                                                }
                                            />
                                        </h5>
                                    )}
                                    {selectedFields.length > 0 && (
                                        <a
                                            className={styles.sqlv_batchText}
                                            onClick={() =>
                                                handleBatchInsertField()
                                            }
                                        >
                                            {__('批量插入字段')}(
                                            {selectedFields.length})
                                        </a>
                                    )}
                                    <div className={styles.sqlv_dirtreeContent}>
                                        {isTreeLoading ? (
                                            <div
                                                className={
                                                    styles.sqlv_dirtreeLoading
                                                }
                                            >
                                                <Loader />
                                            </div>
                                        ) : isEmpty ? (
                                            DefaultEmpty
                                        ) : (
                                            <Tree
                                                checkable
                                                blockNode
                                                showIcon
                                                disabled={inViewMode}
                                                switcherIcon={<DownOutlined />}
                                                selectedKeys={selectedKeys}
                                                expandedKeys={expandedKeys}
                                                onExpand={onExpand}
                                                treeData={treeData}
                                                onSelect={handleTreeSelect}
                                                checkedKeys={selectedFields.map(
                                                    (item) => item.key,
                                                )}
                                                onCheck={handleCheck}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                            {sqlEditorRender()}
                        </DragBox>
                    )}
                </div>
            </div>
        </div>
    )
})
export default EditorModal
