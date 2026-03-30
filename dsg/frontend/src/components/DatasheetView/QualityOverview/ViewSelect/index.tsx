import { CSSProperties } from 'react'
import ScrollLoadSelect from '@/components/ScrollLoadSelect'
import { formatError, getFormViewExploreReports } from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import styles from './styles.module.less'

export const RenderViewItem = (option: any) => {
    return (
        <div className={styles['view-item']} key={option?.form_view_id}>
            <FontIcon
                name="icon-shitusuanzi"
                type={IconType.COLOREDICON}
                style={{ fontSize: 16 }}
            />
            <span
                title={option?.business_name}
                className={styles['view-item-name']}
            >
                {option?.business_name || '--'}
            </span>
        </div>
    )
}

/** 库表选择 */
function ViewSelect({
    placeholder,
    onChange,
    value,
    disabled,
    popupContainer = true,
    departmentId,
    style,
}: {
    placeholder?: string
    onChange?: (value) => void
    value?: any
    disabled?: boolean
    popupContainer?: boolean
    departmentId?: string
    style?: CSSProperties
}) {
    const getData = async (params: any) => {
        try {
            const res = await getFormViewExploreReports({
                offset: params.offset || 0,
                limit: params.limit || 20,
                keyword: params.keyword || '',
                department_id: departmentId || '',
            })
            return res?.entries || []
        } catch (error) {
            formatError(error)
            return []
        }
    }

    const handleChange = (v, opt) => {
        const it = {
            ...v,
            label: opt?.name,
        }
        onChange?.(it)
    }

    return (
        <ScrollLoadSelect
            labelInValue
            optionLabelProp="label"
            showSearch
            value={value}
            placeholder={placeholder}
            fetchOptions={getData}
            fieldValueKey="form_view_id"
            fieldNameKey="business_name"
            limit={20}
            disableDetailFetch
            disabled={disabled}
            onChange={handleChange}
            getPopupContainer={(node) =>
                popupContainer ? node.parentNode : document.body
            }
            renderOption={(option) => RenderViewItem(option)}
            style={style}
        />
    )
}

export default ViewSelect
