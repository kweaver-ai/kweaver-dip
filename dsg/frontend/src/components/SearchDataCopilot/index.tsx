import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Drawer, Image } from 'antd'
import { MessageOutlined } from '@ant-design/icons'
import Cookies from 'js-cookie'
// 使用 @kweaver-ai/chatkit 的 Assistant 组件作为 Copilot 实现
// 注：文档中提到的 Copilot 组件，实际在包中导出为 Assistant
import {
    Assistant,
    type AssistantProps,
    BlockRegistry,
} from '@kweaver-ai/chatkit'
import qaColored from '@/assets/qaColored.png'
import { useMicroAppProps } from '@/context'
import { getSearchAgentInfo } from '@/core/apis/afSailorService'
import { Loader } from '@/ui'
import styles from './styles.module.less'
import DataCatlgDrawer from './DataCatlgDrawer'
import MicroAppHeader from '../MicroAppHeader'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

const SearchDataCopilot: React.FC = () => {
    const [visible, setVisible] = useState(false)
    const [blockData, setBlockData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [openResource, setOpenResource] = useState(false)
    const [agentInfo, setAgentInfo] = useState<{
        adp_agent_key: string
        adp_business_domain_id: string
    } | null>(null)
    const { microAppProps } = useMicroAppProps()
    const drawerContainerRef = useRef<HTMLDivElement>(null)

    // 获取 token，参考 Chatkit 组件的实现
    const { assistantToken, assistantRefreshToken } = useMemo(() => {
        const accessTokenFromMicroApp = microAppProps.token?.accessToken
        const refreshTokenFromMicroApp = microAppProps?.token?.refreshToken

        const token =
            accessTokenFromMicroApp || Cookies.get('af.oauth2_token') || ''

        return {
            assistantToken: token,
            assistantRefreshToken: refreshTokenFromMicroApp
                ? async () => {
                      const res = await refreshTokenFromMicroApp()
                      return res?.accessToken || ''
                  }
                : undefined,
        }
    }, [microAppProps?.token])

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
    // 获取 Agent 信息
    useEffect(() => {
        if (visible && !agentInfo) {
            setLoading(true)
            getSearchAgentInfo()
                .then((res) => {
                    setAgentInfo(res.res)
                })
                .catch((err) => {
                    // 获取 Agent 信息失败，错误信息已在控制台输出
                    // eslint-disable-next-line no-console
                    console.error('获取 Agent 信息失败:', err)
                })
                .finally(() => {
                    setLoading(false)
                })
        }
    }, [visible])

    // 关闭抽屉时清空 agentInfo，下次打开时重新获取
    useEffect(() => {
        if (!visible) {
            setAgentInfo(null)
        }
    }, [visible])

    const baseUrl = `${window.location.origin}/api/agent-app/v1`

    const handleToggle = () => {
        setVisible(!visible)
    }

    const handleClose = () => {
        setVisible(false)
    }

    return (
        <>
            {/* 固定按钮 */}
            <div className={styles.fixedButton} onClick={handleToggle}>
                <Image src={qaColored} preview={false} width={24} height={24} />
            </div>

            {/* Copilot 抽屉 */}
            <Drawer
                open={visible}
                placement="right"
                maskClosable={false}
                closable={false}
                destroyOnClose={false}
                getContainer={false}
                className={styles.copilotDrawer}
                title={null}
                headerStyle={{ display: 'none' }}
                bodyStyle={{
                    padding: 0,
                    height: '100vh',
                    width: '100vw',
                    overflow: 'hidden',
                }}
                style={{
                    position: 'fixed',
                    width: '100vw',
                    height: '100vh',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1000,
                }}
                width="100%"
                push={false}
                mask={false}
            >
                <MicroAppHeader
                    isFromSearchCopilot
                    onServiceMarketClick={() => setVisible(false)}
                />
                {loading ? (
                    <div className={styles.loadingContainer}>
                        <Loader tip="加载中..." />
                    </div>
                ) : agentInfo ? (
                    <div
                        className={styles.copilotContainer}
                        ref={drawerContainerRef}
                    >
                        {React.createElement(
                            Assistant as any,
                            {
                                title: '数据搜索助手',
                                visible: true,
                                baseUrl,
                                agentKey: agentInfo.adp_agent_key,
                                token: assistantToken,
                                refreshToken: assistantRefreshToken,
                                businessDomain:
                                    agentInfo.adp_business_domain_id,
                            } as AssistantProps,
                        )}
                    </div>
                ) : (
                    <div className={styles.errorContainer}>
                        <p>获取 Agent 信息失败，请稍后重试</p>
                    </div>
                )}
                {openResource && (
                    <DataCatlgDrawer
                        open={openResource}
                        data={blockData}
                        onClose={() => setOpenResource(false)}
                        placement="right"
                    />
                )}
            </Drawer>
        </>
    )
}

export default SearchDataCopilot
