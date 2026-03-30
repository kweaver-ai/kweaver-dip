import { Breadcrumb, Drawer } from 'antd'
import React, { useContext } from 'react'
import { LeftOutlined } from '@ant-design/icons'
import { MicroWidgetPropsContext } from '@/context'
import { isMicroWidget } from '@/core'
import ExplorationRules from '../DatasourceExploration/ExplorationRules'
import { ExplorationType } from '../DatasourceExploration/const'
import styles from './styles.module.less'
import __ from './locale'

function ExplorationRuleView({ ruleTip, onClose }: any) {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
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
                position: isMicroWidget({ microWidgetProps })
                    ? 'fixed'
                    : 'absolute',
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
            <div className={styles['rule-preview']}>
                <div className={styles['rule-preview-title']}>
                    <div
                        className={styles['rule-preview-title-return']}
                        onClick={onClose}
                    >
                        <LeftOutlined
                            className={styles['rule-preview-title-return-icon']}
                        />
                        <span className={styles.return}>{__('返回')}</span>
                    </div>
                    <Breadcrumb>
                        <Breadcrumb.Item>
                            <a onClick={onClose}>{__('数据预览')}</a>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>
                            {__('查看数据探查规则')}
                        </Breadcrumb.Item>
                    </Breadcrumb>
                </div>

                <div className={styles['rule-preview-rules']}>
                    <ExplorationRules
                        explorationType={ExplorationType.FormView}
                        viewMode
                        sampleTip={ruleTip}
                    />
                </div>
            </div>
        </Drawer>
    )
}

export default ExplorationRuleView
