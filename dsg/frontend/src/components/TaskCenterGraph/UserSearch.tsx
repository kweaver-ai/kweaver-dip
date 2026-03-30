import * as React from 'react'
import { useState, useEffect, ReactNode, useRef } from 'react'
import { noop } from 'lodash'
import classnames from 'classnames'
import { SearchOutlined } from '@ant-design/icons'
import { useGetState, useAsyncEffect } from 'ahooks'
import { Input, Empty, Dropdown } from 'antd'
import { AvatarOutlined } from '@/icons'
import { ExecutorInfo } from '@/core/apis/taskCenter/index.d'
import styles from './styles.module.less'
import { messageDebounce } from '@/core/graph/helper'
import { formatError, getProjectDetails } from '@/core'
import { ProjectStatus } from '../ProjectManage/types'
import { SearchInput } from '@/ui'

interface UserSearchType {
    defaultIcon?: ReactNode
    onSelect?: (userName, userInfo) => void
    userid?: string
    userName?: string
    style?: any
    projectId: string
    nodeId: string
    allUsers: Array<ExecutorInfo> | null
    status: ProjectStatus
    taskType: string
    disabled?: boolean
}

const stateNodeId: string = ''
const UserSearch = ({
    defaultIcon = <AvatarOutlined />,
    onSelect = noop,
    userid,
    style,
    projectId,
    nodeId,
    allUsers,
    status,
    userName,
    taskType,
    disabled = false,
}: UserSearchType) => {
    const [selectedUser, setSelectedUser, getSelectedUser] =
        useGetState<any>(null)
    const [totalUsers, setTotalUsers] = useState<any>(null)
    const [users, setUsers] = useState<any>(null)
    const [searchListStatus, setSearchListStatus] = useState<boolean>(false)
    const [searchText, setSearchText] = useState('')
    const [textStatus, setTextStatus] = useState<'normal' | 'hover' | 'focus'>(
        'normal',
    )

    const [searchInput, setSearchInput] = useState<string>('')
    const borders = {
        normal: '1px solid transparent',
        hover: '1px solid rgba(0,0,0,0.15)',
        focus: ' 1px solid #126EE3',
    }
    const messageDebounced = messageDebounce(3000)

    useAsyncEffect(async () => {
        // setSelectedUser(null)
        // setUsers(null)
        // setTotalUsers(null)
        if (disabled) return
        if (allUsers) {
            setTotalUsers(allUsers)
            setUsers(allUsers)
            getUsers(allUsers)
        } else {
            await getAllUser()
        }
    }, [userid, taskType, allUsers, disabled])

    const getAllUser = async () => {
        try {
            const res = await getProjectDetails(projectId)
            setUsers(res?.members || [])
            setTotalUsers(res?.members || [])
            getUsers(res?.members || [])
        } catch (e) {
            messageDebounced(() => {
                formatError(e)
            })
        }
    }
    const getUsers = (allUser: any) => {
        if (userid) {
            allUser.forEach((user) => {
                if (user.id === userid) {
                    setSelectedUser(user)
                }
            })
        } else {
            setSelectedUser(null)
        }
    }

    const handleSearch = (value) => {
        setSearchText(value)
        setUsers(
            value
                ? totalUsers?.filter((user) => RegExp(value).test(user.name))
                : totalUsers,
        )
    }

    const getUsersExistStatus = () => {
        if (totalUsers) {
            if (totalUsers.length) {
                return true
            }
            return false
        }

        return false
    }

    const getDropPanel = () => {
        return (
            <div className={styles.userDrop}>
                <div className={styles.userDropContent}>
                    {getUsersExistStatus() ? (
                        <div>
                            <div
                                style={{
                                    maxHeight: 240,
                                    overflow: 'auto',
                                    width: '200px',
                                }}
                            >
                                <div style={{ padding: '10px' }}>
                                    <SearchInput
                                        value={searchInput}
                                        onKeyChange={(kw: string) => {
                                            setSearchInput(kw)
                                            handleSearch(kw)
                                        }}
                                    />
                                </div>
                                {users && users.length ? (
                                    users.map((user, index) => {
                                        return (
                                            <div
                                                key={index}
                                                onClick={() => {
                                                    setSelectedUser(user)
                                                    setSearchListStatus(false)
                                                    onSelect(user.name, user)
                                                    setTextStatus('normal')
                                                }}
                                                className={styles.userItem}
                                            >
                                                <div className={styles.useIcon}>
                                                    <AvatarOutlined />
                                                </div>
                                                <div
                                                    className={styles.userName}
                                                    title={`${user.name}`}
                                                >
                                                    {`${user.name}`}
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <span style={{ marginLeft: '15px' }}>
                                        未找到匹配的结果
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                padding: '0 10px',
                                color: 'rgba(0,0,0,0.85)',
                            }}
                        >
                            <div>暂无数据</div>
                            <div>至「项目管理」点击【详细信息】添加成员</div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div
            className={classnames({
                [styles.userContainer]: true,
                [styles.userContainerDisabled]: disabled,
            })}
            style={{ border: borders[textStatus], ...style }}
            onFocus={() => 0}
            onBlur={() => 0}
            onMouseOver={() => {
                if (disabled) return
                if (textStatus !== 'focus') {
                    setTextStatus('hover')
                }
            }}
            onMouseLeave={() => {
                if (textStatus === 'hover') {
                    setTextStatus('normal')
                }
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {status === ProjectStatus.COMPLETED || disabled ? (
                <div style={{ width: '100%' }}>
                    <div
                        style={{
                            display: 'flex',
                        }}
                    >
                        <div className={styles.useIcon}>
                            <AvatarOutlined />
                        </div>
                        <div
                            className={styles.userName}
                            title={userName || '未分配'}
                        >
                            {userName || '未分配'}
                        </div>
                    </div>
                </div>
            ) : (
                <Dropdown
                    dropdownRender={getDropPanel}
                    open={searchListStatus}
                    trigger={['click']}
                    autoAdjustOverflow
                    getPopupContainer={(node) => node.parentNode as HTMLElement}
                    onOpenChange={() => {
                        if (searchListStatus) {
                            setSearchListStatus(false)
                            setTextStatus('normal')
                        } else {
                            setSearchInput('')
                            handleSearch('')
                            setTextStatus('focus')
                            setSearchListStatus(true)
                        }
                    }}
                >
                    <div style={{ width: '100%' }}>
                        <div
                            style={{
                                display: 'flex',
                            }}
                        >
                            <div className={styles.useIcon}>
                                <AvatarOutlined />
                            </div>
                            <div
                                className={styles.userName}
                                title={
                                    getSelectedUser()
                                        ? `${getSelectedUser().name}`
                                        : '未分配'
                                }
                            >
                                {getSelectedUser()
                                    ? `${getSelectedUser().name}`
                                    : '未分配'}
                            </div>
                        </div>
                    </div>
                </Dropdown>
            )}
        </div>
    )
}

export default UserSearch
