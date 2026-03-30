import { useMemo, useState } from 'react'
import { Space, Tabs } from 'antd'
import { OrderPolicyMap, OrderType, OrderTypeOptions } from '../helper'
import AuditTable from './AuditTable'
import { AuditType, filterItems, OrderTypes, WorkOrderAllType } from './const'
import styles from './styles.module.less'
import { LightweightSearch, SearchInput } from '@/ui'
import __ from './locale'
import { RefreshBtn } from '@/components/ToolbarComponents'

const WorkOrderAudit = ({ orderType }: { orderType?: OrderType }) => {
    const [params, setParams] = useState<any>({})
    const [activeKey, setActiveKey] = useState<string>(AuditType.Tasks)
    const showType = useMemo(() => {
        return orderType ? OrderPolicyMap[orderType] : WorkOrderAllType
    }, [orderType])

    const operations = (
        <Space size={8}>
            <SearchInput
                placeholder={
                    showType === OrderType.QUALITY
                        ? __('搜索整改单名称')
                        : __('搜索工单名称')
                }
                value={params.abstracts}
                onChange={(e) =>
                    setParams({ ...params, abstracts: e.target.value })
                }
            />
            {activeKey === AuditType.Historys && (
                <LightweightSearch
                    formData={filterItems}
                    onChange={(d, dataKey) => {
                        const dk = dataKey
                        if (dk === 'status') {
                            setParams({
                                ...params,
                                status: d[dk],
                            })
                        } else {
                            setParams({
                                ...params,
                                status: undefined,
                            })
                        }
                    }}
                    defaultValue={{
                        status: undefined,
                    }}
                />
            )}
            <RefreshBtn
                onClick={() =>
                    setParams({
                        ...params,
                    })
                }
            />
        </Space>
    )

    /** 审核类型 */
    const auditItems = [
        {
            key: AuditType.Tasks,
            label: __('待审核'),
        },
        {
            key: AuditType.Historys,
            label: __('已审核'),
        },
    ]

    return (
        <div className={styles['work-order-audit']}>
            <div className={styles.top}>
                <div className={styles.auditTitle}>
                    {__('${type}审核', {
                        type: orderType
                            ? OrderTypes.find(
                                  (oItem) =>
                                      oItem.value ===
                                      Object.keys(OrderPolicyMap)?.find(
                                          (oType) =>
                                              OrderPolicyMap[oType] ===
                                              showType,
                                      ),
                              )?.label
                            : __('工单'),
                    })}
                </div>
            </div>
            <Tabs
                activeKey={activeKey}
                onChange={(key) => {
                    setActiveKey(key)
                }}
                tabBarExtraContent={operations}
                items={auditItems}
            />

            <AuditTable
                type={showType}
                target={activeKey as AuditType}
                queryParams={params}
            />
        </div>
    )
}

export default WorkOrderAudit
