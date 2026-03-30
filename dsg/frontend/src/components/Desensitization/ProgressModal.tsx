import { Modal, Progress } from 'antd'
import { CloseCircleFilled } from '@ant-design/icons'
import { useBoolean } from 'ahooks'
import { forwardRef, useEffect, useImperativeHandle } from 'react'
import styles from './styles.module.less'

interface Props {
    current: number
    total: number
    progress: number
    failedCount: any[]
}

const ProgressModal = (props: Props, ref) => {
    const { current, total, progress, failedCount } = props
    const [open, { setTrue, setFalse }] = useBoolean(false)

    useImperativeHandle(ref, () => ({ setTrue, setFalse }))

    useEffect(() => {
        // 进度100%，关闭弹框
        if (progress >= 100) {
            setFalse()
        }
    }, [progress])

    return (
        <Modal
            open={open}
            title="删除脱敏算法"
            footer={null}
            width={800}
            getContainer={false}
        >
            <div>
                正在删除第 {current} 个模版（共 {total}个）
            </div>
            <div>已完成 {progress} %</div>
            <Progress percent={progress} />
            {failedCount.length > 0 && (
                <div>
                    <CloseCircleFilled className={styles.errorsIcon} />
                    <span>{`有 ${failedCount.length} 个失败项，全部操作完成后可输出详情`}</span>
                </div>
            )}
        </Modal>
    )
}

export default forwardRef(ProgressModal)
