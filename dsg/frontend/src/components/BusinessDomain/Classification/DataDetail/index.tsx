import { FC, useEffect, useState } from 'react'
import { Col, Drawer, Row } from 'antd'
import moment from 'moment'
import { ClassifyType } from '../const'
import __ from '../../locale'
import {
    ClassifyDetailConfig,
    ContainerBar,
    GradingDetailConfig,
} from '../helper'
import styles from './styles.module.less'
import { useClassificationContext } from '../ClassificationProvider'
import { FontIcon } from '@/icons'
import ConfigRuleDetail from './ConfigRuleDetail'
import { getClassificationRuleDetail, getGradeRuleDetail } from '@/core'

interface DataDetailProps {
    id: string
    type: ClassifyType
    open: boolean
    onClose: () => void
}

const DataDetail: FC<DataDetailProps> = ({ id, type, open, onClose }) => {
    const [detailData, setDetailData] = useState<any>(null)
    const { selectedAttribute } = useClassificationContext()
    const [details, setDetails] = useState<any>(null)

    useEffect(() => {
        if (id && type) {
            getDetailData()
        }
    }, [id, type])

    /**
     * 获取详情数据
     */
    const getDetailData = async () => {
        if (!id) return
        if (type === ClassifyType.CLASSIFY) {
            const data = await getClassificationRuleDetail(id)
            fillDataForDetail(data)
            setDetails(data)
        } else {
            const data = await getGradeRuleDetail(id)
            fillDataForDetail(data)
            setDetails(data)
        }
    }

    /**
     * 填充详情数据
     * @param data
     */
    const fillDataForDetail = (data: any) => {
        const detailConfig =
            type === ClassifyType.CLASSIFY
                ? ClassifyDetailConfig
                : GradingDetailConfig
        const dataDetailConfig = detailConfig?.map((itemData: any) => {
            return {
                ...itemData,
                items: itemData.items?.map((item: any) => {
                    return {
                        ...item,
                        value: renderDetailData(item.key, item, data),
                    }
                }),
            }
        })
        setDetailData(dataDetailConfig)
    }

    /**
     * 渲染详情数据
     * @param key
     * @param item
     * @param data
     * @returns
     */
    const renderDetailData = (key: string, item: any, data: any) => {
        switch (key) {
            case 'algorithms':
                return item?.render(data?.algorithms || [])
            case 'subject_name':
                return data?.subject_name
                    ? item?.render(data?.subject_name)
                    : '--'
            case 'created_at':
            case 'updated_at':
                return moment(data[key]).format('YYYY-MM-DD HH:mm:ss')
            default:
                return data[key]
        }
    }

    /**
     * 渲染分级规则详情
     * @returns
     */
    const renderGradeRuleDetail = () => {
        return (
            <div className={styles.configWrapper}>
                <div className={styles.title}>
                    {__('如果表（库表）内出现了组合')}
                </div>
                <div className={styles.combinationContainer}>
                    <ConfigRuleDetail data={details?.classifications} />
                </div>
                <div className={styles.title}>{__('则')}</div>
                <div className={styles.selectGradeContainer}>
                    <div className={styles.itemText}>{__('该表内「')}</div>
                    <div className={styles.itemText}>
                        <FontIcon
                            name="icon-shuxing"
                            style={{
                                fontSize: 20,
                                color: 'rgba(245, 137, 13, 1)',
                            }}
                        />
                        <span className={styles.titleText}>
                            {selectedAttribute?.name}
                        </span>
                    </div>
                    <div className={styles.itemText}>
                        {__('」类的字段数据分级为：')}
                    </div>
                    <div className={styles.itemText}>
                        <FontIcon
                            name="icon-biaoqianicon"
                            style={{
                                fontSize: 20,
                                color: details?.label_icon,
                            }}
                        />
                        <span>{details?.label_name}</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Drawer
            title={
                type === ClassifyType.CLASSIFY
                    ? __('分类识别规则详情')
                    : __('分级识别规则详情')
            }
            open={open}
            onClose={() => onClose()}
            width={1024}
            footer={null}
            destroyOnClose
        >
            <div className={styles.container}>
                {detailData?.map((itemData: any) => {
                    return (
                        <div
                            key={itemData.key}
                            className={styles.detailGroupWrapper}
                        >
                            <ContainerBar>
                                <div>{itemData.label}</div>
                            </ContainerBar>
                            {itemData.key === 'grading' ? (
                                renderGradeRuleDetail()
                            ) : (
                                <div className={styles.itemContentWrapper}>
                                    {itemData.items?.map((item: any) => (
                                        <Row gutter={[12, 16]}>
                                            <Col span={3}>
                                                <span>{item.label}</span>
                                            </Col>
                                            <Col span={21}>
                                                {item.value || '--'}
                                            </Col>
                                        </Row>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </Drawer>
    )
}

export default DataDetail
