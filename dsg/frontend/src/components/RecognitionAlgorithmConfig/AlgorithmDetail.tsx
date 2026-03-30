import { useEffect, useState } from 'react'
import moment from 'moment'
import { Col, Drawer, Row } from 'antd'
import { AlgorithmDetailConfig } from './helper'
import __ from './locale'
import styles from './styles.module.less'
import { AlgorithmType } from './const'
import { formatError, getRecognitionAlgorithmDetails } from '@/core'

interface AlgorithmDetailProps {
    open: boolean
    onClose: () => void
    dataId
}
const AlgorithmDetail = ({ open, onClose, dataId }: AlgorithmDetailProps) => {
    const [algorithmDetail, setAlgorithmDetail] = useState<Array<any>>([])

    useEffect(() => {
        getAlgorithmDetail()
    }, [dataId])

    /**
     * 获取算法详情
     */
    const getAlgorithmDetail = async () => {
        try {
            const res = await getRecognitionAlgorithmDetails(dataId as string)
            const newConfig = fillDataToConfig(res)
            setAlgorithmDetail(newConfig)
        } catch (err) {
            formatError(err)
        }
    }

    // 填充数据到配置
    const fillDataToConfig = (data: any) => {
        const config = AlgorithmDetailConfig?.map((item) => {
            return {
                ...item,
                value: item.items?.map((item2: any) => {
                    switch (item2.key) {
                        case 'status':
                            return {
                                ...item2,
                                value: item2?.render
                                    ? item2?.render(data)
                                    : data[item2.key],
                            }
                        case 'type':
                            return {
                                ...item2,
                                value:
                                    data[item2.key] === AlgorithmType.BUILT_IN
                                        ? __('内置')
                                        : __('自定义'),
                            }
                        case 'created_at':
                        case 'updated_at':
                            return {
                                ...item2,
                                value: moment(data[item2.key]).format(
                                    'YYYY-MM-DD HH:mm:ss',
                                ),
                            }

                        default:
                            return {
                                ...item2,
                                value: data[item2.key] || '--',
                            }
                    }
                }),
            }
        })
        return config
    }
    return (
        <Drawer
            title={__('算法模版详情')}
            width={1024}
            open={open}
            onClose={() => onClose()}
            destroyOnClose
            footer={null}
        >
            <div className={styles.detailContainer}>
                {algorithmDetail.map((item) => {
                    return (
                        <div className={styles.groupContainer}>
                            <div className={styles.titleContainer}>
                                <div className={styles.line} />
                                <div>{item.label}</div>
                            </div>
                            <div className={styles.contentContainer}>
                                <Row gutter={[8, 12]}>
                                    {item.value.map((item2) => {
                                        return (
                                            <>
                                                <Col span={3}>
                                                    <div
                                                        className={
                                                            styles.labelName
                                                        }
                                                    >
                                                        {item2.label}：
                                                    </div>
                                                </Col>
                                                <Col span={21}>
                                                    <div>{item2.value}</div>
                                                </Col>
                                            </>
                                        )
                                    })}
                                </Row>
                            </div>
                        </div>
                    )
                })}
            </div>
        </Drawer>
    )
}

export default AlgorithmDetail
