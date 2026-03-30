import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    useContext,
    forwardRef,
    useImperativeHandle,
} from 'react'
import { Form, Select, Spin, Tree, message } from 'antd'
import { StringExt } from '@antv/x6'
import {
    IFormula,
    IFormulaFields,
    formatError,
    messageError,
    getDatasheetViewDetails,
    postRecommendLogicView,
    TaskExecutableStatus,
    execCustomViewSqlRequest,
} from '@/core'
import styles from './styles.module.less'
import __ from '../locale'
import {
    IFormulaConfigEl,
    catalogLabel,
    splitDataType,
    handleRunSqlParam,
    dataEmptyView,
    getFormatSql,
    checkBeforeRun,
} from './helper'
import { changeTypeToLargeArea } from '../helper'
import { FormulaError } from '../const'
import ConfigHeader from './ConfigHeader'
import EditorModal from './EditorModal'
import { useViewGraphContext } from '../ViewGraphProvider'

/**
 * 引用库表算子配置-逻辑/自定义库表模块
 */
const SQLViewFormula = forwardRef((props: IFormulaConfigEl, ref) => {
    const {
        visible,
        graph,
        node,
        formulaData,
        fieldsData,
        viewSize = 0,
        dragExpand,
        onChangeExpand,
        onClose,
        fullScreen,
        handleFullScreen,
    } = props
    const [loading, setLoading] = useState<boolean>(false)
    // 当前的算子信息
    const [formulaItem, setFormulaItem] = useState<IFormula>()
    // 库表存在情况
    const [viewExist, setViewExist] = useState<boolean>(true)
    // 编辑器ref
    const editorRef: any = useRef()
    const [dataForms, setDataForms] = useState<Array<any>>([])
    const [sqlScript, setSqlScript] = useState<string>('')
    const [resultData, setResultData] = useState<any>(null)
    const [insertSql, setInsertSql] = useState<string>('')
    const { setContinueFn } = useViewGraphContext()

    useImperativeHandle(ref, () => ({
        checkSaveChanged,
        onSave: handleSave,
    }))

    // 检查算子保存变更
    const checkSaveChanged = (): Promise<boolean> => {
        if (!node) return Promise.resolve(false)
        const realFormula = node.data.formula.find(
            (info) => info.id === formulaData!.id,
        )
        if (!realFormula) return Promise.resolve(false)
        setFormulaItem(realFormula)
        const { errorMsg, config, output_fields } = realFormula
        if (errorMsg && errorMsg !== FormulaError.ConfigError) {
            return Promise.resolve(false)
        }
        const { sqlScriptNew } = handleRunSqlParam(
            editorRef.current.getPrevNodeMap() || {},
            sqlScript,
        )
        if (sqlScriptNew !== (config?.sql?.sql_info?.sql_str || '')) {
            return Promise.resolve(true)
        }
        return Promise.resolve(false)
    }

    useEffect(() => {
        if (visible && formulaData && node) {
            checkData()
        }
    }, [visible, formulaData, node])

    // 检查更新数据
    const checkData = async () => {
        setLoading(true)
        const realFormula = node!.data.formula.find(
            (info) => info.id === formulaData!.id,
        )
        setFormulaItem(realFormula)
        if (node?.data?.formula[0]?.config?.sql_origin) {
            setInsertSql(node?.data.formula[0].config.sql_origin)
            setSqlScript(node?.data.formula[0].config.sql_origin)
        }
        setLoading(false)
    }

    // 保存节点配置
    /* eslint consistent-return: "off" */
    const handleSave = async () => {
        try {
            const { formula } = node!.data
            const {
                sqlScriptNew,
                sqlFieldArr,
                sqlTableArr,
                sqlTextArr,
                hasLimit,
            } = handleRunSqlParam(
                editorRef.current.getPrevNodeMap() || {},
                sqlScript,
            )
            if (
                !checkBeforeRun(
                    graph,
                    editorRef.current.getPrevNodeMap() || {},
                    sqlScript,
                )
            ) {
                return
            }
            const queryParams = hasLimit
                ? `need_count=${false}`
                : `need_count=${false}&offset=${1}&limit=${10}`
            let resultResData
            const lastData = editorRef?.current?.getLastResult()
            if (lastData && lastData.exec_sql === sqlScriptNew) {
                resultResData = lastData
            } else {
                if (formulaItem?.config) {
                    const { config } = formulaItem
                    if (config.sql?.sql_info?.sql_str === sqlScriptNew) {
                        onClose()
                        return
                    }
                    // 格式化后一致
                    if (
                        getFormatSql(sqlScript) ===
                        getFormatSql(config.sql_origin)
                    ) {
                        node!.replaceData({
                            ...node?.data,
                            formula: formula.map((info) => {
                                // 查找当前配置的算子
                                if (info.id === formulaItem?.id) {
                                    const tempFl = info
                                    delete tempFl.errorMsg
                                    return {
                                        ...tempFl,
                                        config: {
                                            ...tempFl.config,
                                            sql: {
                                                sql_info: {
                                                    sql_str: sqlScriptNew,
                                                },
                                            },
                                            sql_origin: sqlScript,
                                        },
                                    }
                                }
                                return info
                            }),
                        })
                        onClose()
                        return
                    }
                }

                resultResData = await execCustomViewSqlRequest(
                    {
                        sql_type: 'data-view',
                        exec_sql: sqlScriptNew,
                    },
                    queryParams,
                )
            }
            if (resultResData.err) {
                setContinueFn(undefined)
                messageError(resultResData.err.description)
                return false
            }
            if (resultResData.columns.length === 0) {
                setContinueFn(undefined)
                message.error(__('没有输出结果，请修改'))
                return
            }
            const output_fields = resultResData.columns.map((item) => {
                const { name, type } = item
                let data_type = type
                if (data_type.includes('(')) {
                    data_type = splitDataType(type).newType
                }
                data_type = changeTypeToLargeArea(data_type)
                const findItem = formulaItem?.config?.config_fields?.find(
                    (f) => f?.name_en === name,
                )
                return {
                    alias: name,
                    id: findItem?.id || StringExt.uuid(),
                    name,
                    sourceId: node!.id,
                    originName: name,
                    checked: true,
                    beEditing: false,
                    data_type,
                    name_en: name,
                    formulaId: formulaItem?.id,
                }
            })

            // 将执行结果作为样例数据存储
            const exaData = {}
            resultResData?.columns?.forEach((item, index) => {
                exaData[item.name] = Array.from(
                    new Set(resultResData?.data?.map((it) => it[index])),
                )
            })
            fieldsData.addExampleData(
                formulaItem!.id,
                exaData,
                resultResData?.columns,
                true,
            )

            // 更新节点内数据
            node!.replaceData({
                ...node?.data,
                formula: formula.map((info) => {
                    // 查找当前配置的算子
                    if (info.id === formulaItem?.id) {
                        const tempFl = info
                        delete tempFl.errorMsg
                        return {
                            ...tempFl,
                            type: 'sql',
                            config: {
                                sql: {
                                    sql_info: {
                                        sql_str: sqlScriptNew,
                                    },
                                },
                                sql_origin: sqlScript,
                                config_fields: output_fields,
                                sqlFieldArr,
                                sqlTableArr,
                                sqlTextArr,
                            },
                            output_fields,
                        }
                    }
                    return info
                }),
            })
            onClose()
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <div className={styles.sqlViewFormulaWrap}>
            <ConfigHeader
                node={node}
                formulaItem={formulaItem}
                loading={loading}
                dragExpand={dragExpand}
                onChangeExpand={onChangeExpand}
                onClose={() => onClose(false)}
                onSure={() => handleSave()}
                fullScreen={fullScreen}
                handleFullScreen={handleFullScreen}
            />
            {loading ? (
                <Spin className={styles.ldWrap} />
            ) : (
                <div className={styles.sf_contentWrap}>
                    {!formulaItem?.errorMsg ||
                    formulaItem.errorMsg === FormulaError.ConfigError ? (
                        <div className={styles.sqlv_contentWrap}>
                            <h4 className={styles.sqlv_title}>
                                {__('SQL编辑器')}
                                <span className={styles.sqlv_title_tip}>
                                    {__(
                                        '（提示：使用SQL函数时，需要为结果字段取一个别名。）',
                                    )}
                                </span>
                            </h4>
                            <EditorModal
                                dataForms={dataForms}
                                fieldsData={fieldsData}
                                ref={editorRef}
                                onChangeSql={(value) => {
                                    setSqlScript(value)
                                }}
                                taskStatus={TaskExecutableStatus.EXECUTABLE}
                                insertSql={insertSql}
                                originResultData={resultData}
                                setTabsErrorStatus={(errorStatus) => {}}
                                graph={graph}
                                node={node}
                                onChangeExpand={onChangeExpand}
                            />
                        </div>
                    ) : (
                        dataEmptyView(formulaItem?.errorMsg, formulaItem?.type)
                    )}
                </div>
            )}
        </div>
    )
})

export default SQLViewFormula
