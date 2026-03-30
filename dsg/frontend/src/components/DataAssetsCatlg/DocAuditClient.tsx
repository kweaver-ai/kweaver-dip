import React, { useEffect, useRef, useState } from 'react'
import { LeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { Divider, Tooltip } from 'antd'
import styles from './styles.module.less'

import __ from './locale'
import CustomDrawer from '../CustomDrawer'
import { ReviewColored } from '@/icons'

/**
 * @param isIntroduced  该组件是否被引用，true：组件被引用到某页面中（如新建需求中，此时路由路径不变）， false：组件用作服务超市详情页
 */
interface IDocAuditClient {
    open: boolean
    title?: string
    params?: any
    onClose: () => void
    showReload?: boolean
}
// 页面路径中获取参数
const DocAuditClient: React.FC<IDocAuditClient> = ({
    open,
    params,
    onClose,
    title = __('审核待办'),
    showReload = true,
}) => {
    const [loading, setLoading] = useState(true)
    const ref: any = useRef()

    const iframeLoad = () => {
        setLoading(true)
        const frame = ref?.current
        if (frame) {
            if (frame.attachEvent) {
                // IE
                frame.attachEvent('onload', () => {
                    setLoading(false)
                })
            } else {
                // 非IE
                frame.onload = () => {
                    setLoading(false)
                }
            }
        }
    }
    useEffect(() => {
        if (open) {
            iframeLoad()
        }
    }, [])

    const getParams = (obj: any) => {
        let result = ''
        let item
        // eslint-disable-next-line no-restricted-syntax
        for (item in obj) {
            if (obj[item] && String(obj[item])) {
                result += `&${item}=${obj[item]}`
            }
        }
        if (result) {
            result = `&${result.slice(1)}`
        }
        return result
    }

    return (
        <CustomDrawer
            open={open}
            isShowFooter={false}
            bodyStyle={{
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
            customHeaderStyle={{ display: 'none' }}
            customBodyStyle={{ height: '100%' }}
            style={{
                position: 'fixed',
                width: '100vw',
                height: '100vh',
                top: '0',
                zIndex: '1010',
            }}
            // destroyOnClose={false}
        >
            <div className={styles.auditContentWrapper}>
                <div className={styles.top}>
                    <div className={styles.leftWrapper}>
                        <div onClick={onClose} className={styles.returnInfo}>
                            <LeftOutlined className={styles.returnArrow} />
                            <span className={styles.returnText}>返回</span>
                            <Divider
                                type="vertical"
                                className={styles.divider}
                                style={{
                                    width: 1,
                                    height: 20,
                                    margin: '0 12px',
                                }}
                            />
                            <div className={styles.modelIconWrapper}>
                                <ReviewColored className={styles.modelIcon} />
                            </div>
                            <div className={styles.topTitle}>{title}</div>
                        </div>
                    </div>
                    {showReload && (
                        <div className={styles.rightWrapper}>
                            <Tooltip title={__('刷新')} placement="bottom">
                                <ReloadOutlined
                                    className={styles.reloadIcon}
                                    onClick={() => {
                                        setLoading(true)

                                        const frame: HTMLIFrameElement =
                                            document.getElementById(
                                                'docAuditClient',
                                            ) as HTMLIFrameElement
                                        if (frame && frame.src) {
                                            frame.src = 'view/docAuditClient'
                                        }
                                    }}
                                />
                            </Tooltip>
                        </div>
                    )}
                </div>

                {/* {loading && (
                    <div className={styles.loading}>
                        <Loader />
                    </div>
                )} */}
                <iframe
                    id="docAuditClient"
                    ref={ref}
                    src={`view/docAuditClient/?${
                        params ? getParams(params) : ''
                    }`}
                    title="审核待办"
                    name="审核待办"
                    className={styles.auditFrame}
                    style={{
                        border: 0,
                        position: 'fixed',
                        width: '100%',
                        height: 'calc(100% - 52px)',
                        padding: '24px',
                        background: '#F0F2F6',
                    }}
                />
            </div>
        </CustomDrawer>
    )
}

export default DocAuditClient
