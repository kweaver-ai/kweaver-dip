import React, { useEffect, useRef, useState } from 'react'
import { Col, Divider, Row } from 'antd'
import classnames from 'classnames'
import { LeftOutlined } from '@ant-design/icons'
import { formatError, getDataCatalogMount } from '@/core'
import { DataCatlgOutlined } from '@/icons'
import __ from '../locale'
import styles from './styles.module.less'
import ContentTabs from '@/components/ResourcesDir/ContentTabs'
import { TabKey } from '@/components/ResourcesDir/const'
import { DirItemsComponent } from '@/components/ResourcesDir/helper'
import CustomDrawer from '@/components/CustomDrawer'

interface IDirContentDrawer {
    open: boolean
    onClose: (flag?: boolean) => void
    catlgId: string
    name: string
    style?: any
}
// 页面路径中获取参数
const DirContentDrawer = (props: IDirContentDrawer) => {
    const { open, onClose, catlgId, name, style } = props
    const [activeKey, setActiveKey] = useState<TabKey>(TabKey.BASIC)
    const needPagePadding = [TabKey.BASIC, TabKey.COLUMN, TabKey.SAMPLTDATA]

    const [mountResource, setMountResource] = useState<any>()

    const ref = useRef({
        getDirName: () => {},
    })

    useEffect(() => {
        if (catlgId) {
            getDirContent()
        }
    }, [catlgId])

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
        <CustomDrawer
            open={open}
            isShowFooter={false}
            bodyStyle={{
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
            }}
            onClose={(e: any) => onClose(e)}
            isShowHeader={false}
            customHeaderStyle={{ display: 'none' }}
            customBodyStyle={{
                height: '100%',
                background: '#f0f2f6',
                position: 'relative',
                overflow: 'hidden',
            }}
            style={
                style || {
                    position: 'fixed',
                    width: '100vw',
                    height: '100vh',
                }
            }
        >
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
                                    <div
                                        onClick={() => onClose()}
                                        className={styles.returnInfo}
                                    >
                                        <LeftOutlined
                                            className={styles.returnArrow}
                                        />
                                        <span className={styles.returnText}>
                                            {__('返回')}
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
                        <DirItemsComponent
                            ref={ref}
                            tabkey={activeKey}
                            catalogId={catlgId}
                            formViewId={mountResource?.resource_id}
                        />
                    </div>
                </div>
            </div>
        </CustomDrawer>
    )
}

export default DirContentDrawer
