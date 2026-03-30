import { FC, useState, useEffect, useMemo } from 'react'
import { Drawer, Modal } from 'antd'
import { useNavigate } from 'react-router-dom'
import styles from './styles.module.less'
import __ from './locale'
import Details from './Details'
import Apply from './Apply'
import { ResShareDrawerProvider } from './ResShareDrawerProvider'
import { useQuery } from '@/utils'

interface ISharingDrawer {
    open: boolean
    onClose?: () => void
    // 共享申请 id
    applyId?: string
    // 操作类型 view 查看 | viewWithRecord 查看带记录 | create 创建
    operate?: 'view' | 'viewWithRecord' | 'create'
    // 是否全屏 默认全屏
    fullScreen?: boolean
    // 配置项 不传默认配置 [details1, details2, details3, details4, details5, details6]的 key
    config?: string[]
    // 是否是弹窗 默认 false
    isModal?: boolean
    // 目录信息，创建时需要的数据
    applyResource?: any
}
const SharingDrawer: FC<ISharingDrawer> = ({
    open,
    onClose,
    applyId,
    operate,
    fullScreen = true,
    config,
    isModal = false,
    applyResource,
}) => {
    const navigate = useNavigate()
    // 路由跳转需要的信息
    const query = useQuery()
    // 共享申请 id
    const id = applyId || query.get('applyId') || ''
    const op = operate || query.get('operate') || ''
    // 目录信息，创建时需要的数据
    const resource = decodeURIComponent(
        atob(applyResource || query.get('resource') || ''),
    )
    // 返回路径
    const backurl = decodeURIComponent(atob(query.get('backurl') || ''))

    const handleClose = () => {
        if (onClose) {
            return onClose()
        }
        if (backurl) {
            return navigate(backurl)
        }
        return navigate(-1)
    }

    const getPageContent = () => {
        switch (op) {
            case 'view':
                return (
                    <Details
                        applyId={id}
                        showRecord={false}
                        configsKey={config}
                        fullScreen={isModal ? false : fullScreen}
                        onClose={() => handleClose()}
                    />
                )
            case 'viewWithRecord':
                return (
                    <Details
                        applyId={id}
                        configsKey={config}
                        onClose={() => handleClose()}
                    />
                )
            case 'create':
                return (
                    <Apply
                        data={resource ? JSON.parse(resource) : undefined}
                        onClose={() => handleClose()}
                    />
                )
            default:
                return ''
        }
    }

    return (
        <ResShareDrawerProvider>
            {isModal ? (
                <Modal
                    width="80%"
                    open={open}
                    closable={false}
                    centered
                    destroyOnClose
                    footer={null}
                    style={{ maxWidth: 1200 }}
                    bodyStyle={{
                        padding: '0',
                        display: 'flex',
                        flexDirection: 'column',
                        height: document.body.clientHeight * 0.9,
                    }}
                >
                    {getPageContent()}
                </Modal>
            ) : (
                <Drawer
                    open={open}
                    width={fullScreen ? '100%' : '80%'}
                    placement="right"
                    closable={false}
                    bodyStyle={{
                        padding: '0',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                    contentWrapperStyle={{ minWidth: 800 }}
                    destroyOnClose
                    maskClosable={false}
                    mask={false}
                >
                    {getPageContent()}
                </Drawer>
            )}
        </ResShareDrawerProvider>
    )
}
export default SharingDrawer
