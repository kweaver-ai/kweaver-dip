import { memo, useEffect, useState } from 'react'
import { Radio, message, Progress, Tabs, Row, Col } from 'antd'
import classnames from 'classnames'
import { RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import styles from './styles.module.less'
import __ from './locale'
import { PieGraph, RadarMap } from './g2plotConfig'
import { CrownColored } from '@/icons'
import {
    getBusinessLogicEntityByDomain,
    getBusinessLogicEntityByDepartment,
    getStandardizedRate,
    formatError,
} from '@/core'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import AssetSnapshot from './components/AssetSnapshot'

interface IBusinessLogicDataItem {
    type: string
    value: number
}

interface IBusinessLogicData {
    total: number
    list: IBusinessLogicDataItem[]
}

interface IStandardizedRate {
    business_domain_id: string
    business_domain_name: string
    standardized_fields: number
    total_fields: number
}

function SecondLine({ donutData }: any) {
    const [businessLogicData, setBusinessLogicData] =
        useState<IBusinessLogicData>()
    const [standardizedRate, setStandardizedRate] =
        useState<IStandardizedRate[]>()
    const navigate = useNavigate()

    useEffect(() => {
        const list = (donutData || [])
            .map((o) => ({
                type: o?.name,
                value: parseInt(o?.count ?? 0, 10),
                count: parseInt(o?.count ?? 0, 10),
            }))
            .sort((a, b) => b.count - a.count)
        const total = list.reduce((prev, cur) => prev + cur.count ?? 0, 0)
        setBusinessLogicData({ total, list })
    }, [donutData])

    useEffect(() => {
        getStandardizedRateList()
    }, [])

    const getStandardizedRateList = async () => {
        try {
            const res = await getStandardizedRate()
            if (res && res?.length) {
                setStandardizedRate(res)
            }
        } catch (err) {
            formatError(err)
            setStandardizedRate([])
        }
    }

    const empty = () => {
        return <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
    }

    const handleToArchitecture = () => {
        navigate('architecture')
    }

    return (
        <div className={styles.secondLine}>
            <Row style={{ width: '100%', columnGap: '16px' }}>
                <Col style={{ width: 'calc(60% + 8px)' }}>
                    <div className={styles.secondLineItem}>
                        <div className={styles.assetGraph}>
                            <div className={styles.graphTitle}>
                                <div>资产架构</div>
                                <div onClick={handleToArchitecture}>
                                    <span>详情</span>
                                    <RightOutlined />
                                </div>
                            </div>
                            <div className={styles.graph}>
                                <div className={styles.graphContent}>
                                    <AssetSnapshot />
                                </div>
                            </div>
                        </div>
                    </div>
                </Col>
                <Col style={{ width: 'calc(40% - 24px)' }}>
                    <div
                        className={classnames(
                            styles.secondLineItem,
                            styles.rightSecondLineItem,
                        )}
                    >
                        <div className={styles.groupTop}>
                            <div className={styles.titleBox}>
                                <div className={styles.title}>
                                    <div className={styles.tips}>
                                        {__('逻辑实体占比')}
                                    </div>
                                    <div className={styles.subTips}>
                                        {__(
                                            '以主题域分组维度统计，逻辑实体分布情况',
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.graphWrapper}>
                                {businessLogicData &&
                                businessLogicData?.list?.length > 0 ? (
                                    <PieGraph
                                        dataInfo={businessLogicData?.list}
                                        title={__('逻辑实体')}
                                        content={businessLogicData?.total || 0}
                                    />
                                ) : (
                                    empty()
                                )}
                            </div>

                            {businessLogicData &&
                                businessLogicData?.list?.length > 0 && (
                                    <div className={styles.topBox}>
                                        <div className={styles.tips}>
                                            <CrownColored
                                                style={{
                                                    fontSize: '20px',
                                                    marginRight: '8px',
                                                }}
                                            />
                                            {__('TOP 3 ')}
                                            {__('主题域分组')}
                                        </div>
                                        <div className={styles.topItemBox}>
                                            {businessLogicData?.list
                                                ?.slice(0, 3)
                                                .map((item, index) => {
                                                    return (
                                                        <div
                                                            className={
                                                                styles.detailWrapper
                                                            }
                                                            key={index}
                                                        >
                                                            <span
                                                                className={classnames(
                                                                    styles.circle,
                                                                    styles[
                                                                        `top${
                                                                            index +
                                                                            1
                                                                        }`
                                                                    ],
                                                                )}
                                                            >
                                                                {index + 1}
                                                            </span>
                                                            <span
                                                                className={
                                                                    styles.data
                                                                }
                                                            >
                                                                <span
                                                                    title={
                                                                        item.type
                                                                    }
                                                                    className={
                                                                        styles.type
                                                                    }
                                                                >
                                                                    {item.type}
                                                                </span>
                                                                <span
                                                                    className={
                                                                        styles.value
                                                                    }
                                                                >
                                                                    {/* {`${(
                                                            (item.value /
                                                                (businessLogicData?.total ||
                                                                    1)) *
                                                            100
                                                        ).toFixed(2)}%`} */}
                                                                    {item.value}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    </div>
                                )}
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    )
}

export default memo(SecondLine)
