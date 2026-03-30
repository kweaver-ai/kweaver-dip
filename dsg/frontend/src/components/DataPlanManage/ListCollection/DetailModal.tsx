import { Descriptions, Drawer } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { formatError, getDataAggregationInventoriesDetail } from '@/core'
import Return from '../Return'
import __ from './locale'
import styles from './styles.module.less'
import ResourceTable from './ResourceTable'
import { Loader } from '@/ui'

function DetailModal({ id, onClose }: any) {
    const [detail, setDetail] = useState<any>()
    const container = useRef<any>(null)
    const [loading, setLoading] = useState(false)
    const getDetail = async () => {
        try {
            setLoading(true)
            const res = await getDataAggregationInventoriesDetail(id)
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
                            <Descriptions
                                column={2}
                                labelStyle={{
                                    width: '126px',
                                    color: 'rgba(0, 0, 0, 0.45)',
                                }}
                            >
                                <Descriptions.Item
                                    label={__('数据归集清单') + __('名称')}
                                >
                                    <div
                                        className={styles.singleLine}
                                        title={detail?.name}
                                    >
                                        {detail?.name || '--'}
                                    </div>
                                </Descriptions.Item>
                                <Descriptions.Item label={__('关联工单')}>
                                    <div
                                        className={styles.singleLine}
                                        title={detail?.work_order_names?.join(
                                            '、',
                                        )}
                                    >
                                        {detail?.work_order_names?.join('、') ||
                                            '--'}
                                    </div>
                                </Descriptions.Item>
                            </Descriptions>
                            <div>
                                <ResourceTable
                                    items={detail?.resources || []}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default DetailModal
