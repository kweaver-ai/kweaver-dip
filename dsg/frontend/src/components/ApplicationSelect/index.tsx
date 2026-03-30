import { Select } from 'antd'
import { FC, useEffect, useState } from 'react'
import { noop } from 'lodash'
import __ from './locale'
import { formatError, getAppRegisterList, IAppRegisterListItem } from '@/core'

interface IApplicationSelectProps {
    onChange?: (value: string) => void
    value?: string
    placeholder?: string
    infoSystemId?: string
    onInitDataError?: (ex: any) => void
}
const ApplicationSelect: FC<IApplicationSelectProps> = ({
    onChange = noop,
    value,
    placeholder = __('请选择'),
    infoSystemId = '',
    onInitDataError = noop,
}) => {
    const [appList, setAppList] = useState<IAppRegisterListItem[]>([])

    const [listInit, setListInit] = useState(false)

    useEffect(() => {
        if (infoSystemId) {
            getApps()
        }
    }, [infoSystemId])

    useEffect(() => {
        if (value && listInit) {
            const app = appList?.find((it) => it.id === value)
            if (!app) {
                onInitDataError({
                    message: __('所属应用不存在或关联关系不存在'),
                })
            }
        }
    }, [appList, value, listInit])

    const getApps = async () => {
        try {
            const res = await getAppRegisterList({
                limit: 2000,
                offset: 1,
                info_system_id: infoSystemId,
            })
            setAppList(res.entries || [])
        } catch (error) {
            formatError(error)
        } finally {
            setListInit(true)
        }
    }

    return (
        <Select
            options={appList}
            showSearch
            filterOption={(input, option) =>
                (option?.name ?? '').toLowerCase().includes(input.toLowerCase())
            }
            fieldNames={{
                label: 'name',
                value: 'id',
            }}
            placeholder={placeholder}
            value={value || undefined}
            allowClear
            onChange={onChange}
        />
    )
}

export default ApplicationSelect
