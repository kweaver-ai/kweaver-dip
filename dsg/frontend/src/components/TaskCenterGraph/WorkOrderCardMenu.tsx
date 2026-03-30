import { Badge, Dropdown } from 'antd'
import { useMemo } from 'react'
import { EllipsisOutlined } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'
import { WorkOrderStatusEnum } from './helper'
import { AuditType, OrderType } from '../WorkOrder/helper'

interface WorkOrderCardMenuType {
    status: string
    type: string
    needSync: boolean
    audit_status: string
    onTriggerTransfer: () => void
    onTriggerDetail: () => void
    onTriggerSync: () => void
}

const WorkOrderCardMenu = ({
    status,
    type,
    audit_status,
    needSync,
    onTriggerTransfer,
    onTriggerDetail,
    onTriggerSync,
}: WorkOrderCardMenuType) => {
    // 菜单项
    const currentMenu = useMemo(() => {
        // 审核中
        const isAuditing = audit_status === AuditType.AUDITING
        // 审核通过
        const isPass = audit_status === AuditType.PASS
        // 已完成
        const isFinished = status === WorkOrderStatusEnum.COMPLETED

        const canTransfer =
            [WorkOrderStatusEnum.READY, WorkOrderStatusEnum.ONGOING].includes(
                status as any,
            ) && isPass

        const menus = [
            {
                key: 'detail',
                label: __('详情'),
                // disabled: isFinished,
                show: true,
            },
            {
                key: 'transfer',
                label: __('转派'),
                disabled: isAuditing,
                show: canTransfer,
            },
            {
                key: 'sync',
                label: (
                    <Badge dot={needSync}>
                        <span>{__('重新同步')}</span>
                    </Badge>
                ),
                disabled: status === 'completed',
                show:
                    needSync &&
                    ![
                        OrderType.COMPREHENSION,
                        OrderType.RESEARCH_REPORT,
                        OrderType.DATA_CATALOG,
                        OrderType.FRONT_PROCESSORS,
                    ].includes(type as any),
            },
        ]
        return menus.filter((item) => item.show)
    }, [status, type, needSync])

    const optionTask = (key: string) => {
        switch (true) {
            case key === 'detail':
                onTriggerDetail()
                break
            case key === 'transfer':
                onTriggerTransfer()
                break
            case key === 'sync':
                onTriggerSync()
                break
            default:
                break
        }
    }
    return (
        <Dropdown
            overlayStyle={{ width: 80 }}
            menu={{
                items: currentMenu,
                onClick: ({ key, domEvent }) => {
                    domEvent.stopPropagation()
                    optionTask(key)
                },
            }}
            trigger={['click']}
        >
            <Badge dot={needSync}>
                <div className={styles.taskMenu}>
                    <EllipsisOutlined />
                </div>
            </Badge>
        </Dropdown>
    )
}

export default WorkOrderCardMenu
