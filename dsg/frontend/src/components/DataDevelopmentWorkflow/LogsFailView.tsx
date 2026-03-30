import React, { useEffect, useState } from 'react'
import { Collapse, Modal, Spin } from 'antd'
import styles from './styles.module.less'
import { formatError, queryWorkFlowLogsFail } from '@/core'
import __ from './locale'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import { ExecuteState, ModelType } from './const'
import { modelTypeIcon } from './helper'

const { Panel } = Collapse

interface ILogsFailView {
    visible: boolean
    id?: string
    data?: any
    onClose: () => void
}

/**
 * 工作流失败日志
 * @param visible 显示/隐藏
 * @param item 工作流id
 * @param data 日志数据
 * @param onClose 关闭
 */
const LogsFailView: React.FC<ILogsFailView> = ({
    visible,
    id,
    data,
    onClose,
}) => {
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState<any[]>([])

    useEffect(() => {
        if (visible) {
            getList()
            return
        }
        setItems([])
    }, [visible])

    const getList = async () => {
        if (!id || !data?.id) {
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            const res = await queryWorkFlowLogsFail({
                process_instance_id: data?.id,
                process_uuid: id!,
            })
            setItems(
                res?.data?.task_list?.filter(
                    (info) => info.state === ExecuteState.FAIL,
                ) || [],
            )
        } catch (err) {
            formatError(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            title={__('失败详情')}
            width={640}
            open={visible}
            footer={null}
            onCancel={onClose}
            destroyOnClose
            getContainer={false}
            bodyStyle={{
                overflow: 'auto',
                padding: '16px 24px',
                maxHeight: 545,
                minHeight: 320,
            }}
        >
            <div className={styles.logsFailViewWrap}>
                {loading ? (
                    <div className={styles.empty}>
                        <Spin />
                    </div>
                ) : items.length > 0 ? (
                    <Collapse
                        ghost
                        defaultActiveKey={items.map((info) => info.id)}
                    >
                        {items.map((item) => (
                            <Panel
                                header={
                                    <div className={styles.lfv_titleWrap}>
                                        {modelTypeIcon(
                                            item.type === '同步'
                                                ? ModelType.SYNC
                                                : item.type === '融合'
                                                ? ModelType.PROC
                                                : item.type,
                                        )}
                                        <div
                                            className={styles.name}
                                            title={item.name}
                                        >
                                            {item.name}
                                        </div>
                                    </div>
                                }
                                key={item.id}
                            >
                                <div className={styles.lfv_desc}>
                                    {item.message}
                                </div>
                            </Panel>
                        ))}
                    </Collapse>
                ) : (
                    <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                )}
            </div>
        </Modal>
    )
}

export default LogsFailView
