import { Button, Space, Table, Tooltip } from 'antd'
import { useEffect, useState } from 'react'

import { ExclamationCircleFilled } from '@ant-design/icons'
import moment from 'moment'
import empty from '@/assets/dataEmpty.svg'
import {
    createPointsStrategy,
    deletePointsStrategy,
    formatError,
    getPointsStrategyList,
    updatePointsStrategy,
} from '@/core'
import { AddOutlined } from '@/icons'
import { Empty } from '@/ui'
import { confirm } from '@/utils/modalHelper'
import { RefreshBtn } from '../ToolbarComponents'
import AddIntegralRule from './AddIntegralRule'
import EditIntegralRule from './EditIntegralRule'
import IntegralTypeIcon from './IntegralTypeIcon'
import { getIdByIntegralConfig, IntegralIdMap, IntegralTypeMap } from './const'
import {
    businessModuleDisplay,
    integralConditionDisplay,
    integralObjectDisplay,
    ruleValidityDisplay,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'

const IntegralConfig = () => {
    const [dataSource, setDataSource] = useState<any[]>([])

    // 是否显示添加积分规则弹窗
    const [showAddModal, setShowAddModal] = useState(false)
    // 是否显示编辑积分规则弹窗
    const [showEditModal, setShowEditModal] = useState(false)
    // 编辑积分规则数据
    const [editData, setEditData] = useState<any>({})

    useEffect(() => {
        handleGetList()
    }, [])

    /**
     * 删除积分规则
     * @param index 积分规则索引
     */
    const handleDelete = async (code: string) => {
        try {
            //  调用积分策略接口
            await deletePointsStrategy(code)
            const newDataSource = dataSource.filter(
                (item, i) => item.strategy_code !== code,
            )
            setDataSource(newDataSource)
        } catch (err) {
            formatError(err)
        }
    }
    /**
     * 获取积分策略列表
     */
    const handleGetList = async () => {
        try {
            const res = await getPointsStrategyList()
            setDataSource(
                res.entries.map((item) => ({
                    ...item,
                    ...IntegralIdMap[item.strategy_code],
                })),
            )
        } catch (err) {
            formatError(err)
        }
    }

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
            key: 'business_module',
            dataIndex: 'business_module',
            ellipsis: true,
            width: 150,
            render: (value, record) =>
                businessModuleDisplay(
                    IntegralIdMap[record.strategy_code].business_module,
                ) || '',
        },
        {
            title: __('积分对象'),
            key: 'integral_object',
            dataIndex: 'integral_object',
            ellipsis: true,
            width: 150,
            render: (value, record) =>
                integralObjectDisplay(
                    IntegralIdMap[record.strategy_code].integral_object,
                ) || '',
        },
        {
            title: __('获取积分条件'),
            key: 'integral_condition',
            dataIndex: 'integral_condition',
            ellipsis: true,
            width: 150,
            render: (value, record) =>
                integralConditionDisplay(
                    IntegralIdMap[record.strategy_code].integral_condition,
                ) || '',
        },
        {
            title: __('积分变化'),
            key: 'strategy_config',
            dataIndex: 'strategy_config',
            ellipsis: true,
            width: 180,
            render: (value, record) =>
                value.length > 1
                    ? value.map((item, index) => {
                          return (
                              <div key={index}>
                                  {__('打${index}星：+${item} 分', {
                                      index: index + 1,
                                      item,
                                  })}
                              </div>
                          )
                      })
                    : __('+${value} 分', { value: value[0] }),
        },
        {
            title: __('规则有效期'),
            key: 'strategy_period',
            dataIndex: 'strategy_period',
            ellipsis: true,
            width: 300,
            render: (value, record) => ruleValidityDisplay(value) || '',
        },
        {
            title: __('更新人'),
            key: 'updated_by',
            dataIndex: 'updated_by',
            ellipsis: true,
            width: 180,
            render: (value, record) => value || '',
        },
        {
            title: __('规则更新时间'),
            key: 'updated_at',
            dataIndex: 'updated_at',
            ellipsis: true,
            width: 200,
            render: (value, record) =>
                moment(value).format('YYYY-MM-DD HH:mm:ss') || '',
        },
        {
            title: __('操作'),
            key: 'action',
            width: 150,
            render: (value, record, index) => (
                <Space size={16}>
                    <Button
                        type="link"
                        onClick={async () => {
                            setShowEditModal(true)
                            setEditData({
                                ...record,
                                ...IntegralIdMap[record.strategy_code],
                            })
                        }}
                    >
                        {__('编辑')}
                    </Button>
                    <Button
                        type="link"
                        onClick={() => {
                            confirm({
                                content: __(
                                    '删除后，当前积分对象不可以再进行积分，但已获得的积分不受影响。',
                                ),
                                title: __('确定删除积分规则吗？'),
                                onOk: () => {
                                    handleDelete(record.strategy_code)
                                },
                                icon: (
                                    <ExclamationCircleFilled
                                        style={{
                                            color: 'rgba(250, 173, 20 ,1)',
                                        }}
                                    />
                                ),
                            })
                        }}
                    >
                        {__('删除')}
                    </Button>
                </Space>
            ),
        },
    ]
    return (
        <div className={styles.integralConfigWrapper}>
            <div className={styles.title}>{__('积分规则配置')}</div>
            <div className={styles.toolbar}>
                <Tooltip
                    title={
                        dataSource.length >= 7
                            ? __('无可添加的规则（全部积分规则已添加完毕）')
                            : ''
                    }
                    placement="bottom"
                    overlayStyle={{ maxWidth: 400 }}
                >
                    <Button
                        type="primary"
                        icon={<AddOutlined />}
                        onClick={() => {
                            setShowAddModal(true)
                        }}
                        disabled={dataSource.length >= 7}
                    >
                        {__('添加积分规则')}
                    </Button>
                </Tooltip>
                <RefreshBtn
                    onClick={() => {
                        handleGetList()
                    }}
                />
            </div>
            {dataSource.length > 0 ? (
                <Table
                    columns={columns}
                    dataSource={dataSource}
                    pagination={false}
                    scroll={{ x: 1000 }}
                />
            ) : (
                <Empty iconSrc={empty} desc={__('暂无数据')} />
            )}
            {showAddModal && (
                <AddIntegralRule
                    open={showAddModal}
                    onCancel={() => {
                        setShowAddModal(false)
                    }}
                    onConfirm={async (value) => {
                        try {
                            setShowAddModal(false)
                            const code = getIdByIntegralConfig(value) || ''
                            if (code) {
                                // 调用积分策略接口
                                await createPointsStrategy({
                                    strategy_code: code,
                                    strategy_config: value.strategy_config,
                                    strategy_period: value.strategy_period.map(
                                        (item) => item || -1,
                                    ),
                                })
                                await handleGetList()
                            }
                        } catch (err) {
                            formatError(err)
                        }
                    }}
                    allData={dataSource}
                />
            )}
            {showEditModal && (
                <EditIntegralRule
                    open={showEditModal}
                    onClose={() => {
                        setShowEditModal(false)
                    }}
                    data={editData}
                    onConfirm={async (value) => {
                        try {
                            // 调用积分策略接口
                            setShowEditModal(false)
                            //  调用积分策略接口
                            await updatePointsStrategy({
                                strategy_code: editData.strategy_code,
                                strategy_config: value.strategy_config,
                                strategy_period: value.strategy_period.map(
                                    (item) => item || -1,
                                ),
                            })
                            await handleGetList()
                        } catch (err) {
                            formatError(err)
                        }
                    }}
                />
            )}
        </div>
    )
}

export default IntegralConfig
