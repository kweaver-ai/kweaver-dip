import React, { ReactNode, useEffect, useMemo, useState } from 'react'
import { Collapse } from 'antd'
import { CaretDownFilled } from '@ant-design/icons'
import classnames from 'classnames'
import CustomDrawer from '@/components/CustomDrawer'
import styles from './styles.module.less'
import { CloseOutlined } from '@/icons'
import __ from '../../locale'
import TagPie from './TagPie'
import { AssetIcons } from '../../helper'
import ViewInfo from './ViewInfo'

const { Panel } = Collapse
interface IViewTagDrawerType {
    item: any
    showHierarchy?: boolean
    open?: boolean
    onClose: (flag?: boolean) => void
}

const PanelHeader = (title: ReactNode, isExpand: boolean) => {
    return (
        <div className={styles['panel-header']}>
            <CaretDownFilled
                className={classnames(
                    styles['panel-header-icon'],
                    isExpand && styles.expand,
                )}
            />
            <span>{title}</span>
        </div>
    )
}

function ViewTagDrawer({
    item,
    showHierarchy,
    open,
    onClose,
}: IViewTagDrawerType) {
    const [activeKey, setActiveKey] = useState<string[]>(['pie', 'info'])

    const PanelList = useMemo(() => {
        return [
            {
                key: 'pie',
                title: '分级字段占比',
                element: <TagPie id={item?.id} />,
            },
            {
                key: 'info',
                title: '字段信息',
                element: (
                    <ViewInfo
                        id={item?.id}
                        type={item?.type}
                        unExpand={!(activeKey || []).includes('pie')}
                    />
                ),
            },
        ]
    }, [item, activeKey])

    return (
        <div className={styles['view-tag-drawer']}>
            <CustomDrawer
                open={open}
                destroyOnClose
                onCancel={onClose}
                onClose={() => onClose()}
                isShowHeader={false}
                isShowFooter={false}
                customBodyStyle={{
                    flexDirection: 'column',
                    height: '100%',
                }}
                contentWrapperStyle={{
                    width: '100%',
                    boxShadow: '0 0 10px 0px rgb(15 32 68 / 10%)',
                }}
                bodyStyle={{
                    width: 600,
                    padding: 0,
                }}
                style={{
                    position: 'relative',
                    width: 600,
                    right: '0',
                    height: '100%',
                }}
            >
                <div className={styles.content}>
                    <div className={styles['content-header']}>
                        <div className={styles['content-header-title']}>
                            <div className={styles.icon}>
                                {AssetIcons[item?.type]}
                            </div>
                            <div className={styles.title} title={item?.name}>
                                {item?.name}
                            </div>
                        </div>
                        <div>
                            <CloseOutlined
                                className={styles.closeIcon}
                                onClick={onClose}
                            />
                        </div>
                    </div>
                    <div className={styles['content-body']}>
                        <Collapse
                            bordered={false}
                            ghost
                            activeKey={activeKey}
                            onChange={(keys) => setActiveKey(keys as string[])}
                        >
                            {PanelList.map(
                                (o) =>
                                    (showHierarchy || o.key === 'info') && (
                                        <Panel
                                            key={o.key}
                                            header={PanelHeader(
                                                o.title,
                                                activeKey.includes(o.key),
                                            )}
                                            showArrow={false}
                                        >
                                            {o.element}
                                        </Panel>
                                    ),
                            )}
                        </Collapse>
                    </div>
                </div>
            </CustomDrawer>
        </div>
    )
}

export default ViewTagDrawer
