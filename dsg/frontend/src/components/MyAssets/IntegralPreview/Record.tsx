import { useEffect, useRef, useState } from 'react'
import { Button, message, Table, Tooltip } from 'antd'
import {
    CheckOutlined,
    InfoCircleOutlined,
    LeftOutlined,
    RightOutlined,
} from '@ant-design/icons'
import classnames from 'classnames'
import { useDebounce, useSize } from 'ahooks'
import moment from 'moment'
import __ from '../locale'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import IntegralTypeIcon from '@/components/IntegralConfig/IntegralTypeIcon'
import { Empty } from '@/ui'
import empty from '@/assets/dataEmpty.svg'
import {
    IntegralIdMap,
    IntegralTypeMap,
} from '@/components/IntegralConfig/const'
import {
    businessModuleDisplay,
    integralConditionDisplay,
} from '@/components/IntegralConfig/helper'
import {
    downloadIntegralRecord,
    formatError,
    getIntegralList,
    getIntegralRecord,
} from '@/core'
import { streamToFile } from '@/utils'

const Record = () => {
    // 当前选中的积分记录
    const [selectedRecord, setSelectedRecord] = useState<any>()
    // 积分记录数据
    const [recordData, setRecordData] = useState<Array<any>>([])
    // 积分记录表格数据
    const [dataSource, setDataSource] = useState<Array<any>>([])

    // 积分记录总数
    const [total, setTotal] = useState(0)

    // 积分记录计数容器
    const countContainer = useRef<HTMLDivElement>(null)

    // 积分记录计数容器大小
    const containerSize = useSize(countContainer.current)
    // 积分记录计数容器宽度
    const widthDebounce = useDebounce(containerSize?.width, { wait: 500 })

    // 积分记录表格数据
    const [loadRecordData, setLoadRecordData] = useState<Array<Array<any>>>([])

    const [recordDataOffset, setRecordDataOffset] = useState(0)

    const [searchCondition, setSearchCondition] = useState({
        offset: 1,
        limit: 10,
    })

    useEffect(() => {
        getRecordData()
    }, [])
    useEffect(() => {
        if (selectedRecord) {
            getRecordListData(selectedRecord)
        }
    }, [selectedRecord])

    /**
     * 获取积分记录
     */
    const getRecordData = async () => {
        try {
            const data = await getIntegralRecord()
            setRecordData(data)
            setSelectedRecord(data[0])
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 获取积分记录
     */
    const getRecordListData = async (recordItem: any) => {
        try {
            const data = await getIntegralList({
                id: recordItem.id,
                is_department: recordItem.name !== '个人积分',
            })
            setDataSource(
                data?.entries?.map((item) => ({
                    ...item,
                    ...IntegralIdMap[item.strategy_code],
                })),
            )
        } catch (err) {
            formatError(err)
        }
    }

    useEffect(() => {
        if (widthDebounce) {
            const displayCount =
                Math.ceil(widthDebounce / 240) > 6
                    ? Math.ceil(widthDebounce / 240)
                    : 6
            const chunkedRecordData = Array.from(
                { length: Math.ceil(recordData.length / displayCount) },
                (_, index) =>
                    recordData.slice(
                        index * displayCount,
                        (index + 1) * displayCount,
                    ),
            )
            setLoadRecordData(chunkedRecordData)

            if (displayCount * recordDataOffset >= recordData?.length) {
                setRecordDataOffset(recordDataOffset - 1)
            }
        }
    }, [widthDebounce, recordData])

    const columns = [
        {
            title: __('积分类型'),
            key: 'type',
            dataIndex: 'type',
            ellipsis: true,
            width: 120,
            render: (value, record) => (
                <div className={styles.tableIntegralConfig}>
                    <IntegralTypeIcon
                        type={IntegralIdMap[record.strategy_code].type}
                        style={{ fontSize: 20 }}
                    />
                    {IntegralTypeMap[IntegralIdMap[record.strategy_code].type]}
                </div>
            ),
        },
        {
            title: __('业务模块'),
            key: 'module',
            dataIndex: 'module',
            ellipsis: true,
            width: 120,
            render: (value, record) =>
                businessModuleDisplay(
                    IntegralIdMap[record.strategy_code].business_module,
                ) || '',
        },
        {
            title: __('获得积分对象'),
            key: 'strategy_object_name',
            dataIndex: 'strategy_object_name',
            ellipsis: true,
            width: 120,
            render: (value, record) => value || '--',
        },
        {
            title: __('获取积分条件'),
            key: 'integral_condition',
            dataIndex: 'integral_condition',
            ellipsis: true,
            width: 180,
            render: (value, record) =>
                integralConditionDisplay(
                    IntegralIdMap[record.strategy_code].integral_condition,
                ) || '',
        },
        {
            title: __('积分变化'),
            key: 'points',
            dataIndex: 'points',
            ellipsis: true,
            width: 180,
            render: (value, record) =>
                __('+${value} 分', {
                    value: value.toString(),
                }),
        },
        {
            title: __('获取积分时间'),
            key: 'update_at',
            dataIndex: 'update_at',
            ellipsis: true,
            width: 200,
            render: (value, record) =>
                moment(value).format('YYYY-MM-DD HH:mm:ss') || '',
        },
    ]

    /**
     * 分页
     * @param page 页码
     * @param pageSize 页大小
     */
    const pageChange = (page, pageSize) => {
        setSearchCondition({
            offset: page,
            limit: pageSize,
        })
    }

    /**
     * 下载积分记录
     */
    const handleDownloadIntegralRecord = async () => {
        try {
            const res = await downloadIntegralRecord({
                id: selectedRecord.id,
                is_department: selectedRecord.name !== '个人积分',
            })
            streamToFile(
                res,
                `${selectedRecord.name}积分记录${moment().format(
                    'YYYYMMDD',
                )}.xlsx`,
            )
            message.success(__('下载积分记录成功'))
        } catch (err) {
            formatError(err)
        }
    }
    return (
        <div className={styles.recordWrapper}>
            <div className={styles.recordCountWrapper} ref={countContainer}>
                {loadRecordData[recordDataOffset]?.map((item, index) => (
                    <div
                        key={index}
                        className={classnames(
                            styles.recordCountItem,
                            selectedRecord?.id === item.id &&
                                styles.selectedRuleItem,
                        )}
                        onClick={() => setSelectedRecord(item)}
                    >
                        <div className={styles.nameWrapper}>
                            <FontIcon
                                name={
                                    item.name === '个人积分'
                                        ? 'icon-geren1'
                                        : 'icon-bumen'
                                }
                                className={styles.icon}
                            />
                            <div className={styles.integralInfo}>
                                <div
                                    className={styles.name}
                                    title={
                                        item.name === '个人积分'
                                            ? ''
                                            : item.name
                                    }
                                >
                                    {item.name === '个人积分'
                                        ? __('个人积分')
                                        : item.name}
                                </div>
                                <div className={styles.integralWrapper}>
                                    <span className={styles.integral}>
                                        {item.score?.toString()}
                                    </span>
                                    <span className={styles.unit}>
                                        {__('分')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {selectedRecord.id === item.id && (
                            <div className={styles.selectedIcon}>
                                <CheckOutlined />
                            </div>
                        )}
                    </div>
                ))}
                {recordDataOffset > 0 && (
                    <div
                        className={styles.leftArrow}
                        onClick={() =>
                            setRecordDataOffset(
                                recordDataOffset === 0
                                    ? 0
                                    : recordDataOffset - 1,
                            )
                        }
                    >
                        <LeftOutlined />
                    </div>
                )}
                {loadRecordData.length - 1 > recordDataOffset && (
                    <div
                        className={styles.rightArrow}
                        onClick={() =>
                            setRecordDataOffset(
                                recordDataOffset === loadRecordData.length - 1
                                    ? loadRecordData.length - 1
                                    : recordDataOffset + 1,
                            )
                        }
                    >
                        <RightOutlined />
                    </div>
                )}
            </div>

            <div className={styles.tableTitleWrapper}>
                <span className={styles.titleText}>{__('个人积分')}</span>
                <div className={styles.downloadWrapper}>
                    <Button
                        type="link"
                        onClick={() => {
                            handleDownloadIntegralRecord()
                        }}
                    >
                        {__('下载积分记录')}
                    </Button>
                    <Tooltip
                        title={__('可下载最近的1000条数据')}
                        overlayInnerStyle={{
                            color: '#000',
                        }}
                        color="#fff"
                        placement="bottomRight"
                        arrowPointAtCenter
                    >
                        <InfoCircleOutlined className={styles.icon} />
                    </Tooltip>
                </div>
            </div>
            <div className={styles.tableWrapper}>
                {dataSource.length > 0 ? (
                    <Table
                        columns={columns}
                        dataSource={dataSource}
                        // pagination={{
                        //     total,
                        //     onChange: pageChange,
                        //     current: searchCondition.offset,
                        //     pageSize: searchCondition.limit,
                        //     pageSizeOptions: [10, 20, 50, 100],
                        //     showQuickJumper: true,
                        //     responsive: true,
                        //     showLessItems: true,
                        //     showSizeChanger: true,
                        //     hideOnSinglePage: total <= 10,
                        //     showTotal: (count) => {
                        //         return `共 ${count} 条记录 第 ${
                        //             searchCondition.offset
                        //         }/${Math.ceil(
                        //             count / searchCondition.limit,
                        //         )} 页`
                        //     },
                        // }}
                        scroll={{
                            y: 'calc(100vh - 334px)',
                        }}
                        pagination={false}
                    />
                ) : (
                    <Empty iconSrc={empty} desc={__('暂无数据')} />
                )}
            </div>
        </div>
    )
}

export default Record
