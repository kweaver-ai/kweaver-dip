import { Select, SelectProps } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { formatError } from '@/core'
import __ from '../locale'

interface IReqDataSelectProps extends SelectProps {
    params?: any
    value?: any
    req: any
    optionKeys?: { labelKey: string; valueKey: string }
    disabled?: boolean
    onChange?: (value: any, selItem?: any) => void
}

/** 运营工程师选择 */
function ReqDataSelect({
    req,
    params,
    placeholder = __('请选择'),
    value,
    optionKeys = {
        labelKey: 'name',
        valueKey: 'id',
    },
    disabled,
    onChange,
    ...resProps
}: IReqDataSelectProps) {
    const [data, setData] = useState<any[]>()

    const getData = async () => {
        try {
            const res = await req?.({
                offset: 1,
                limit: 200,
                ...(params || {}),
            })
            setData(res?.entries ?? [])
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (params === undefined) return
        getData()
    }, [JSON.stringify(params || {})])

    const options = useMemo(
        () =>
            data?.map((o) => ({
                label: o[optionKeys.labelKey],
                value: o[optionKeys.valueKey],
            })),
        [data],
    )

    return (
        <Select
            showSearch
            labelInValue
            value={value}
            placeholder={placeholder}
            options={options}
            disabled={disabled}
            optionFilterProp="children"
            filterOption={(input, option) =>
                `${option?.label ?? ''}`.includes(input)
            }
            filterSort={(optionA: any, optionB) =>
                `${optionA?.label ?? ''}`
                    .toLowerCase()
                    ?.localeCompare(
                        (optionB?.label ?? '')?.toString()?.toLowerCase(),
                    )
            }
            onChange={(v) => {
                onChange?.(
                    v,
                    data?.find((o) => o[optionKeys.valueKey] === v?.value),
                )
            }}
            {...resProps}
        />
    )
}

export default ReqDataSelect
