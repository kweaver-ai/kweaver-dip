import { LeftOutlined } from '@ant-design/icons'
import { Col, Divider, Drawer, Row } from 'antd'
import classnames from 'classnames'
import { useEffect, useRef, useState } from 'react'
import { DataCatlgOutlined } from '@/icons'
import { formatError, getDataCatalogMount } from '@/core'
import { ResourceType } from '../ResourceDirReport/const'
import { TabKey } from '../ResourcesDir/const'
import DirAuditTabs from './DirAuditTabs'
import { DirItemsComponent } from './helper'
import __ from './locale'
import styles from './styles.module.less'

interface ICatlgAuditModal {
    item: any
    onClose?: () => void
}

function CatlgAuditDetail({ item, onClose }: ICatlgAuditModal) {
    const {
        catalog_title,
        catalog_id,
        resource_type = ResourceType.VIEW,
    } = item || {}
    const [activeKey, setActiveKey] = useState<TabKey>(TabKey.BASIC)
    const needPagePadding = [TabKey.BASIC, TabKey.COLUMN, TabKey.SAMPLTDATA]
    const [mountResource, setMountResource] = useState<any>()

    const ref = useRef({
        getDirName: () => {},
    })

    useEffect(() => {
        if (item?.catalog_id) {
            getDirContent()
        }
    }, [item])

    const getDirContent = async () => {
        if (!catalog_id) return
        try {
            const mountRes = await getDataCatalogMount(catalog_id)
            const mountInfo = mountRes?.mount_resource?.[0]
            setMountResource(mountInfo || {})
        } catch (error) {
            formatError(error)
        }
    }

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
                top: '0',
                left: 0,
                right: 0,
                bottom: 0,
                position: 'absolute',
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
            <div className={styles.dirAuditWrapper}>
                <div className={styles.dirAuditContent}>
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
                                        onClick={() => onClose?.()}
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
                                        title={catalog_title}
                                        className={styles.businessName}
                                    >
                                        {catalog_title}
                                    </div>
                                </div>
                            </Col>
                            <Col span={12}>
                                <DirAuditTabs
                                    type={resource_type}
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
                            catalogId={catalog_id}
                            formViewId={mountResource?.resource_id}
                        />
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default CatlgAuditDetail
