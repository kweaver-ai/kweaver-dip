import { FC, ReactNode, useEffect, useState } from 'react'
import { Select } from 'antd'
import { noop } from 'lodash'
import {
    formatError,
    getUserListByPermission,
    getUsersFrontendList,
    permissionMap,
    userInfo,
} from '@/core'
import { AvatarOutlined } from '@/icons'
import { ownerRoleId } from '../BusinessDomain/const'
import __ from './locale'
import styles from './styles.module.less'

interface ISelectDataOwner {
    // 当前选中的数据owner
    value?: string | string[]
    // 数据owner发生切换
    onChange?: (value: string | string[]) => void

    // 当前关联的主题域的数据Owner
    associateOwnerId?: string

    // 初始化报错
    onInitDataError?: (value: Error) => void

    allowClear?: boolean

    width?: string | number
    // 禁用状态
    disabled?: boolean
    // 是否多选
    mode?: 'multiple' | 'tags' | undefined
    perm?: string // 所属模块权限
}
const SelectDataOwner: FC<ISelectDataOwner> = ({
    value,
    onChange = noop,
    associateOwnerId,
    onInitDataError = noop,
    allowClear = false,
    width,
    disabled = false,
    mode,
    perm = 'all',
}) => {
    // 搜索关键字
    const [searchKey, setSearchKey] = useState('')

    // 数据Owner可选用户
    const [members, setMembers] = useState<
        Array<{
            label: ReactNode | string
            value: string
            name: string
        }>
    >([])

    useEffect(() => {
        getAllOwnerUsers()
    }, [])

    useEffect(() => {
        const firstMembers = members.filter(
            (member) => member.value === associateOwnerId,
        )
        const oterMembers = members.filter(
            (member) => member.value !== associateOwnerId,
        )
        const reMembers = [...firstMembers, ...oterMembers]
        setMembers(
            reMembers.map((member) =>
                member.value === associateOwnerId
                    ? {
                          ...member,
                          label: (
                              <div className={styles.ownerItem}>
                                  {mode !== 'multiple' && (
                                      <div className={styles.avatarWrapper}>
                                          <AvatarOutlined />
                                      </div>
                                  )}
                                  <div
                                      className={styles.ownerName}
                                      title={member.name}
                                  >
                                      {member.name}
                                      <span className={styles.associateTip}>
                                          {__('（所属主题的数据Owner） ')}
                                      </span>
                                  </div>
                              </div>
                          ),
                      }
                    : {
                          ...member,
                          label: (
                              <div className={styles.ownerItem}>
                                  {mode !== 'multiple' && (
                                      <div className={styles.avatarWrapper}>
                                          <AvatarOutlined />
                                      </div>
                                  )}
                                  <div
                                      className={styles.ownerName}
                                      title={member.name}
                                  >
                                      {member.name}
                                  </div>
                              </div>
                          ),
                      },
            ),
        )
    }, [associateOwnerId])

    useEffect(() => {
        // 用户是否被删除的检查
        if (members.length) {
            if (value) {
                const values = Array.isArray(value) ? value : [value]
                const defaultUsers = values
                    .map((v) => members.find((member) => member.value === v))
                    .filter(Boolean)

                // 如果存在失效的数据owner，自动移除
                if (defaultUsers.length !== values.length) {
                    // 如果还有有效的owner，则更新为有效值
                    if (defaultUsers.length > 0) {
                        const validValues = defaultUsers.map(
                            (user) => (user as { value: string }).value,
                        )
                        onChange?.(
                            mode === 'multiple' ? validValues : validValues[0],
                        )
                    } else {
                        // 如果全部失效，则清空选择并显示错误提示
                        onInitDataError(
                            new Error(__('数据Owner已不存在，请重新选择')),
                        )
                        // 延迟清空选择，避免显示空标签
                        setTimeout(() => {
                            onChange?.(mode === 'multiple' ? [] : undefined)
                        }, 0)
                    }
                }
            }
        }
    }, [value, members])

    // 获取所有数据owner用户
    const getAllOwnerUsers = async () => {
        try {
            let res
            if (perm === 'all') {
                res = await getUsersFrontendList()
            } else {
                res = await getUserListByPermission({
                    permission_ids: perm ? [permissionMap[perm].id] : [],
                })
            }
            const users =
                res?.entries?.filter((user) => user.login_name !== 'admin') ||
                []
            if (value) {
                const defaultUser = users.map((member) => {
                    return member.id === value
                })
                if (!defaultUser) {
                    onInitDataError(__('数据Owner已不存在，请重新选择'))
                }
            }
            setMembers(
                users.map((member) => {
                    if (associateOwnerId && associateOwnerId === member.id) {
                        return {
                            value: member.id,
                            label: (
                                <div className={styles.ownerItem}>
                                    {mode !== 'multiple' && (
                                        <div className={styles.avatarWrapper}>
                                            <AvatarOutlined />
                                        </div>
                                    )}
                                    <div
                                        className={styles.ownerName}
                                        title={member.name}
                                    >
                                        {member.name}
                                        <span className={styles.associateTip}>
                                            {__('（所属主题的数据Owner） ')}
                                        </span>
                                    </div>
                                </div>
                            ),
                            name: member.name,
                        }
                    }
                    return {
                        value: member.id,
                        label: (
                            <div className={styles.ownerItem}>
                                {mode !== 'multiple' && (
                                    <div className={styles.avatarWrapper}>
                                        <AvatarOutlined />
                                    </div>
                                )}
                                <div
                                    className={styles.ownerName}
                                    title={member.name}
                                >
                                    {member.name}
                                </div>
                            </div>
                        ),
                        name: member.name,
                    }
                }) || [],
            )
        } catch (error) {
            setMembers([])
            formatError(error)
        }
    }

    /**
     * 搜索过滤数据Owner
     * @param inputValue 关键字
     * @param option 操作项
     * @returns
     */
    const filterOwner = (inputValue: string, option) => {
        const res = members
            .filter(
                (m) =>
                    m.name &&
                    m.name
                        .toLowerCase()
                        .includes(inputValue.trim().toLowerCase()),
            )
            .filter((m) => m.value === option?.value)
        return res.length > 0
    }

    return (
        <Select
            placeholder={__('请选择数据Owner')}
            searchValue={searchKey}
            options={members}
            showSearch
            allowClear={allowClear}
            disabled={disabled}
            optionFilterProp="children"
            filterOption={filterOwner}
            onSearch={(inputValue) =>
                setSearchKey(inputValue.substring(0, 128))
            }
            onDropdownVisibleChange={(state) => {
                if (!state) {
                    setSearchKey('')
                }
            }}
            value={value}
            onChange={onChange}
            getPopupContainer={(node) => node.parentNode}
            notFoundContent={
                <div className={styles.notFoundContent}>
                    {searchKey ? __('未找到匹配的结果') : __('暂无数据')}
                </div>
            }
            style={{ width }}
            mode={mode}
        />
    )
}

export default SelectDataOwner
