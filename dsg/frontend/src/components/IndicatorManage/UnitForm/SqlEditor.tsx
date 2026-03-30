import React, {
    ReactNode,
    useState,
    useMemo,
    useRef,
    useEffect,
    CSSProperties,
    forwardRef,
    useImperativeHandle,
} from 'react'
import { Button, Tooltip, Table, Spin } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import cs from 'classnames'
import { find, set } from 'lodash'
import { IconType } from '@/icons/const'
import __ from '../locale'
import {
    OperationRunlined,
    CloseOutlined,
    FontIcon,
    FullScreenOutlined,
} from '@/icons'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import Icons from '@/components/BussinessConfigure/Icons'
import SearchFields from './SearchFields'
import DragBox from '../../DragBox'
import DragVeticalBox from '../../DragVeticalBox'
import Editor, { getFormatSql } from '../Editor'
import { runSql } from '@/core/apis/indicatorManagement'
import { formatError, validateSqlSyntax } from '@/core'
import { replaceSqlStr } from '../helper'
import dataEmpty from '@/assets/dataEmpty.svg'
import { useSqlExplainContext } from '../SqlExplainProvider'

export enum SqlEditorType {
    FILTER = 'indicator-filter',
    MEASURE = 'indicator-measure',
}
export enum InsPosType {
    TOP = 'top',
    MIDDLE = 'middle',
    BOTTOM = 'bottom',
}

export interface FieldType {
    id: string
    name_en: string
    name: string
    alias: string
    [key: string]: any
}

interface Props {
    type: SqlEditorType
    style?: CSSProperties
    fieldOptions: any[]
    required?: boolean
    hidden: boolean
    value: string
    onChange: (value, formatValue) => void
    onMapChange: (value) => void
    placeholder?: string
    uneditableValues?: string[]
    insertPosition?: InsPosType
    nodeName: string
    onCancel?: () => void
    onOk?: () => void
}

export const SqlCode = ({ value }: { value: string }) => {
    const text = useMemo(() => getFormatSql(value), [value])
    return <pre>{text}</pre>
}

const SqlEditor = forwardRef(
    (
        {
            hidden,
            value,
            onChange,
            onMapChange,
            fieldOptions,
            style,
            placeholder,
            required = false,
            uneditableValues = [],
            insertPosition = InsPosType.BOTTOM,
            type,
            nodeName,
            onOk,
            onCancel,
        }: Props,
        ref,
    ) => {
        const { sqlExplainRecord, setSqlExplainRecord } = useSqlExplainContext()
        const codeEditor = useRef<any>(null)
        const [defaultSize, setDefaultSize] = useState<number[]>([12, 88])
        const [veticalDefaultSize, setVeticalDefaultSize] = useState<number[]>([
            100, 0,
        ])
        const [expand, setExpand] = useState<boolean>(false)
        const [errInfo, setErrInfo] = useState<any>(null)
        const [loading, setLoading] = useState<boolean>(false)
        const [showInputError, setShowInputError] = useState<boolean>(false)
        const [tableColumns, setTableColumns] = useState<any[]>([])
        const [tableData, setTableData] = useState<any[]>([])
        const [tableTotal, setTableTotal] = useState<number>(0)
        const [tableCurrent, setTableCurrent] = useState<number>(1)
        // 执行
        const handleRun = () => {
            setVeticalDefaultSize([60, 40])
            setTableCurrent(1)
            getList(1)
        }

        const validateSyntax = async () => {
            try {
                if (required && !value) {
                    setShowInputError(true)
                    return false
                }

                const val = value
                    ? value.replace(/\[\[FFF\.\$\{|\}\]\]/g, '"')
                    : value

                let exec_sql = ''
                const [s1, s2] = uneditableValues
                switch (insertPosition) {
                    case InsPosType.TOP:
                        exec_sql = `${val} ${s1 || ''}`
                        break
                    case InsPosType.MIDDLE:
                        exec_sql = `${s1 || ''} ${val} ${s2 || ''}`
                        break
                    case InsPosType.BOTTOM:
                        exec_sql = `${s1 || ''} ${val}`
                        break
                    default:
                        break
                }

                if (!sqlExplainRecord?.includes(exec_sql.trim())) {
                    await validateSqlSyntax(exec_sql.trim())
                    setSqlExplainRecord([...sqlExplainRecord, exec_sql.trim()])
                }
                return true
            } catch (error) {
                if (
                    error?.data?.code === 'VirtualizationEngine.SqlSyntaxError.'
                ) {
                    setVeticalDefaultSize([20, 80])
                    setErrInfo(error?.data)
                } else {
                    formatError(error)
                }
                return false
            }
        }

        useImperativeHandle(ref, () => ({
            validateSyntax,
        }))

        const getList = async (current: number) => {
            try {
                const val = replaceSqlStr(value, '"')
                let exec_sql = ''
                const [s1, s2] = uneditableValues
                switch (insertPosition) {
                    case InsPosType.TOP:
                        exec_sql = `${val} ${s1 || ''}`
                        break
                    case InsPosType.MIDDLE:
                        exec_sql = `${s1 || ''} ${val} ${s2 || ''}`
                        break
                    case InsPosType.BOTTOM:
                        exec_sql = `${s1 || ''} ${val}`
                        break
                    default:
                        break
                }
                setLoading(true)
                const { columns, count, data, err } = await runSql({
                    sql_type: type,
                    exec_sql: exec_sql.trim(),
                    offset: current,
                })
                setLoading(false)
                setErrInfo(err)
                if (err) return
                setTableTotal(count)
                setTableColumns(
                    columns.map(({ name }, i) => {
                        const o = find(fieldOptions, ['name_en', name])
                        return {
                            title: o ? (
                                <span>
                                    <div className={styles.tableName}>
                                        <Icons type={o.data_type} />
                                        <span
                                            title={o.name || o.business_name}
                                            className={styles.text}
                                        >
                                            {o.name || o.business_name}
                                        </span>
                                    </div>
                                    <div className={styles.tableNameEn}>
                                        {o.name_en || o.technical_name}
                                    </div>
                                </span>
                            ) : (
                                <span>
                                    <div className={styles.tableName}>
                                        <span className={styles.text}>
                                            {name}
                                        </span>
                                    </div>
                                </span>
                            ),
                            dataIndex: i,
                            key: i,
                            ellipsis: true,
                            render: (text, record) => (
                                <div className={styles.tableText}>
                                    {!text && text !== 0 ? '--' : text}
                                </div>
                            ),
                        }
                    }),
                )
                setTableData(data)
            } catch (error) {
                setLoading(false)
                formatError(error)
            }
        }
        // 关闭查看结果
        const handleClose = async () => {
            setVeticalDefaultSize([100, 0])
            setExpand(false)
            setErrInfo(null)
            setTableColumns([])
            setTableData([])
            setLoading(false)
        }
        // 添加字段
        const handleAddFields = (item) => {
            // const key = `$\{${item.alias || item.name}}`
            const tecKey = `$\{${item.technical_name || item.name_en}}`
            const newSql = `[[FFF.${tecKey}]]`
            if (codeEditor?.current?.insertText) {
                codeEditor?.current?.insertText(newSql, false)
                onMapChange?.({ fieldId: item.id, dynamic_field: tecKey })
            }
        }

        useEffect(() => {
            if (value && required) {
                setShowInputError(false)
            }
        }, [value])

        const editorContent = (
            <>
                <Editor
                    style={
                        showInputError
                            ? { border: '1px solid #ff4d4f' }
                            : undefined
                    }
                    lineNumbers={false}
                    ref={codeEditor}
                    value={value}
                    onChange={(val) => {
                        const formatVal = val
                            ? val.replace(/\[\[FFF\.|\]\]/g, '')
                            : val
                        onChange?.(val, formatVal)
                    }}
                    placeholder={placeholder}
                />
                {showInputError && (
                    <div style={{ color: '#ff4d4f' }}>{__('输入不能为空')}</div>
                )}
            </>
        )
        const closeIcon = (
            <Tooltip title={__('关闭')}>
                <CloseOutlined className={styles.icon} onClick={handleClose} />
            </Tooltip>
        )
        const content = loading ? (
            <div style={{ height: '100%', display: 'flex' }}>
                <Spin style={{ margin: 'auto' }} />
            </div>
        ) : errInfo ? (
            <div className={styles.errContent}>
                <ExclamationCircleFilled
                    style={{ fontSize: 32, color: '#faac14' }}
                />
                <span>{__('运行失败')}</span>
                <span>{__('SQL存在错误，请修改代码')}</span>
                {errInfo?.detail && (
                    <span className={styles.errMsg}>{errInfo?.detail}</span>
                )}
            </div>
        ) : tableData?.length ? (
            <Table
                dataSource={tableData}
                columns={tableColumns}
                scroll={{ x: true }}
                pagination={
                    !tableTotal || tableTotal <= 20
                        ? false
                        : {
                              current: tableCurrent,
                              pageSize: 20,
                              total: tableTotal,
                              showSizeChanger: false,
                              showTotal(total, range) {
                                  return `${__('总计')} ${total} ${__(
                                      '条数据',
                                  )}`
                              },
                              onChange: (page) => {
                                  setTableCurrent(page)
                                  getList(page)
                              },
                          }
                }
            />
        ) : (
            <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
        )
        return (
            <div hidden={hidden} style={style} className={styles.sqlEditor}>
                <div className={styles.sqlEditorContent}>
                    <div className={styles.title}>{__('SQL编辑器')}</div>
                    <div className={styles.dragContent}>
                        <DragVeticalBox
                            defaultSize={veticalDefaultSize}
                            minSize={veticalDefaultSize[0] === 100 ? 0 : 40}
                            onDragEnd={(rate) => {
                                const close =
                                    (window.innerHeight * rate[1]) / 100 < 48
                                if (close) {
                                    setVeticalDefaultSize([99, 1])
                                } else {
                                    setVeticalDefaultSize(rate)
                                }
                            }}
                            hiddenElement={
                                veticalDefaultSize[0] === 100 ? 'right' : ''
                            }
                            gutterSize={8}
                            gutterStyle={() => ({
                                height: '4px',
                                background: '#fafafa',
                                visibility:
                                    veticalDefaultSize[0] === 100
                                        ? 'hidden'
                                        : 'visible',
                            })}
                        >
                            <div className={styles.dragTop}>
                                <DragBox
                                    defaultSize={defaultSize}
                                    minSize={[460, 270]}
                                    maxSize={[800, Infinity]}
                                    onDragEnd={(size) => {
                                        setDefaultSize(size)
                                    }}
                                    existPadding={false}
                                    gutterSize={1}
                                    gutterStyles={{
                                        borderTop: 'none',
                                        width: '1px',
                                    }}
                                >
                                    <div className={styles.left}>
                                        <SearchFields
                                            options={fieldOptions}
                                            onClick={handleAddFields}
                                            placeholder={__(
                                                '搜索“引用库表”中业务名称、技术名称',
                                            )}
                                        />
                                    </div>
                                    <div className={styles.right}>
                                        <div className={styles.operate}>
                                            {value ? (
                                                <span onClick={handleRun}>
                                                    <OperationRunlined />
                                                    {__('执行')}
                                                </span>
                                            ) : (
                                                <Tooltip
                                                    title={__(
                                                        '当前SQL代码为空',
                                                    )}
                                                    placement="bottom"
                                                >
                                                    <span
                                                        style={{
                                                            cursor: 'not-allowed',
                                                        }}
                                                    >
                                                        <OperationRunlined />
                                                        {__('执行')}
                                                    </span>
                                                </Tooltip>
                                            )}
                                        </div>
                                        <div className={styles.sqlArea}>
                                            {insertPosition === 'top' &&
                                                editorContent}
                                            {uneditableValues[0] && (
                                                <Editor
                                                    highlightActiveLine={false}
                                                    lineNumbers={false}
                                                    editable={false}
                                                    value={getFormatSql(
                                                        uneditableValues[0],
                                                    )}
                                                />
                                                // <SqlCode
                                                //     value={uneditableValues[0]}
                                                // />
                                            )}
                                            {insertPosition === 'middle' &&
                                                editorContent}
                                            {uneditableValues[1] && (
                                                <Editor
                                                    highlightActiveLine={false}
                                                    lineNumbers={false}
                                                    editable={false}
                                                    value={getFormatSql(
                                                        uneditableValues[1],
                                                    )}
                                                />
                                                // <SqlCode
                                                //     value={uneditableValues[1]}
                                                // />
                                            )}
                                            {insertPosition === 'bottom' &&
                                                editorContent}
                                        </div>
                                    </div>
                                </DragBox>
                            </div>
                            <div className={styles.dragBottom}>
                                <div
                                    className={cs(
                                        styles.header,
                                        styles.bottomHeader,
                                    )}
                                >
                                    <span>{__('查询结果')}</span>
                                    <span className={styles.optButton}>
                                        <Tooltip title={__('放大')}>
                                            <FullScreenOutlined
                                                className={styles.icon}
                                                onClick={() => setExpand(true)}
                                            />
                                        </Tooltip>
                                        {closeIcon}
                                    </span>
                                </div>
                                <div className={styles.table}>{content}</div>
                            </div>
                        </DragVeticalBox>
                    </div>
                </div>
                <div hidden={!expand} className={styles.expand}>
                    <div className={cs(styles.header, styles.expandHeader)}>
                        <span>
                            {__('查询结果')}
                            {!!nodeName && (
                                <span className={styles.name} title={nodeName}>
                                    （{nodeName}）
                                </span>
                            )}
                        </span>
                        <span className={styles.optButton}>
                            <Tooltip title={__('缩小')}>
                                <span
                                    className={styles.icon}
                                    onClick={() => setExpand(false)}
                                >
                                    <FontIcon
                                        name="icon-shouqi1"
                                        type={IconType.FONTICON}
                                    />
                                </span>
                            </Tooltip>
                            {closeIcon}
                            <Button onClick={onCancel}>{__('取消')}</Button>
                            <Button onClick={onOk} type="primary">
                                {__('确定')}
                            </Button>
                        </span>
                    </div>

                    <div className={styles.expandTable}>{content}</div>
                </div>
            </div>
        )
    },
)

export default SqlEditor
