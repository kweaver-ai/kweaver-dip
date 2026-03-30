import React, {
    useEffect,
    useState,
    forwardRef,
    useImperativeHandle,
    useRef,
} from 'react'
import classnames from 'classnames'
import { Table, message, Button } from 'antd'
import { isEqual, cloneDeep, noop } from 'lodash'
import { ITableData } from './const'
import Empty from '../../ui/Empty'
import emptyAdd from '@/assets/emptyAdd.svg'
import __ from './locale'
import styles from './styles.module.less'
import { Loader } from '@/ui'
import { formatError } from '@/core'

/**
 * @param queryAction 查询请求的接口
 * @param params 查询参数
 * @param baseProps antd属性
 * @param listName 后端返回数据list字段，默认{entries: entries,total: total_count}
 * @param mockData 测试数据 无接口时,前端渲染数据
 * @param emptyDesc 无数据时显示内容
 * @param emptyIcon 无数据时显示图标
 * @param emptyExcludeField 需要排除某些字段，用于对比参数变更，判断是否显示【新建】按钮
 * @param getEmptyFlag 查询是否为空
 * @param getTableList 接口返回数据
 * @param useDefaultPageChange 是否使用组件自带分页方法，默认false，组件未添加onChange时间时，需添加此参数，否则不会查询
 */
const CommonTable: React.FC<ITableData> = forwardRef(
    (props: ITableData, ref) => {
        const {
            queryAction,
            params,
            listName,
            mockData = [],
            baseProps,
            emptyDesc,
            emptyIcon,
            emptyExcludeField = [],
            getEmptyFlag,
            onChange,
            onTableListUpdated = noop,
            getTableList,
            dataProcessor,
            emptyStyle,
            isReplace,
            scrollY,
            useDefaultPageChange = false,
        } = props

        const [tableData, setTableData] = useState<any[]>([])
        const [pageTotal, setPageTotal] = useState<number>(0)
        const [searchCondition, setSearchCondition] = useState<any>()
        const [isInitParams, setIsInitParams] = useState<boolean>(true)
        const [loading, setLoading] = useState<boolean>(true)
        const pageExcludeField = ['offset', 'limit']
        const requestIdRef = useRef<number>(0)

        // 子组件暴露查询方法
        useImperativeHandle(ref, () => ({
            getData,
            total: pageTotal,
        }))

        // 查询参数
        useEffect(() => {
            if (searchCondition) {
                getData()
            }
        }, [searchCondition])

        // 外部传入参数
        useEffect(() => {
            setSearchCondition((prev) => ({
                ...(isReplace ? {} : prev),
                ...params,
            }))
        }, [params, isReplace])
        // 查询列表
        const getData = async () => {
            const paramsCopy = cloneDeep(params || searchCondition)
            const excludeArry = [...emptyExcludeField, ...pageExcludeField]
            const { sort, direction, offset, limit, ...onlySearchParams } =
                paramsCopy
            // 删除特定字段，对比初始化查询条件，是否显示【新建】空状态提示
            excludeArry.forEach((item) => {
                delete onlySearchParams[item]
            })

            setIsInitParams(
                !Object.values(onlySearchParams).some((item) => item),
            )

            // 生成唯一请求ID，用于防止竞态条件
            requestIdRef.current += 1
            const currentRequestId = requestIdRef.current

            setLoading(true)
            try {
                const res = await queryAction({
                    ...searchCondition,
                })

                // 只有当前请求是最新的请求时才更新数据
                if (currentRequestId !== requestIdRef.current) {
                    return
                }

                const rawData = res[listName?.entries || 'entries'] || []
                // 数据预处理
                const finalData = dataProcessor
                    ? dataProcessor(rawData)
                    : rawData

                setTableData(finalData)
                setPageTotal(res[listName?.total || 'total_count'] || 0)
                getEmptyFlag?.(res[listName?.total || 'total_count'] === 0)
                setLoading(false)
                getTableList?.(res)
            } catch (error) {
                // 只有当前请求是最新的请求时才处理错误
                if (currentRequestId !== requestIdRef.current) {
                    return
                }

                setLoading(false)
                // 暂无接口时，显示模拟数据
                if (mockData.length > 0) {
                    getTableList?.(mockData)
                    setTableData(mockData)
                    setPageTotal(mockData.length)
                } else {
                    formatError(error)
                }
                getEmptyFlag?.(true)
            } finally {
                // 只有当前请求是最新的请求时才调用回调
                if (currentRequestId === requestIdRef.current) {
                    onTableListUpdated()
                }
            }
        }

        // 翻页
        const pageChange = async (offset, limit) => {
            if (!useDefaultPageChange) return
            setSearchCondition({
                ...searchCondition,
                offset,
                limit,
            })
        }

        // 空状态
        const renderEmpty = () => {
            return (
                // <div className={styles.commonTableEmptyWrap}>
                <div style={emptyStyle}>
                    <Empty
                        desc={
                            emptyDesc || (
                                <div>
                                    {__('点击')}
                                    <Button type="link">
                                        【{__('新建')}】
                                    </Button>
                                    {__('按钮可新建')}
                                </div>
                            )
                        }
                        iconSrc={emptyIcon || emptyAdd}
                    />
                </div>
            )
        }

        return loading ? (
            <Loader />
        ) : isInitParams && tableData.length === 0 ? (
            renderEmpty()
        ) : (
            <Table
                className={classnames(
                    styles.commonTableWrapper,
                    tableData.length === 0 && styles.noDataTable,
                )}
                pagination={{
                    total: pageTotal,
                    onChange: pageChange,
                    current: searchCondition.offset,
                    pageSize: searchCondition.limit,
                    pageSizeOptions: [10, 20, 50, 100],
                    showQuickJumper: true,
                    responsive: true,
                    showLessItems: true,
                    showSizeChanger: true,
                    hideOnSinglePage: pageTotal <= 10,
                    showTotal: (count) => {
                        return `共 ${count} 条记录 第 ${
                            searchCondition.offset
                        }/${Math.ceil(count / searchCondition.limit)} 页`
                    },
                }}
                locale={{
                    emptyText: <Empty />,
                }}
                rowKey="id"
                bordered={false}
                scroll={{
                    y:
                        tableData.length === 0
                            ? undefined
                            : scrollY || 'calc(100vh - 245px)',
                }}
                {...baseProps}
                dataSource={tableData}
                onChange={(pagination, filters, sorter) =>
                    onChange?.(pagination, filters, sorter)
                }
            />
        )
    },
)
export default CommonTable
