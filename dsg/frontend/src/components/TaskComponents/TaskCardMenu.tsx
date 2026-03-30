import * as React from 'react'
import { Dropdown } from 'antd'
import { EllipsisOutlined } from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface TaskCardMenuType {
    status: string
    isLoseEfficacy?: boolean
    onTriggerEdit: () => void
    onTriggerView: () => void
    onTriggerDelete: () => void
}

const TaskCardMenu = ({
    status,
    isLoseEfficacy = false,
    onTriggerEdit,
    onTriggerView,
    onTriggerDelete,
}: TaskCardMenuType) => {
    const { checkPermission } = useUserPermCtx()
    // 菜单项
    const getItems = () => {
        const menus = checkPermission('manageDataOperationProject')
            ? [
                  {
                      key: 'edit',
                      label: __('编辑详情'),
                      disabled: status === 'completed' || isLoseEfficacy,
                  },
                  {
                      key: 'delete',
                      label: __('删除'),
                      disabled: status === 'completed',
                  },
              ]
            : []
        // 过滤权限操作
        return menus
    }

    const optionTask = (key: string) => {
        switch (true) {
            case key === 'view':
                onTriggerView()
                break
            case key === 'edit':
                onTriggerEdit()
                break
            case key === 'delete':
                onTriggerDelete()
                break
            default:
                break
        }
    }
    return getItems().length > 0 ? (
        <Dropdown
            overlayStyle={{ width: 80 }}
            menu={{
                items: getItems(),
                onClick: ({ key, domEvent }) => {
                    domEvent.stopPropagation()
                    optionTask(key)
                },
            }}
            trigger={['click']}
        >
            <div className={styles.taskMenu}>
                <EllipsisOutlined />
            </div>
        </Dropdown>
    ) : null
}

export default TaskCardMenu
