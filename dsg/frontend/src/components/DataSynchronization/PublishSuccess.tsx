import { FC } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircleFilled, CloseOutlined } from '@ant-design/icons'
import { Button, Modal } from 'antd'
import styles from './styles.module.less'

import __ from './locale'

interface PublishSuccessType {
    onExecution: () => void
    onClose: () => void
    onBackList: () => void
}
const PublishSuccess: FC<PublishSuccessType> = ({
    onExecution,
    onClose,
    onBackList,
}) => {
    const navigator = useNavigate()
    const { pathname, search } = useLocation()
    return (
        <Modal
            open
            footer={null}
            closable={false}
            maskClosable={false}
            width={480}
        >
            <div className={styles.resultContainer}>
                <div className={styles.close}>
                    <CloseOutlined onClick={onClose} />
                </div>
                <div className={styles.resultTitle}>
                    <CheckCircleFilled
                        style={{ color: '#52C41A', fontSize: '25px' }}
                    />
                    <span className={styles.resultTitleInfo}>
                        {__('数据同步发布成功！')}
                    </span>
                </div>

                <div className={styles.resultContent}>
                    <div className={styles.content}>
                        {__('您可立即执行数据同步或')}
                    </div>
                    <div className={styles.content}>
                        {__('前往「工作流」配置执行计划')}
                    </div>
                </div>
                <div className={styles.resultbButton}>
                    <Button
                        type="primary"
                        style={{
                            width: '160px',
                            height: '40px',
                            fontSize: '14px',
                            marginBottom: '12px',
                        }}
                        onClick={onExecution}
                    >
                        {__('立即执行')}
                    </Button>
                    <Button
                        style={{
                            width: '160px',
                            height: '40px',
                            fontSize: '14px',
                            marginBottom: '12px',
                        }}
                        onClick={() => {
                            navigator(`/dataDevelopment/workflow${search}`)
                            onBackList()
                        }}
                    >
                        {__('前往工作流')}
                    </Button>
                    <Button
                        type="link"
                        style={{
                            width: '160px',
                            height: '40px',
                            fontSize: '14px',
                        }}
                        onClick={() => {
                            onBackList()
                        }}
                    >
                        {__('返回列表')}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

export default PublishSuccess
