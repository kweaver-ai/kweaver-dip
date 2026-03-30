import { Select } from 'antd'
import { FC, useEffect, useState } from 'react'
import { noop } from 'lodash'
import { formatError, ISystemItem, reqInfoSystemList } from '@/core'
import __ from './locale'

interface ISystemSelectProps {
    onChange?: (value: string) => void
    value?: string
    placeholder?: string
    onInitDataError?: (ex: any) => void
}
const SystemSelect: FC<ISystemSelectProps> = ({
    onChange = noop,
    value,
    placeholder = __('请选择'),
    onInitDataError = noop,
}) => {
    const [systemList, setSystemList] = useState<ISystemItem[]>([])

    useEffect(() => {
        getSystems()
    }, [])

    useEffect(() => {
        if (systemList.length && value) {
            const system = systemList.find((it) => it.id === value)
            if (!system) {
                onInitDataError({
                    message: __('所属信息系统不存在'),
                })
            }
        }
    }, [systemList, value])

    const getSystems = async () => {
        try {
            const res = await reqInfoSystemList({
                limit: 2000,
                offset: 1,
            })

            setSystemList(res.entries || [])
        } catch (error) {
            formatError(error)
        }
    }
    return (
        <Select
            options={systemList}
            showSearch
            fieldNames={{
                label: 'name',
                value: 'id',
            }}
            filterOption={(input, option) =>
                (option?.name ?? '').toLowerCase().includes(input.toLowerCase())
            }
            value={value || undefined}
            placeholder={placeholder}
            allowClear
            onChange={onChange}
        />
    )
}

export default SystemSelect
