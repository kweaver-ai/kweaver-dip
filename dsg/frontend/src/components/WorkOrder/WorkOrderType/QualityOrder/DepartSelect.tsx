import { memo } from 'react'
import ScrollLoadSelect from '@/components/ScrollLoadSelect'
import { formatError, getObjects } from '@/core'

/** 仅部门选择 */
function DepartSelect({
    placeholder,
    onChange,
    value,
    disabled,
    popupContainer = true,
}: {
    placeholder?: string
    onChange?: (value) => void
    value?: any
    disabled?: boolean
    popupContainer?: boolean
}) {
    const getAllDepart = async (params: any) => {
        try {
            const res = await getObjects({
                offset: params.offset || 0,
                limit: params.limit || 20,
                keyword: params.keyword || '',
                is_all: true,
                type: 'department',
            })
            return res?.entries || []
        } catch (error) {
            formatError(error)
            return []
        }
    }

    return (
        <ScrollLoadSelect
            labelInValue
            showSearch
            allowClear
            value={value}
            placeholder={placeholder}
            fetchOptions={getAllDepart}
            fieldValueKey="id"
            fieldNameKey="name"
            limit={20}
            disableDetailFetch
            disabled={disabled}
            onChange={(v) => onChange?.(v)}
            getPopupContainer={(node) =>
                popupContainer ? node.parentNode : document.body
            }
        />
    )
}
export default memo(DepartSelect)
