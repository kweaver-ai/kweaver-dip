import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Col, Divider, Dropdown, Row } from 'antd'
import classnames from 'classnames'
import {
    CaretDownOutlined,
    CaretUpOutlined,
    LeftOutlined,
} from '@ant-design/icons'
import { getActualUrl, useQuery } from '@/utils'
import { formatError, getDataCatalogMount } from '@/core'
import { DataCatlgOutlined, ModelFilledOutlined } from '@/icons'
import styles from './styles.module.less'
import ContentTabs from './ContentTabs'
import {
    ICatlgContent,
    IRescCatlg,
    IRescItem,
} from '@/core/apis/dataCatalog/index.d'
import { RescCatlgType, TabKey } from './const'
import GlobalMenu from '../GlobalMenu'
import { DirItemsComponent } from './helper'
import { DataViewProvider } from '../DatasheetView/DataViewProvider'

interface IDirDetailContent {
    // 传入的目录部分相关信息（如id,name，其余信息在组件内通过接口获取）
    catlgItem?: any
    // 为true表明目录详情页为抽屉形式显示
    isDrawer?: boolean
    onReturn?: () => void
}

// 页面路径中获取参数
const DirDetailContent = ({
    catlgItem = {},
    isDrawer = false,
    onReturn,
}: IDirDetailContent) => {
    const [activeKey, setActiveKey] = useState<TabKey>(TabKey.BASIC)
    const needPagePadding = [
        TabKey.BASIC,
        TabKey.COLUMN,
        TabKey.SAMPLTDATA,
        TabKey.FILEINFO,
    ]

    const navigator = useNavigate()

    const query = useQuery()
    const [mountResource, setMountResource] = useState<any>()

    const ref = useRef({
        getDirName: () => {},
    })

    // 左侧树选中tab
    const activeTabKey = query.get('activeTabKey')
    // 列表目录id--不能为空
    const [catlgId, name] = useMemo(() => {
        const { id, name: catlgName } = catlgItem
        if (isDrawer) {
            return [id, catlgName]
        }
        return [query.get('catlgId') || '', query.get('name') || '']
    }, [catlgItem])

    useEffect(() => {
        if (catlgId) {
            getDirContent()
        }
    }, [catlgId])

    const handleReturn = () => {
        const backUrl =
            query.get('backUrl') ||
            `/dataService/dataContent?activeTabKey=${activeTabKey}&tabKey=edited`

        // 判断是否来自 dataChecking/dataDirManage，如果是则添加 cd 前缀并使用 window 跳转
        if (backUrl.includes('dataChecking/dataDirManage')) {
            window.open(backUrl, '_self')
            return
        }

        navigator(backUrl)
    }

    const getDirContent = async () => {
        if (!catlgId) return
        try {
            const mountRes = await getDataCatalogMount(catlgId)
            const mountInfo = mountRes?.mount_resource?.[0]
            setMountResource(mountInfo || {})
        } catch (error) {
            formatError(error)
        }
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
                        <Col span={6}>
                            <div className={styles.leftContent}>
                                <GlobalMenu />
                                <div
                                    onClick={() => {
                                        if (onReturn) {
                                            onReturn()
                                        } else {
                                            handleReturn()
                                        }
                                    }}
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
                                    <DataCatlgOutlined
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
                        <Col span={12}>
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
                    <DataViewProvider>
                        <DirItemsComponent
                            ref={ref}
                            tabkey={activeKey}
                            catalogId={catlgId}
                            formViewId={mountResource?.resource_id}
                            updateActiveKey={setActiveKey}
                        />
                    </DataViewProvider>
                </div>
            </div>
        </div>
    )
}

export default DirDetailContent
