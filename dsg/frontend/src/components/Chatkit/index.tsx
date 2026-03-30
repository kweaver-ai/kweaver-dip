import React, { useMemo, useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { Tooltip } from 'antd'
// 确保 Chatkit 的样式被注入（样式已打包�?JS 中，导入组件时会自动注入�?
import {
    Assistant,
    type AssistantProps,
    BlockRegistry,
} from '@kweaver-ai/chatkit'
import {
    useParams,
    useSearchParams,
    useNavigate,
    useLocation,
} from 'react-router-dom'
import styles from './styles.module.less'
import __ from './locale'
import { useMicroAppProps } from '@/context'
import { Empty, Loader } from '@/ui'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import DataCatlgDrawer from '../SearchDataCopilot/DataCatlgDrawer'

const ChatKit = () => {
    const params = useParams<{ agentKey: string }>()
    const [searchParams] = useSearchParams()
    const location = useLocation()
    const { microAppProps } = useMicroAppProps()

    const navigate = useNavigate()
    // 从路径参数获�?agentKey
    const agentKey = params?.agentKey
    // agentName �?businessDomain 从查询参数获取（可选）
    const agentName = searchParams.get('agentName')
    const businessDomain = searchParams.get('businessDomain')
    const [initialQuestion, setInitialQuestion] = useState('')
    const [blockData, setBlockData] = useState<any[]>([])
    const [openResource, setOpenResource] = useState(false)

    // initialQuestion 读取后，将路由 state 清空，保证 question 只使用一次
    useEffect(() => {
        const state = location.state as { question?: string } | null
        if (state?.question) {
            setInitialQuestion(state.question)
            navigate(`${location.pathname}${location.search}`, {
                replace: true,
                state: null,
            })
        }
    }, [location.pathname, location.search, location.state, navigate])

    useEffect(() => {
        console.log('initialQuestion', initialQuestion)
    }, [initialQuestion])

    const baseUrl = `${window.location.origin}/api/agent-app/v1`
    console.log('baseUrl', baseUrl)

    // 判断是否需要等�?token
    const [isTokenReady, setIsTokenReady] = useState(false)

    // 使用 useMemo 监听 microAppProps 变化，确�?token 更新时重新计�?
    // accessToken �?getter，每次访问都会获取最新值，所以需要在 useMemo 中调�?
    const { assistantToken, assistantRefreshToken } = useMemo(() => {
        // 优先使用微应�?props 中的 token 信息，其次回退�?cookies
        // 注意：accessToken �?getter，需要在这里调用以获取最新�?
        console.log('microAppProps', microAppProps)
        const accessTokenFromMicroApp = microAppProps.props.token?.accessToken
        const refreshTokenFromMicroApp = microAppProps.props.token?.refreshToken

        const token =
            accessTokenFromMicroApp || Cookies.get('af.oauth2_token') || ''

        return {
            assistantToken: token,
            assistantRefreshToken: refreshTokenFromMicroApp
                ? // qiankun 传入�?refreshToken 返回 { accessToken: string }
                  async () => {
                      const res = await refreshTokenFromMicroApp()
                      return res?.accessToken || ''
                  }
                : // 兼容老逻辑：如果未提供 refreshToken 方法，则退�?cookie
                  undefined,
        }
    }, [
        // 监听 microAppProps.token 的变化，确保 token 更新时重新计�?
        // 注意：由�?accessToken �?getter，我们监�?token 对象以确保在 token 相关变化时重新计�?
        microAppProps?.token,
    ])

    // 检�?token 是否准备�?
    useEffect(() => {
        // 如果�?token（无论是�?microAppProps 还是 cookie），则认为已准备�?
        if (assistantToken) {
            setIsTokenReady(true)
        }

        // 如果 microAppProps 存在�?token 还没准备好，等待一段时间后再次检�?
        // 这处理了 microAppProps 异步加载的情�?
    }, [assistantToken, microAppProps])

    useEffect(() => {
        BlockRegistry.registerTools([
            {
                name: 'af_sailor',
                Icon: (
                    <FontIcon
                        name="icon-wenjianjia"
                        type={IconType.COLOREDICON}
                        style={{ fontSize: 22, color: '#128ee3' }}
                    />
                ),
                onClick: (blockInfo) => {
                    const data = blockInfo?.data || []
                    setBlockData(data as any[])
                    setOpenResource(true)
                    return () => {
                        setBlockData([])
                        setOpenResource(false)
                    }
                },
            },
            {
                name: 'datasource_filter',
                Icon: (
                    <FontIcon
                        name="icon-wenjianjia"
                        type={IconType.COLOREDICON}
                        style={{ fontSize: 22, color: '#128ee3' }}
                    />
                ),
                onClick: (blockInfo) => {
                    const data = blockInfo?.data || []
                    setBlockData(data as any[])
                    setOpenResource(true)
                    return () => {
                        setBlockData([])
                        setOpenResource(false)
                    }
                },
            },
            {
                name: 'datasource_rerank',
                Icon: (
                    <FontIcon
                        name="icon-wenjianjia"
                        type={IconType.COLOREDICON}
                        style={{ fontSize: 22, color: '#128ee3' }}
                    />
                ),
                onClick: (blockInfo) => {
                    const data = blockInfo?.data || []
                    setBlockData(data as any[])
                    setOpenResource(true)
                    return () => {
                        setBlockData([])
                        setOpenResource(false)
                    }
                },
            },
        ])
    }, [])

    // 确保 Chatkit 的样式被注入
    // Chatkit 的样式会在模块加载时自动注入�?document.head
    // 由于组件�?lazy 加载的，这里确保样式已经被注�?

    // 如果 agentKey 缺失，显示错误提�?

    if (!agentKey) {
        return (
            <div className={styles.chatKitContainer}>
                <Empty
                    desc={
                        !businessDomain
                            ? __('找不到业务域，请选择一个业务域')
                            : __('找不到助手，请选择一个助手?')
                    }
                />
            </div>
        )
    }

    // 等待 token 准备好后再渲�?Assistant
    if (!isTokenReady) {
        return (
            <div className={styles.chatKitContainer}>
                <Loader tip={__('加载中...')} />
            </div>
        )
    }

    return (
        <div className={styles.chatKitContainer}>
            <div className={styles.chatKitLeft}>
                <Tooltip title={__('返回')}>
                    <div
                        className={styles.chatKitLeftIcon}
                        onClick={() => {
                            navigate('/')
                        }}
                    >
                        <FontIcon
                            type={IconType.COLOREDICON}
                            name="icon-zhuye"
                            style={{ fontSize: 24 }}
                        />
                    </div>
                </Tooltip>
            </div>
            <div className={styles.chatKitRight}>
                {React.createElement(
                    Assistant as any,
                    {
                        title: agentName || '',
                        visible: true,
                        baseUrl,
                        agentKey,
                        token: assistantToken,
                        refreshToken: assistantRefreshToken,
                        businessDomain: businessDomain || undefined,
                        initialQuestion,
                    } as AssistantProps,
                )}
            </div>
            {openResource && (
                <DataCatlgDrawer
                    open={openResource}
                    data={blockData}
                    onClose={() => {
                        setBlockData([])
                        setOpenResource(false)
                    }}
                    placement="right"
                />
            )}
        </div>
    )
}

export default ChatKit
