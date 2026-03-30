import { formatError, getUserList } from '@/core'
import ScrollLoadSelect from '../ScrollLoadSelect'

/** 负责人选择 */
function ResponsibleSelect({
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
    // 工单责任人可选范围是部署控制台的所有用户
    const getAllUser = async (params: any) => {
        try {
            const res = await getUserList({
                offset: params.offset || 0,
                limit: params.limit || 20,
                keyword: params.keyword || '',
                is_include_unassigned_roles: true,
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
            value={value}
            placeholder={placeholder}
            fetchOptions={getAllUser}
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

export default ResponsibleSelect
