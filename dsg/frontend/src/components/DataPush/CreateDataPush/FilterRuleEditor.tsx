import {
    FC,
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react'
import { Space, Spin, Table, Tooltip } from 'antd'
import { useAntdTable, useGetState, useSize } from 'ahooks'
import { trim } from 'lodash'
import classnames from 'classnames'
import {
    ArrowsAltOutlined,
    DownOutlined,
    ExclamationCircleFilled,
    ShrinkOutlined,
    UpOutlined,
} from '@ant-design/icons'
import __ from '../locale'
import styles from './styles.module.less'
import empty from '../../../assets/dataEmpty.svg'
import { Empty, Watermark } from '@/ui'
import Editor from '@/ui/Editor'
import DragVeticalBox from '@/components/DragVeticalBox'
import { OperationRunlined } from '@/icons'
import { execFilterRule } from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import sqlKeywords from '@/components/DatasheetView/AdvancedSettings/sqlKeywords'

/**
 * 配置接口，用于定义生成SQL语句的相关参数和行为。
 */
interface IConfig {
    /**
     * 字段列表，可选。用于指定需要生成SQL语句的字段。
     */
    fieldList?: Array<any>
    /**
     * 默认的SQL语句，可选。当没有指定特定的SQL生成规则时，可以使用这个默认的SQL语句。
     */
    defaultSql?: string
    /**
     * 数据库表的ID，必需。用于标识生成SQL语句的具体数据库表。
     */
    dataViewId?: string

    value?: string
    onChange?: (sql: string) => void
    ref: any
}
const FilterRuleEditor: FC<IConfig> = forwardRef((props: any, ref) => {
    const {
        fieldList = [],
        defaultSql = '',
        dataViewId,
        value,
        onChange,
    } = props
    // 初始化默认的大小比例
    const [defaultSize, setDefaultSize] = useState<Array<number>>([20, 80])
    // 用于存储搜索关键字
    const [searchKey, setSearchKey] = useState<string>('')
    // 用于存储列表数据
    const [listData, setListData] = useState<Array<any>>([])
    // 初始化默认的上传大小比例
    // 分割大小
    const [defaultUpSize, setDefaultUpSize, getDefaultUpSize] = useGetState<
        Array<number>
    >([99, 1])
    // 用于存储SQL脚本内容
    const [sqlScript, setSqlScript] = useState<string>(value || '')
    // 用于控制结果详情是否展开
    const [resultExpand, setResultExpand] = useState<boolean>(false)
    // 用于在编辑模式下引用DOM元素
    const editRef = useRef<HTMLDivElement>(null)
    // 获取编辑区域的大小
    const listSize = useSize(editRef)
    // 用于存储源数据关键字
    const [sourceKeyword, setSourceKeyword] = useState<Array<any>>([])
    // 控制加载状态
    const [loading, setLoading] = useState<boolean>(false)
    // 用于存储错误状态
    const [errorStatus, setErrorStatus, getErrorStatus] = useGetState<any>(null)
    // 用于存储查询结果数据
    const [resultData, setResultData] = useState<Array<any>>([])
    // 控制全屏显示状态
    const [showFullScreen, setShowFullScreen] = useState<boolean>(false)
    // 用于存储数据列的配置
    const [dataColumns, setDataColumns] = useState<Array<any>>([])
    // 获取用户信息
    const [userInfo] = useCurrentUser()

    useImperativeHandle(ref, () => ({
        validate: () => saveFilterRule(),
    }))

    useEffect(() => {
        setListData(fieldList.filter((item) => item.status !== 'delete'))
        setSourceKeyword([
            {
                detail: 'field',
                keywords: fieldList
                    .filter((item) => item && item.status !== 'delete')
                    .map((item) => item.technical_name),
            },
        ])
    }, [fieldList])

    useEffect(() => {
        setSqlScript(value || '')
    }, [value])

    useEffect(() => {
        if (searchKey) {
            setListData(
                searchValue(fieldList, searchKey).filter(
                    (item) => item.status !== 'delete',
                ),
            )
        } else {
            setListData(fieldList.filter((item) => item.status !== 'delete'))
        }
    }, [searchKey])

    // 监听searchKey的变化，以更新列表数据
    useEffect(() => {
        // 当searchKey存在时，根据searchKey搜索并更新列表数据
        if (searchKey) {
            setListData(
                // 使用searchValue函数根据searchKey过滤fieldList，排除被删除的项
                searchValue(fieldList, searchKey).filter(
                    (item) => item.status !== 'delete',
                ),
            )
        } else {
            // 当searchKey不存在时，更新列表数据为所有未被删除的项
            setListData(fieldList.filter((item) => item.status !== 'delete'))
        }
    }, [searchKey])
    /**
     * 根据关键字搜索数据。
     *
     * 该函数接收一个数据数组和一个关键字字符串，返回一个过滤后的数组，其中包含所有业务名称或技术名称与关键字匹配的项。
     * 关键字搜索不区分大小写，旨在帮助用户快速查找相关数据。
     *
     * @param data 数组，包含待搜索的数据项。每个数据项应至少包含业务名称和技術名称两个属性。
     * @param keyword 字符串，用于搜索的关键字。函数将忽略关键字的大小写，进行模糊匹配。
     * @returns 返回一个过滤后的数组，其中包含所有业务名称或技术名称与关键字匹配的数据项。
     */
    const searchValue = (data: Array<any>, keyword: string) => {
        // 创建一个正则表达式对象，用于不区分大小写的关键字匹配
        const regKey = new RegExp(keyword, 'i')
        // 过滤数据数组，仅保留业务名称或技术名称与关键字匹配的项
        return data.filter((item) => {
            // 检查业务名称或技术名称是否与关键字匹配
            return (
                regKey.test(item.business_name) ||
                regKey.test(item.technical_name)
            )
        })
    }

    /**
     * 异步执行SQL查询并处理结果。
     *
     * 此函数通过执行过滤规则来获取数据，根据返回的结果设置表格数据和列配置。
     * 如果执行成功，它将处理并返回数据列表和总数；如果执行失败，它将设置错误状态。
     *
     * @returns {Promise<{total: number, list: object[]}> | Promise<never>} 返回一个Promise，成功时包含查询结果的总数和列表，失败时抛出错误。
     */
    const exeSqlInfo = async () => {
        if (!dataViewId) {
            return {
                total: 0,
                list: [],
            }
        }
        try {
            // 初始化加载状态、错误状态和结果数据
            setLoading(true)
            setErrorStatus(null)
            setResultData([])

            // 执行过滤规则，传入数据库表ID和SQL脚本
            const res = await execFilterRule(dataViewId, {
                filter_rule: trim(sqlScript),
            })
            setLoading(false)

            // 解构响应结果中的数据、列和计数
            const { data, columns, count } = res

            // 设置结果展开状态和默认大小
            setResultExpand(true)
            setDefaultUpSize([40, 60])

            // 如果存在列信息，处理并设置表格数据和列配置
            if (columns) {
                setResultData(data)
                setDataColumns(
                    columns?.map((item) => {
                        // 配置列的标题、数据索引、键和省略号效果
                        return {
                            title: item.name,
                            dataIndex: item.name,
                            key: item.name,
                            ellipsis: true,
                            render: (val) =>
                                val === ''
                                    ? '--'
                                    : val === false || val === true || val === 0
                                    ? `${val}`
                                    : val,
                        }
                    }),
                )

                // 返回处理后的数据列表和总数
                return {
                    total: count || 0,
                    list: data.map((currentData) =>
                        currentData.reduce((preData, columnsData, index) => {
                            // 将当前数据与列名对应起来
                            return {
                                ...preData,
                                [columns[index].name]: columnsData,
                            }
                        }, {}),
                    ),
                }
            }

            // 如果没有列信息，返回空列表和总数为0
            return {
                total: 0,
                list: [],
            }
        } catch (err) {
            // 处理异常，设置加载状态和错误状态
            setLoading(false)
            setErrorStatus(err)
            setResultExpand(true)
            setDefaultUpSize([40, 60])

            // 抛出错误
            return Promise.reject(err)
        }
    }

    /**
     * 异步保存过滤规则。
     * 此函数首先尝试执行过滤规则，如果执行成功，则更新过滤规则，并显示保存成功的消息。
     * 如果在执行过程中出现错误，它将处理错误并设置相应的状态以提示用户。
     *
     * @async
     * @returns 无返回值
     */
    const saveFilterRule = async () => {
        if (!sqlScript) {
            return Promise.resolve()
        }
        if (!dataViewId) {
            return Promise.reject(new Error(''))
        }
        try {
            // 执行过滤规则并处理可能的错误。
            const res = await execFilterRule(dataViewId, {
                filter_rule: trim(sqlScript),
            })
            return Promise.resolve()
        } catch (err) {
            // 处理任何捕获的错误。
            // formatError(err)
            setLoading(false)
            setErrorStatus(err)
            setResultExpand(true)
            setDefaultUpSize([40, 60])
            return Promise.reject(new Error(''))
        }
    }

    const { tableProps, run, pagination } = useAntdTable(exeSqlInfo, {
        defaultPageSize: 20,
        manual: true,
    })

    /**
     * 根据当前状态获取结果组件。
     *
     * 此函数根据不同的条件渲染不同的组件，包括加载中状态、错误状态、无数据状态和数据展示状态。
     * 它旨在提供一种灵活的方式来展示运行SQL查询的结果或相关的提示信息。
     *
     * @returns 返回根据当前状态决定的React组件。
     */
    const getResultComponent = () => {
        // 当前处于加载状态时，显示加载中的指示器
        if (loading) {
            return (
                <div className={styles.errorBox}>
                    <Spin />
                </div>
            )
        }

        // 当前处于错误状态时，显示错误信息和相应的SQL错误详情（如果存在）
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
                                ? __('SQL存在错误，请修改')
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

        // 当SQL脚本为空时，提示用户输入SQL并提供执行按钮
        if (!trim(sqlScript)) {
            return (
                <div style={{ textAlign: 'center', paddingBottom: 24 }}>
                    <Empty
                        iconSrc={empty}
                        desc={
                            <div className={styles.emptyData}>
                                <div className={styles.text}>
                                    {__('暂无数据')}
                                </div>
                                <div>
                                    <span>{__('可点击')}</span>
                                    <Tooltip
                                        title={
                                            trim(sqlScript)
                                                ? ''
                                                : __('请先输入数据过滤SQL')
                                        }
                                    >
                                        <span
                                            className={classnames({
                                                [styles.execBtn]: true,
                                                [styles.disabledBtn]:
                                                    !trim(sqlScript),
                                            })}
                                            onClick={() => {
                                                if (trim(sqlScript)) {
                                                    run({
                                                        ...pagination,
                                                        current: 1,
                                                    })
                                                }
                                            }}
                                        >
                                            {__('【执行】')}
                                        </span>
                                    </Tooltip>

                                    <span>{__('按钮查看运行结果')}</span>
                                </div>
                            </div>
                        }
                    />
                </div>
            )
        }

        // 当有结果数据时，显示数据表格
        if (resultData?.length) {
            return (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        padding: '16px',
                    }}
                >
                    <Watermark
                        content={`${userInfo?.VisionName || ''} ${
                            userInfo?.Account || ''
                        }`}
                    >
                        {tableProps?.dataSource?.length && (
                            <Table
                                columns={dataColumns}
                                pagination={false}
                                dataSource={tableProps.dataSource}
                                // rowKey={(record) => record?.index || ''}
                                bordered={false}
                                scroll={{
                                    x: dataColumns.length * 200,
                                }}
                            />
                        )}
                    </Watermark>
                </div>
            )
        }

        // 当无结果数据时，显示空内容提示
        return (
            <div style={{ paddingBottom: 24 }}>
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
        <div className={styles.configWrapper}>
            <div className={styles.contentWrapper}>
                <div className={styles.editorWrapper}>
                    <div className={styles.titleWrapper}>
                        <span className={styles.title}>{__('规则配置')}</span>
                        <span className={styles.description}>（</span>
                        <span className={styles.description}>
                            {__(
                                '提示：1、仅支持使用SQL的查询语句，且只能输入WHERE条件；2、若用户手动输入中文字段必须要为其添加英文引号""。',
                            )}
                        </span>

                        <Tooltip
                            title={
                                <div>
                                    <span>
                                        {`示例： "分区" = to_char( (CURRENT_DATE - INTERVAL '1 day') ,'yyyymmdd' ) and "区域" = '275'`}
                                    </span>
                                    {/* <Button
                                        type="link"
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                `ds = date_format(CURRENT_DATE-INTERVAL '1' day,'%Y%m%d')`,
                                            )
                                            message.success({
                                                content: __('复制成功'),
                                                style: {
                                                    marginTop: '-56px',
                                                },
                                            })
                                        }}
                                        style={{ marginLeft: 16 }}
                                    >
                                        {__('复制')}
                                    </Button> */}
                                </div>
                            }
                            color="#fff"
                            overlayInnerStyle={{
                                color: 'rgba(0,0,0,0.65)',
                                whiteSpace: 'nowrap',
                            }}
                            placement="bottomRight"
                            overlayStyle={{ maxWidth: 620 }}
                        >
                            <span className={styles.example}>
                                {__('查看示例')}
                            </span>
                        </Tooltip>
                        <span className={styles.description}>）</span>
                    </div>
                    <div className={styles.buttonWrapper}>
                        <Tooltip
                            title={
                                trim(sqlScript) ? '' : __('请先输入数据过滤SQL')
                            }
                        >
                            <div
                                className={classnames({
                                    [styles.btn]: true,
                                    [styles.disabledBtn]: !trim(sqlScript),
                                })}
                                onClick={() => {
                                    if (trim(sqlScript)) {
                                        run({
                                            ...pagination,
                                            current: 1,
                                        })
                                    }
                                }}
                            >
                                <OperationRunlined
                                    style={{ marginRight: '4px' }}
                                />
                                {__('执行')}
                            </div>
                        </Tooltip>
                    </div>
                    <div className={styles.editorContent}>
                        <DragVeticalBox
                            defaultSize={defaultUpSize}
                            minSize={32}
                            onDragEnd={(rate) => {
                                const close =
                                    ((window.innerHeight - 126) * rate[1]) /
                                        100 <
                                    40

                                setResultExpand(!close)
                                if (close) {
                                    setDefaultUpSize([99, 1])
                                } else {
                                    setDefaultUpSize(rate)
                                }
                            }}
                            collapsed={resultExpand ? undefined : 1}
                            gutterSize={8}
                        >
                            <div className={styles.editorExpand} ref={editRef}>
                                <Editor
                                    initSource={sourceKeyword}
                                    value={sqlScript}
                                    onChange={(val) => {
                                        onChange?.(val)
                                    }}
                                    options={{
                                        lineNumbersMinChars: 3,
                                    }}
                                    height={
                                        listSize?.height
                                            ? listSize.height - 22
                                            : 'calc(100% - 22px)'
                                    }
                                    dataReservedWords={sqlKeywords}
                                />
                            </div>
                            {resultExpand ? (
                                <div className={styles.resultExpand}>
                                    <div className={styles.titleBar}>
                                        <div>
                                            <span className={styles.title}>
                                                {__('输出数据')}
                                            </span>
                                            <span
                                                className={styles.description}
                                            >
                                                {__(
                                                    '（展示部分数据作为参考，最多不超过10条）',
                                                )}
                                            </span>
                                        </div>
                                        <div>
                                            <Space size={8}>
                                                <Tooltip
                                                    placement="top"
                                                    title={__('放大')}
                                                >
                                                    <div
                                                        className={
                                                            styles.iconContent
                                                        }
                                                        onClick={(e) => {
                                                            setShowFullScreen(
                                                                true,
                                                            )
                                                        }}
                                                    >
                                                        <ArrowsAltOutlined
                                                            onClick={(e) => {
                                                                setShowFullScreen(
                                                                    true,
                                                                )
                                                            }}
                                                        />
                                                    </div>
                                                </Tooltip>
                                                <Tooltip
                                                    placement="top"
                                                    title={__('收起')}
                                                >
                                                    <div
                                                        className={
                                                            styles.iconContent
                                                        }
                                                        onClick={(e) => {
                                                            setResultExpand(
                                                                false,
                                                            )
                                                            setDefaultUpSize([
                                                                99, 1,
                                                            ])
                                                        }}
                                                    >
                                                        <DownOutlined />
                                                    </div>
                                                </Tooltip>
                                            </Space>
                                        </div>
                                    </div>
                                    <div className={styles.resultContent}>
                                        {getResultComponent()}
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.resultUnExpand}>
                                    <div className={styles.title}>
                                        <span className={styles.title}>
                                            {__('输出数据')}
                                        </span>
                                        <span className={styles.description}>
                                            {__(
                                                '（展示部分数据作为参考，最多不超过10条）',
                                            )}
                                        </span>
                                    </div>
                                    <div>
                                        <Tooltip
                                            placement="top"
                                            title={__('展开')}
                                        >
                                            <div
                                                className={styles.iconContent}
                                                onClick={(e) => {
                                                    setResultExpand(true)
                                                    setDefaultUpSize([40, 60])
                                                }}
                                            >
                                                <UpOutlined />
                                            </div>
                                        </Tooltip>
                                    </div>
                                </div>
                            )}
                        </DragVeticalBox>
                    </div>
                </div>
            </div>
            {showFullScreen && (
                <div className={styles.largeModeOpen}>
                    <div className={styles.titleBar}>
                        <div>
                            <span className={styles.title}>
                                {__('输出数据')}
                            </span>
                            <span className={styles.description}>
                                {__('（展示部分数据作为参考，最多不超过10条）')}
                            </span>
                        </div>
                        <div>
                            <Space size={8}>
                                <Tooltip placement="top" title={__('缩小')}>
                                    <div
                                        className={styles.iconContent}
                                        onClick={(e) => {
                                            setShowFullScreen(false)
                                        }}
                                    >
                                        <ShrinkOutlined />
                                    </div>
                                </Tooltip>
                            </Space>
                        </div>
                    </div>

                    <div className={styles.resultContent}>
                        {getResultComponent()}
                    </div>
                </div>
            )}
        </div>
    )
})

export default FilterRuleEditor
