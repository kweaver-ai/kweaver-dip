import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Col, Divider, Row } from 'antd'
import classnames from 'classnames'
import { LeftOutlined } from '@ant-design/icons'
import { useQuery } from '@/utils'
import { formatError, getDataCatalogMount } from '@/core'
import { DataCatlgOutlined, FontIcon } from '@/icons'
import styles from './styles.module.less'
import ContentTabs from './ContentTabs'
import GlobalMenu from '../../GlobalMenu'
import { DirItemsComponent, TabKey } from './helper'
import { IconType } from '@/icons/const'

// 页面路径中获取参数
const InfoCatlgDetails = ({
    id = '',
    isShowReturnInfo = true,
}: {
    id?: string
    // 是否显示左上角返回信息
    isShowReturnInfo?: boolean
}) => {
    const [activeKey, setActiveKey] = useState<TabKey>(TabKey.BASIC)
    const needPagePadding = [TabKey.BASIC, TabKey.COLUMN]

    const navigator = useNavigate()

    const query = useQuery()

    const ref = useRef({
        getDirName: () => {},
    })

    // 左侧树选中tab
    const activeTabKey = query.get('activeTabKey')
    // 列表目录id--不能为空
    const catlgId = query.get('catlgId') || id
    const name = query.get('name') || ''

    const handleReturn = () => {
        const backUrl = query.get('backUrl') || `/dataService/infoRescCatlg`

        navigator(backUrl)
    }

    return (
        <div className={styles.dirContentWrapper}>
            <div className={styles.dirContent}>
                <div className={styles.top}>
                    <Row
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        {isShowReturnInfo && (
                            <Col span={6}>
                                <div className={styles.leftContent}>
                                    <GlobalMenu />
                                    <div
                                        onClick={handleReturn}
                                        className={styles.returnInfo}
                                    >
                                        <LeftOutlined
                                            className={styles.returnArrow}
                                        />
                                        <span className={styles.returnText}>
                                            返回
                                        </span>
                                    </div>
                                    <Divider
                                        className={styles.divider}
                                        type="vertical"
                                    />
                                    <div className={styles.modelIconWrapper}>
                                        <FontIcon
                                            name="icon-xinximulu1"
                                            type={IconType.COLOREDICON}
                                            className={styles.modelIcon}
                                        />
                                    </div>
                                    <div
                                        title={name}
                                        className={styles.businessName}
                                    >
                                        {name}
                                    </div>
                                </div>
                            </Col>
                        )}
                        <Col span={isShowReturnInfo ? 12 : 24}>
                            <ContentTabs
                                id={catlgId}
                                activeKey={activeKey}
                                setActiveKey={(value) => {
                                    setActiveKey(value)
                                }}
                            />
                        </Col>
                        <Col span={6} />
                    </Row>
                </div>
                <div
                    className={classnames(
                        styles.bottom,
                        needPagePadding.includes(activeKey)
                            ? styles.needPadding
                            : '',
                    )}
                >
                    <DirItemsComponent
                        ref={ref}
                        tabkey={activeKey}
                        catalogId={catlgId}
                    />
                </div>
            </div>
        </div>
    )
}

export default InfoCatlgDetails
