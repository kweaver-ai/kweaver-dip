import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Col, Divider, Row } from 'antd'
import classnames from 'classnames'
import { LeftOutlined } from '@ant-design/icons'
import { IconType } from '@/icons/const'
import { FontIcon } from '@/icons'
import __ from '../locale'
import styles from './styles.module.less'
import ContentTabs from '@/components/InfoRescCatlg/Details/ContentTabs'
import {
    DirItemsComponent,
    TabKey,
} from '@/components/InfoRescCatlg/Details/helper'
import CustomDrawer from '@/components/CustomDrawer'

interface IInfoCatlgDetails {
    open: boolean
    onClose: (flag?: boolean) => void
    catalogId: string
    name: string
    style?: any
    onFavoriteChange?: (res) => void
}
// 页面路径中获取参数
const InfoCatlgDetails = (props: IInfoCatlgDetails) => {
    const { open, onClose, catalogId, name, style, onFavoriteChange } = props
    const [activeKey, setActiveKey] = useState<TabKey>(TabKey.BASIC)
    const needPagePadding = [TabKey.BASIC, TabKey.COLUMN]

    const ref: any = useRef()

    const catlgName = useMemo(() => {
        return ref?.current?.getDirName() || name
    }, [ref, name])

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
                            <Col span={12}>
                                <ContentTabs
                                    id={catalogId}
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
                            catalogId={catalogId}
                            onFavoriteChange={onFavoriteChange}
                        />
                    </div>
                </div>
            </div>
        </CustomDrawer>
    )
}

export default InfoCatlgDetails
