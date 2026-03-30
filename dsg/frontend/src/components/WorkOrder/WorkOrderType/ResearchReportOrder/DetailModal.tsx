import { Anchor, Descriptions, Drawer } from 'antd'
import { isNumber } from 'lodash'
import moment from 'moment'
import { useEffect, useRef, useState } from 'react'
import { Loader } from '@/ui'
import { formatError, getWorkOrderDetail } from '@/core'
import Return from '../../Return'
import WorkOrderTaskTable from '../../WorkOrderTaskTable'
import {
    getOptionState,
    OrderStatusOptions,
    OrderTypeOptions,
    PriorityOptions,
} from '../../helper'
import __ from './locale'
import styles from './styles.module.less'

const { Link } = Anchor
function DetailModal({ id, onClose }: any) {
    const [detail, setDetail] = useState<any>()
    const container = useRef<any>(null)
    const [loading, setLoading] = useState<boolean>(false)

    const getDetail = async () => {
        try {
            setLoading(true)
            const res = await getWorkOrderDetail(id)
            setDetail(res)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) {
            getDetail()
        }
    }, [id])

    return (
        <Drawer
            open
            contentWrapperStyle={{
                width: '100%',
                height: '100%',
                boxShadow: 'none',
                transform: 'none',
                marginTop: 0,
            }}
            style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }}
            headerStyle={{ display: 'none' }}
            bodyStyle={{
                padding: '0 0 0 0',
                display: 'flex',
                flexDirection: 'column',
            }}
            destroyOnClose
            maskClosable={false}
            mask={false}
        >
            <div className={styles['opt-wrapper']}>
                <div className={styles.header}>
                    <Return
                        onReturn={() => onClose(false)}
                        title={detail?.name || __('详情')}
                    />
                </div>
                <div className={styles.body}>
                    <div className={styles.detailContent} ref={container}>
                        <div
                            style={{
                                height: '100%',
                                display: 'grid',
                                placeContent: 'center',
                            }}
                            hidden={!loading}
                        >
                            <Loader />
                        </div>
                        <div className={styles.infoList} hidden={loading}>
                            <div className={styles.moduleTitle} id="base-info">
                                <h4>{__('基本信息')}</h4>
                            </div>
                            <Descriptions
                                column={2}
                                labelStyle={{
                                    width: '126px',
                                    color: 'rgba(0, 0, 0, 0.45)',
                                }}
                            >
                                <Descriptions.Item label={__('工单名称')}>
                                    {detail?.name || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('工单类型')}>
                                    {OrderTypeOptions.find(
                                        (o) => o.value === detail?.type,
                                    )?.label ?? '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('责任人')}>
                                    {detail?.responsible_uname || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('优先级')}>
                                    {getOptionState(
                                        detail?.priority,
                                        PriorityOptions,
                                    )}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('截止日期')}>
                                    {isNumber(detail?.finished_at) &&
                                    detail?.finished_at
                                        ? moment(
                                              detail.finished_at * 1000,
                                          ).format('YYYY-MM-DD')
                                        : '--'}
                                </Descriptions.Item>

                                <Descriptions.Item label={__('工单状态')}>
                                    {getOptionState(
                                        detail?.status,
                                        OrderStatusOptions,
                                    )}
                                </Descriptions.Item>
                                {detail?.status === 'finished' && (
                                    <Descriptions.Item label={__('完成时间')}>
                                        {isNumber(detail?.updated_at) &&
                                        detail?.updated_at
                                            ? moment(detail.updated_at).format(
                                                  'YYYY-MM-DD HH:mm:ss',
                                              )
                                            : '--'}
                                    </Descriptions.Item>
                                )}

                                <Descriptions.Item
                                    label={__('工单说明')}
                                    span={2}
                                >
                                    {detail?.description ?? '--'}
                                </Descriptions.Item>
                            </Descriptions>

                            <div className={styles.moduleTitle} id="order-task">
                                <h4>{__('工单任务')}</h4>
                            </div>
                            <div>
                                <WorkOrderTaskTable readOnly workOrderId={id} />
                            </div>
                            <div
                                className={styles.moduleTitle}
                                id="processing-content"
                            >
                                <h4>{__('处理说明')}</h4>
                            </div>
                            <Descriptions
                                column={2}
                                labelStyle={{
                                    width: '126px',
                                    color: 'rgba(0, 0, 0, 0.45)',
                                }}
                            >
                                <Descriptions.Item
                                    label={__('处理说明')}
                                    span={2}
                                >
                                    {detail?.processing_instructions || '--'}
                                </Descriptions.Item>
                            </Descriptions>
                            <div className={styles.moduleTitle} id="more-info">
                                <h4>{__('更多信息')}</h4>
                            </div>
                            <Descriptions
                                column={2}
                                labelStyle={{
                                    width: '126px',
                                    color: 'rgba(0, 0, 0, 0.45)',
                                }}
                            >
                                <Descriptions.Item label={__('创建人')}>
                                    {detail?.created_by || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('创建时间')}>
                                    {isNumber(detail?.created_at) &&
                                    detail?.created_at
                                        ? moment(detail.created_at).format(
                                              'YYYY-MM-DD HH:mm:ss',
                                          )
                                        : '--'}
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default DetailModal
