import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { noop } from 'lodash'
import { Modal, Button } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'
import styles from './styles.module.less'
import { getActualUrl, getPlatformNumber, rewriteUrl } from '@/utils'
import __ from './locale'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { LoginPlatform } from '@/core'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

interface PublishResultType {
    onModelClose: () => void
    returnAssemblyLine: () => void
    publishedStatus?: string | null
}
const PublishResult = ({
    onModelClose = noop,
    returnAssemblyLine = noop,
    publishedStatus = '',
}: PublishResultType) => {
    const { checkPermission } = useUserPermCtx()
    const navigator = useNavigate()
    const platform = getPlatformNumber()
    const [{ cssjj }] = useGeneralConfig()

    /**
     * 返回工作流程列表
     */
    const handleReturnAssemblyLine = () => {
        // navigator(
        //     getActualUrl('/systemConfig/assemblyLineConfig?state=released'),
        // )
        rewriteUrl(`${window.location.pathname}?state=released`)
        returnAssemblyLine()
        onModelClose()
    }

    /**
     * 返回工作流程列表
     */
    const handleGotoTaskCenter = () => {
        if (platform === LoginPlatform.drmb) {
            navigator('/projectInfo')
        } else {
            navigator('/taskCenter/project')
        }
    }

    return (
        <Modal
            open
            footer={null}
            closable={false}
            maskClosable={false}
            width={480}
        >
            <div className={styles.resultContainer}>
                <div className={styles.resultTitle}>
                    <CheckCircleFilled
                        style={{ color: '#52C41A', fontSize: '28px' }}
                    />
                    <span className={styles.resultTitleInfo}>
                        {__('工作流程发布成功')}
                    </span>
                </div>
                <div className={styles.resultContent}>
                    <div className={styles.content}>
                        {__('工作流程及其节点配置信息已发布成功')}
                    </div>
                    <div className={styles.content}>
                        {__('您可在${type}去使用该工作流程创建项目和任务', {
                            type: cssjj ? __('项目管理') : __('任务中心'),
                        })}
                    </div>
                </div>
                <div
                    hidden={!checkPermission('manageDataOperationProject')}
                    className={styles.resultbButton}
                >
                    <Button
                        type="primary"
                        style={{
                            width: '160px',
                            height: '32px',
                            fontSize: '14px',
                        }}
                        onClick={handleGotoTaskCenter}
                    >
                        {__('前往${type}', {
                            type: cssjj ? __('项目管理') : __('任务中心'),
                        })}
                    </Button>
                </div>
                <div className={styles.resultbButton}>
                    <Button
                        style={{
                            width: '160px',
                            height: '32px',
                            fontSize: '14px',
                        }}
                        onClick={handleReturnAssemblyLine}
                    >
                        {__('返回工作流程列表')}
                    </Button>
                </div>
                <div className={styles.resultbButton}>
                    <Button type="link" onClick={onModelClose}>
                        {__('继续绘制')}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
export default PublishResult
