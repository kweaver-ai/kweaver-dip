import { useDebounce } from 'ahooks'
import { Badge, Button, message, Space, Tooltip } from 'antd'
import { useEffect, useMemo, useState } from 'react'

import { ExclamationCircleFilled, InfoCircleOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import dataEmpty from '@/assets/dataEmpty.svg'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import {
    allRoleList,
    createApp,
    deleteApp,
    editAppInfo,
    formatError,
    getAppsList,
} from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { AddOutlined } from '@/icons'
import { Empty, ListPagination, ListType, SearchInput } from '@/ui'
import { confirm } from '@/utils/modalHelper'
import DropDownFilter from '../../DropDownFilter'
import { RefreshBtn, SortBtn } from '../../ToolbarComponents'
import {
    defaultMenu,
    DefaultSearchQuery,
    encryptAndSerializeString,
    menus,
} from '../const'
import __ from '../locale'
import styles from '../styles.module.less'
import ApplicationCard from './ApplicationCard'
import ConfigForm from './ConfigForm'
import CopyApplicationPanel from './CopyApplicationPanel'
import ViewDetail from './ViewDetail'

/**
 * 应用程序认证组件
 *
 * 此组件用于表示应用程序的认证逻辑，具体实现为返回一个包含认证信息的div元素
 * 目前，组件直接渲染出"ApplicationAuth"字符串，实际使用时应根据认证状态展示不同的内容
 *
 * @returns {React.Element} 认证信息的渲染结果
 */
const ApplicationManage = () => {
    // 初始化查询参数，使用默认搜索查询参数
    const [queryParams, setQueryParams] = useState<any>(DefaultSearchQuery)
    // 初始化关键词状态，开始时为空字符串
    const [keyword, setKeyword] = useState<string>('')
    // 使用防抖钩子处理关键词输入，延迟500毫秒以减少频繁请求
    const debounceKeyword = useDebounce(keyword, {
        wait: 500,
    })
    // 初始化数据状态，存储搜索结果数组
    const [data, setData] = useState<Array<any>>([])
    // 初始化配置打开状态，初始为关闭
    const [openConfig, setOpenConfig] = useState<boolean>(false)
    // 初始化编辑数据状态，用于存储当前编辑的行数据
    const [editingData, setEditingData] = useState<any>()
    // 初始化复制功能打开状态，初始为关闭
    const [copyOpen, setCopyOpen] = useState<boolean>(false)
    // 初始化复制的数据状态，用于存储待复制的行数据
    const [copyDataId, setCopyDataId] = useState<string>()
    // 初始化总记录数状态，初始为0
    const [totalCount, setTotalCount] = useState<number>(0)

    // const [isSystemManager, setIsSystemManager] = useState<boolean>(false)

    // 使用useGeneralConfig钩子获取通用配置，主要包含当前使用的配置和政府模式开关
    const [{ using, governmentSwitch, local_app }] = useGeneralConfig()

    // 定义一个用于政府模式状态的变量，初始值为false，表示政府模式未开启
    const [governmentStatus, setGovernmentStatus] = useState<boolean>(false)

    const [openViewInfoId, setOpenViewInfoId] = useState<string>('')

    const [localInfo, setLocalInfo] = useState<any>({})

    const { checkPermission } = useUserPermCtx()

    const isSystemManager = useMemo(
        () => checkPermission(allRoleList.TCSystemMgm) ?? false,
        [checkPermission],
    )

    const [userInfo] = useCurrentUser()
    // 当 "using" 或 "governmentSwitch" 值改变时执行副作用
    useEffect(() => {
        // 检查 "using" 的值和 "governmentSwitch" 的状态，以确定启用政府模式
        if (using === 1 && governmentSwitch.on) {
            setGovernmentStatus(true)
        }
    }, [using, governmentSwitch])

    useEffect(() => {
        setQueryParams({
            ...queryParams,
            keyword: debounceKeyword,
        })
    }, [debounceKeyword])

    useEffect(() => {
        getListData(queryParams)
    }, [queryParams])

    /**
     * 异步获取列表数据
     *
     * 此函数通过调用getAppsList来获取应用程序列表数据它尝试执行异步操作，
     * 如果成功，将解析出entries和total_count属性如果操作失败，将调用formatError处理错误
     *
     * @param {Object} params - 传递给getAppsList函数的参数对象
     */
    const getListData = async (params) => {
        try {
            const { entries, total_count } = await getAppsList(params)
            setData(entries)
            setTotalCount(total_count)
        } catch (err) {
            formatError(err)
        }
    }
    /**
     * 处理菜单变化的回调函数
     * @param {Object} value - 菜单项的值，包含排序键和排序方式
     * @param {string} value.key - 排序键
     * @param {string} value.sort - 排序方式，如升序或降序
     *
     * 此函数用于响应菜单选项的变化，更新查询参数中的排序键和排序方式
     * 它通过解构赋值从传入的对象中获取key和sort属性，并使用这些值来更新queryParams对象
     * 这样可以确保在用户选择不同的排序选项时，能够正确地更新后端请求的参数，以反映用户的排序选择
     */
    const handleMenuChange = (value) => {
        const { key, sort } = value
        setQueryParams({
            ...queryParams,
            direction: sort,
            sort: key,
        })
    }

    // 保存数据的函数，用于处理新建或编辑数据的逻辑
    const handleSaveData = async (item) => {
        // 从传入的item中解构出rePassword和password，其余的属性作为rest
        const {
            rePassword,
            password,
            system_name,
            developer_name,
            app_area,
            app_rang,
            ...rest
        } = item

        // 如果没有正在编辑的数据（editingData为false），则表示是新建数据
        if (!editingData) {
            const currentInfo = await createApp({
                ...rest,
                // 将密码进行加密和序列化处理，以便在传输过程中保持安全
                password: password
                    ? encryptAndSerializeString(password)
                    : undefined,
                application_developer_id: userInfo?.ID || '',
            })

            setQueryParams({
                ...queryParams,
                offset: 1,
            })
            // 显示成功消息，并关闭编辑界面，打开复制确认界面
            message.success(__('应用创建成功'))
            setOpenConfig(false)
            if (currentInfo.account_id) {
                setCopyOpen(true)
                setCopyDataId(currentInfo.id)
            }

            setLocalInfo({
                password,
            })
        } else {
            // 如果正在编辑数据，则更新现有数据

            await editAppInfo(editingData.id, {
                ...rest,
                password: password
                    ? encryptAndSerializeString(password)
                    : undefined,
            })

            setQueryParams({
                ...queryParams,
                offset: 1,
            })

            // 显示成功消息，并关闭编辑界面，如果提供了新密码，打开复制确认界面
            message.success(__('编辑成功'))
            setOpenConfig(false)
            setEditingData(undefined)
            if (password) {
                setCopyOpen(true)
                setCopyDataId(editingData.id)
                setLocalInfo({
                    password,
                })
            }
        }
    }

    /**
     * 确认删除应用的对话框
     * @param {Object} deleteData 删除操作的相关数据
     * 此函数显示一个模态确认对话框，以确保用户了解删除应用的后果
     * 删除应用将清空应用账户的权限，并且已开发的应用服务将无法正常调用 OpenAPI 接口
     * 注意，删除应用并不会删除应用内的应用账户，用户需要登录部署工作台处理应用账户
     */
    const handleDeleteApplication = (deleteData) => {
        confirm({
            title: __('确认要删除应用吗？'),
            content: deleteData.account_id
                ? __(
                      '删除应用将导致应用账户的权限被清空，已开发的应用服务无法正常调用 OpenAPI 接口。',
                  )
                : __('删除后将无法恢复。'),
            okText: __('确定'),
            cancelText: __('取消'),
            icon: <ExclamationCircleFilled style={{ color: '#faac14' }} />,
            onOk: async () => {
                // 尝试删除指定的应用程序
                try {
                    await deleteApp(deleteData.id) // 调用deleteApp函数，传入要删除的应用程序的ID
                    if (data.length === 1 && queryParams.offset > 1) {
                        // 如果删除后data数组长度为1，即只有一个应用，则更新查询参数以向前移动一页
                        setQueryParams({
                            ...queryParams,
                            offset: queryParams.offset - 1,
                        })
                    } else {
                        // 否则，重新获取列表数据以保持页面更新
                        getListData(queryParams)
                    }

                    message.success(__('删除成功')) // 删除成功，显示成功消息
                } catch (err) {
                    formatError(err) // 删除失败，格式化错误信息
                }
            },
            onCancel: () => {},
        })
    }

    /**
     * 获取页面标题组件
     *
     * 此函数用于构建页面标题区域，包括主标题和一个包含详细说明的工具提示。
     * 标题部分展示了集成应用管理的主标题，而工具提示则提供了关于应用开发者权限的详细信息，
     * 包括如何使用应用账号进行认证、注册以及调用接口，并明确了应用开发者对应用所拥有的权限。
     */
    const getPageTitle = () => {
        return (
            <Space size={4}>
                <span className={styles.title}>{__('集成应用管理')}</span>
                <Tooltip
                    placement="bottomRight"
                    title={
                        <div>
                            <div style={{ fontWeight: 550 }}>
                                {__('集成应用')}
                            </div>
                            {[
                                __(
                                    '开发者使用应用账号进行认证后，可调用应用内可用资源的 OpenAPI 接口。',
                                ),
                                __(
                                    '开发者创建应用并上报成功后，可以为此应用申请省共享资源。',
                                ),
                            ].map((item, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Badge
                                        status="default"
                                        style={{ marginTop: -4 }}
                                    />
                                    <div style={{ marginLeft: 8 }}>{item}</div>
                                </div>
                            ))}
                        </div>
                    }
                    color="#fff"
                    overlayInnerStyle={{
                        color: 'rgba(0,0,0,0.85)',
                    }}
                    overlayStyle={{
                        maxWidth: 600,
                    }}
                    arrowPointAtCenter
                >
                    <InfoCircleOutlined />
                </Tooltip>
            </Space>
        )
    }

    return (
        <div className={styles.applicationContainer}>
            {getPageTitle()}

            <div className={styles.applicationContent}>
                <div className={styles.toolBar}>
                    <Button
                        type="primary"
                        icon={<AddOutlined />}
                        onClick={() => setOpenConfig(true)}
                    >
                        {__('新建应用')}
                    </Button>

                    <Space size={16}>
                        <SearchInput
                            className={styles.nameInput}
                            style={{ width: 272 }}
                            placeholder={__('搜索应用名称')}
                            onKeyChange={(kw: string) => setKeyword(kw)}
                        />

                        <Space size={0}>
                            <SortBtn
                                contentNode={
                                    <DropDownFilter
                                        menus={menus}
                                        defaultMenu={defaultMenu}
                                        menuChangeCb={handleMenuChange}
                                    />
                                }
                            />
                            <RefreshBtn
                                onClick={() => {
                                    getListData(queryParams)
                                }}
                            />
                        </Space>
                    </Space>
                </div>

                <div
                    className={classnames(
                        styles.contentWrapper,
                        totalCount > 10
                            ? styles.hasPagination
                            : styles.contentWrapperHeight,
                    )}
                >
                    {data?.length ? (
                        data.map((item) => (
                            <div className={styles.itemCard}>
                                <ApplicationCard
                                    appInfo={item}
                                    onEdit={() => {
                                        setEditingData(item)
                                        setOpenConfig(true)
                                    }}
                                    onDelete={() => {
                                        handleDeleteApplication(item)
                                    }}
                                    isSystemManger={isSystemManager}
                                    governmentStatus={governmentStatus}
                                    onOpenView={() => {
                                        setOpenViewInfoId(item.id)
                                    }}
                                    localAppSwitchStatus={local_app as any}
                                />
                            </div>
                        ))
                    ) : (
                        <div className={styles.empty}>
                            {debounceKeyword ? (
                                <Empty />
                            ) : (
                                <Empty
                                    desc={__('暂无数据')}
                                    iconSrc={dataEmpty}
                                />
                            )}
                        </div>
                    )}
                </div>
                <ListPagination
                    listType={ListType.WideList}
                    queryParams={queryParams}
                    totalCount={totalCount}
                    onChange={(offset: number, limit: number) => {
                        setQueryParams({
                            ...queryParams,
                            offset,
                            limit,
                        })
                    }}
                />
            </div>

            {openConfig && (
                <ConfigForm
                    appId={editingData?.id || ''}
                    open={openConfig}
                    accountId={editingData?.accountId}
                    onClose={() => {
                        setEditingData(undefined)
                        setOpenConfig(false)
                    }}
                    onConfirm={handleSaveData}
                    isSystemManger={isSystemManager}
                />
            )}

            {copyOpen && copyDataId && (
                <CopyApplicationPanel
                    onClose={() => {
                        setCopyOpen(false)
                        setCopyDataId('')
                    }}
                    appId={copyDataId}
                    open={copyOpen}
                    appLocalInfo={localInfo}
                />
            )}
            {openViewInfoId && (
                <ViewDetail
                    appId={openViewInfoId}
                    onClose={() => {
                        setOpenViewInfoId('')
                    }}
                    open={!!openViewInfoId}
                />
            )}
        </div>
    )
}

// 将ApplicationAuth组件导出为默认模块，便于其他组件引用
export default ApplicationManage
