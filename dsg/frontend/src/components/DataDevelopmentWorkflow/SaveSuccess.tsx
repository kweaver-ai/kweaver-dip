import React from 'react'
import { Modal, Button } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import { OperateType } from './const'

interface ISaveSuccess {
    visible: boolean
    operate?: OperateType
    onExecute: () => void
    onBackList: () => void
    onConfigTimePlan: () => void
    onClose: () => void
}

/**
 * 保存成功弹窗
 * @param operate 操作类型
 * @param onExecute 立即执行
 * @param onBackList 返回列表
 * @param onConfigTimePlan 时间计划
 * @param onClose 关闭
 */
const SaveSuccess: React.FC<ISaveSuccess> = ({
    visible,
    operate,
    onExecute,
    onBackList,
    onConfigTimePlan,
    onClose,
}) => {
    return (
        <Modal
            open={visible}
            footer={null}
            maskClosable={false}
            onCancel={onClose}
        >
            <div className={styles.saveSuccessWrap}>
                <div className={styles.resultTitle}>
                    <CheckCircleFilled
                        style={{ color: '#52C41A', fontSize: '28px' }}
                    />
                    <span className={styles.resultTitleInfo}>
                        {__('工作流发布成功！')}
                    </span>
                </div>
                <div className={styles.resultContent}>
                    <div className={styles.content}>{__('您可立即执行')}</div>
                    <div className={styles.content}>
                        {__('或前往配置时间计划')}
                    </div>
                </div>
                <Button
                    type="primary"
                    style={{
                        width: 160,
                        marginBottom: 12,
                    }}
                    onClick={() => {
                        onExecute()
                        onClose()
                    }}
                >
                    {__('立即执行')}
                </Button>
                <Button
                    style={{
                        width: 160,
                        marginBottom: 12,
                    }}
                    onClick={() => {
                        onConfigTimePlan()
                        onClose()
                    }}
                >
                    {__('配置时间计划')}
                </Button>
                <Button
                    type="link"
                    style={{
                        marginBottom: 19,
                    }}
                    onClick={() => {
                        onBackList()
                        onClose()
                    }}
                >
                    {__('返回列表')}
                </Button>
            </div>
        </Modal>
    )
}

export default SaveSuccess
