import { message, Modal, Rate } from 'antd'
import { useEffect, useState } from 'react'
import { scoreDesc } from './const'
import __ from '../locale'
import styles from './styles.module.less'
import {
    formatError,
    ICatlgScoreItem,
    postCatlgScore,
    putCatlgScore,
} from '@/core'

interface IScoreProps {
    open: boolean
    onCancel: () => void
    isFirstScore?: boolean
    catlgItem: ICatlgScoreItem
    onOk?: () => void
}

const Score = ({
    open,
    onCancel,
    isFirstScore = false,
    catlgItem,
    onOk,
}: IScoreProps) => {
    const [value, setValue] = useState(0)

    useEffect(() => {
        if (catlgItem) {
            setValue(Number(catlgItem.score))
        }
    }, [catlgItem])

    const onFinish = async () => {
        if (!value) {
            message.error(__('请先评分'))
            return
        }
        try {
            const action = isFirstScore ? postCatlgScore : putCatlgScore
            await action(catlgItem.catalog_id, value)
            message.success(__('评分成功'))
            onCancel()
            onOk?.()
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <Modal
            title={isFirstScore ? __('评分') : __('重新评分')}
            maskClosable={false}
            width={648}
            open={open}
            onCancel={onCancel}
            onOk={onFinish}
            okText={__('提交')}
            zIndex={1002}
        >
            <div className={styles['score-wrapper']}>
                <div className={styles['score-title']}>{__('综合评分')}</div>
                <div className={styles['score-desc']}>
                    {__('真诚期待你的点评，我们会努力做的更好')}
                </div>
                <div className={styles['score-rate']}>
                    <Rate
                        tooltips={scoreDesc}
                        onChange={setValue}
                        value={value}
                    />
                </div>
            </div>
        </Modal>
    )
}

export default Score
