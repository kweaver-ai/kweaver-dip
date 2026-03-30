import { Tabs } from 'antd'
import React, { useMemo } from 'react'
import MyTask from './MyTask'
import ThirdPartyTask from './ThirdPartyTask'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

function Tasks() {
    const { checkPermission } = useUserPermCtx()

    const items = useMemo(() => {
        if (checkPermission('manageWorkOrderTask')) {
            return [
                {
                    label: '我的任务',
                    key: 'mine',
                    children: <MyTask />,
                },
                {
                    label: '第三方任务',
                    key: 'thirdParty',
                    children: <ThirdPartyTask />,
                },
            ]
        }
        return [
            {
                label: '我的任务',
                key: 'mine',
                children: <MyTask />,
            },
        ]
    }, [checkPermission])

    return <Tabs items={items} />
}

export default Tasks
