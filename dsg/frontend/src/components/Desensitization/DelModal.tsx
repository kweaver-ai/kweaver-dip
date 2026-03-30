import { Modal, ModalProps, Progress, message, Button } from 'antd'
import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react'
import { useBoolean, useSetState } from 'ahooks'
import {
    CloseCircleFilled,
    CheckCircleFilled,
    InfoCircleFilled,
} from '@ant-design/icons'
import __ from './locale'
import ReferenceTable, { Props as ReferenceProps } from './ReferenceTable'
import styles from './styles.module.less'

interface Props extends ModalProps {
    isSingle?: boolean
    successCount: number
    failedCount: any[]
    onSuccess?: () => void
    allCompleted: boolean
    onCheck: ReferenceProps['onCheck']
}

const DelModal = (props: Props, ref) => {
    const {
        isSingle = false,
        successCount,
        failedCount,
        onSuccess,
        onCheck,
        allCompleted,
        ...restProps
    } = props
    const [open, { setTrue, setFalse }] = useBoolean(false)

    useEffect(() => {
        if (open && allCompleted && failedCount.length === 0) {
            setFalse()
            if (onSuccess) {
                onSuccess()
            }
            message.success(
                isSingle
                    ? '已解除算法的作用关系并删除算法'
                    : `操作完成，已删除${successCount}个脱敏算法`,
            )
        }
    }, [open, failedCount, successCount, isSingle, allCompleted])

    useImperativeHandle(ref, () => ({ setTrue, setFalse }))

    const referenceError = (
        <>
            <div className={`${styles.mb38} ${styles.headText}`}>
                {isSingle ? (
                    <InfoCircleFilled className={styles.infosIcon} />
                ) : (
                    <CloseCircleFilled className={styles.errorsIcon} />
                )}
                <span>
                    {`${
                        isSingle ? '当前' : '以下'
                    }脱敏算法已被隐私数据保护策略引用，需要先解除和策略的作用关系，才能进行删除。`}
                </span>
            </div>
            <ReferenceTable
                single={isSingle}
                ids={failedCount.map((item) => item.id)}
                onCheck={onCheck}
            />
            <div className={styles.referenceAction}>
                <Button type="primary" onClick={setFalse}>
                    {__('关闭')}
                </Button>
            </div>
        </>
    )

    return (
        <Modal
            open={open}
            // title={!allCompleted ? '删除脱敏算法' : null}
            footer={null}
            width={800}
            getContainer={false}
            {...restProps}
        >
            {!isSingle && failedCount.length > 0 && (
                <div className={`${styles.mb24} ${styles.headText}`}>
                    <CheckCircleFilled className={styles.successIcon} />
                    <span>{`操作完成，已删除 ${successCount} 个脱敏算法`}</span>
                </div>
            )}
            {failedCount.length > 0 && referenceError}
        </Modal>
    )
}

export default forwardRef(DelModal)
