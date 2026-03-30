import * as React from 'react'
import { useState, useEffect } from 'react'
import { Button, Dropdown, MenuProps, Tooltip } from 'antd'
import { CaretDownOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import CommonIcon from '@/components/CommonIcon'
import { ReactComponent as createTask } from '@/icons/svg/outlined/createTask.svg'
import __ from './locale'
import { createTypeText } from './helper'

interface ICreateTaskSelect extends React.HTMLAttributes<HTMLDivElement> {
    taskItems: string[]
    disabled?: boolean
    onSelected: (type: string) => void
    title?: string
    btnText?: string
}

const CreateTaskSelect = ({
    taskItems,
    disabled = false,
    onSelected,
    title,
    btnText,
    ...props
}: ICreateTaskSelect) => {
    const [options, setOptions] = useState<MenuProps['items']>([])

    useEffect(() => {
        setOptions(
            taskItems.map((t) => ({
                key: t,
                label: createTypeText[t],
            })),
        )
    }, [taskItems])

    return (
        <div className={styles.createTaskSelectWrapper} {...props}>
            {taskItems.length > 1 ? (
                <Dropdown
                    menu={{
                        items: options,
                        onClick: ({ key, domEvent }) => {
                            domEvent.stopPropagation()
                            onSelected(key)
                        },
                    }}
                    placement="bottomLeft"
                    disabled={disabled}
                >
                    <Button icon={<CommonIcon icon={createTask} />}>
                        {btnText || __('新建任务')}
                        <CaretDownOutlined />
                        {/* <PullDownOutlined style={{ fontSize: 12 }} /> */}
                    </Button>
                </Dropdown>
            ) : (
                <Tooltip
                    title={title || createTypeText[taskItems[0]] + __('任务')}
                    placement="bottom"
                >
                    <Button
                        icon={<CommonIcon icon={createTask} />}
                        onClick={() => onSelected(taskItems[0])}
                        disabled={disabled}
                    >
                        {btnText || __('新建任务')}
                    </Button>
                </Tooltip>
            )}
        </div>
    )
}

export default CreateTaskSelect
