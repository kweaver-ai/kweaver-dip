import { ConfigProvider, Select } from 'antd'
import { memo, useContext, useEffect, useState } from 'react'
import { formatError, getUserByDepartId } from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { FontIcon } from '@/icons'
import { EllipsisMiddle } from '@/ui'
import styles from './styles.module.less'

/** 同部门负责人选择 */
function DepartResponsibleSelect({
    placeholder,
    onChange,
    value,
    disabled,
}: {
    placeholder?: string
    onChange?: (value) => void
    value?: any
    disabled?: boolean
}) {
    const { getPopupContainer } = useContext(ConfigProvider.ConfigContext)
    const [departs] = useCurrentUser('ParentDeps')
    const [loading, setLoading] = useState(false)
    const [options, setOptions] = useState<any[]>([])
    useEffect(() => {
        getDepartUsers()
    }, [departs])

    // 生成组织路径字符串
    const generateDepartPath = (parentDeps: any[]) => {
        if (!parentDeps || !parentDeps[0] || !Array.isArray(parentDeps[0])) {
            return ''
        }
        return parentDeps[0].map((dep) => dep.department_name).join('/')
    }

    // 处理选项数据
    const processOptions = (users: any[]) => {
        return users.map((user) => {
            const departPath = generateDepartPath(user.parent_deps)
            const fullLabel = (
                <div className={styles['opt-item']}>
                    <FontIcon
                        name="icon-yonghu"
                        className={styles['opt-item-icon']}
                    />
                    <span className={styles['opt-item-name']}>
                        {user?.name}({user?.login_name})
                    </span>
                    <span
                        className={styles['opt-item-depart']}
                        title={departPath}
                    >
                        <EllipsisMiddle>{departPath}</EllipsisMiddle>
                    </span>
                </div>
            )

            return {
                value: user.id,
                label: fullLabel,
                title: user.name,
                searchText: `${user.name} ${user.login_name}`.toLowerCase(),
            }
        })
    }

    // 工单责任人可选范围是同部门下的所有用户
    const getDepartUsers = async () => {
        try {
            setLoading(true)
            const departId = departs?.[0]?.path_id?.split('/').pop()
            const res = await getUserByDepartId({
                depart_id: departId,
                is_depart_in_need: true,
            })

            setOptions(processOptions(res || []))
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Select
            labelInValue
            showSearch
            loading={loading}
            options={options}
            value={value}
            placeholder={placeholder}
            onChange={(v) => onChange?.(v)}
            filterOption={(input, option: any) => {
                return option.searchText?.includes(input.toLowerCase()) || false
            }}
            optionLabelProp="title"
            getPopupContainer={getPopupContainer}
        />
    )
}

export default memo(DepartResponsibleSelect)
