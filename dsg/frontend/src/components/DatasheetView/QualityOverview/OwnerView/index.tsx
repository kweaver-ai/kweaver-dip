import { Col, Row } from 'antd'
import { memo, useEffect, useState } from 'react'
import { CloseOutlined, FontIcon } from '@/icons'
import DepartmentTable from './DepartmentTable'
import __ from './locale'
import RankCard from './RankCard'
import styles from './styles.module.less'
import { formatError, getDepartExploreReports, SortDirection } from '@/core'
import { Loader } from '@/ui'
import { DefaultDepartParams } from '../const'
import DepartDrawer from '../DepartDrawer'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const OwnerView = () => {
    const [loading, setLoading] = useState(false)
    const [departVisible, setDepartVisible] = useState(false)
    const [currentDepart, setCurrentDepart] = useState<Record<string, any>>()
    // 优秀质量部门
    const [descData, setDescData] = useState([])
    // 质量待整改部门
    const [ascData, setAscData] = useState([])
    const [showTip, setShowTip] = useState(false)
    const [userInfo] = useCurrentUser()
    useEffect(() => {
        getData()
        checkTipShow()
    }, [])

    const checkTipShow = () => {
        if (
            !JSON.parse(localStorage.getItem('af_overview_close') || '{}')?.[
                userInfo.ID
            ]
        ) {
            setShowTip(true)
        }
    }

    const closeTipShow = () => {
        setShowTip(false)
        if (localStorage.getItem('af_overview_close') === null) {
            localStorage.setItem(
                'af_overview_close',
                JSON.stringify({
                    [userInfo.ID]: true,
                }),
            )
        } else {
            const guideInfo = JSON.parse(
                localStorage.getItem('af_overview_close') || '',
            )
            localStorage.setItem(
                'af_overview_close',
                JSON.stringify({
                    ...guideInfo,
                    [userInfo.ID]: true,
                }),
            )
        }
    }

    const getData = async () => {
        setLoading(true)
        const results = await Promise.allSettled([
            getDepartExploreReports({
                ...DefaultDepartParams,
                direction: SortDirection.DESC,
            }),
            getDepartExploreReports({
                ...DefaultDepartParams,
                direction: SortDirection.ASC,
            }),
        ])

        const [descResult, ascResult] = results
        if (descResult.status === 'fulfilled') {
            const list = descResult.value.entries.filter(
                (item) => (item.total_score || 0) > 0.85,
            )
            setDescData(list)
        } else {
            formatError(descResult.reason)
        }
        if (ascResult.status === 'fulfilled') {
            const list = ascResult.value.entries.filter(
                (item) => (item.total_score || 0) < 0.6,
            )
            setAscData(list)
        } else {
            formatError(ascResult.reason)
        }
        setLoading(false)
    }

    return (
        <div className={styles['owner-wrapper']}>
            {loading ? (
                <div className={styles['owner-wrapper-loading']}>
                    <Loader />
                </div>
            ) : (
                <>
                    <div
                        className={styles['owner-wrapper-alert']}
                        hidden={!showTip}
                    >
                        <div className={styles.title}>
                            <FontIcon
                                name="icon-xinxitishi"
                                style={{ fontSize: 14, color: '#126ee3' }}
                            />
                            <span>
                                {__('提示：当前统计数据为前一天的部门质量情况')}
                            </span>
                        </div>
                        <CloseOutlined
                            onClick={closeTipShow}
                            style={{
                                fontSize: 12,
                                cursor: 'pointer',
                                color: 'rgba(0, 0, 0, 0.65)',
                            }}
                        />
                    </div>
                    <div className={styles['owner-wrapper-content']}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <RankCard
                                    title={__('优秀质量部门')}
                                    tooltip={__(
                                        '显示部门质量得分位于85-100分之间的排名为前十名的部门',
                                    )}
                                    data={descData}
                                    isDesc
                                    onClick={(item) => {
                                        setCurrentDepart(item)
                                        setDepartVisible(true)
                                    }}
                                />
                            </Col>
                            <Col span={12}>
                                <RankCard
                                    title={__('质量待整改部门')}
                                    tooltip={__(
                                        '显示部门质量得分位于0-60分之间的排名为后十名的部门',
                                    )}
                                    data={ascData}
                                    onClick={(item) => {
                                        setCurrentDepart(item)
                                        setDepartVisible(true)
                                    }}
                                />
                            </Col>
                        </Row>

                        <div className={styles['owner-wrapper-content-table']}>
                            <DepartmentTable
                                onClick={(item) => {
                                    setCurrentDepart(item)
                                    setDepartVisible(true)
                                }}
                            />
                        </div>
                    </div>
                </>
            )}
            {departVisible && currentDepart && (
                <DepartDrawer
                    depart={currentDepart}
                    onClose={() => {
                        setDepartVisible(false)
                        setCurrentDepart(undefined)
                    }}
                />
            )}
        </div>
    )
}

export default memo(OwnerView)
