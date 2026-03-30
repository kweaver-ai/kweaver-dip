import { FC, ReactNode, useEffect, useContext } from 'react'
import { Col, Row } from 'antd'
import { noop } from 'lodash'
import { LeftOutlined } from '@ant-design/icons'
import styles from './styles.module.less'

import __ from './locale'
import GlobalMenu from '@/components/GlobalMenu'

export interface IHeader {
    needReturn: boolean
    group: Array<number>
    headerNodes: Array<ReactNode>
    onReturn?: () => void
}

const Header: FC<IHeader> = ({
    needReturn,
    group,
    headerNodes,
    onReturn = noop,
}) => {
    return (
        <div className={styles.drawerHeader}>
            <Row style={{ width: '100%' }}>
                {group?.length &&
                    group.map((currentSpan, index) => {
                        if (needReturn && index === 0) {
                            return (
                                <Col span={currentSpan}>
                                    <div className={styles.returnBar}>
                                        <GlobalMenu />
                                        <div
                                            onClick={() => {
                                                onReturn()
                                            }}
                                            className={styles.returnWrapper}
                                        >
                                            <LeftOutlined />
                                            <div className={styles.return}>
                                                {__('返回')}
                                            </div>
                                        </div>
                                        <div>
                                            {headerNodes?.[index] || null}
                                        </div>
                                    </div>
                                </Col>
                            )
                        }
                        return (
                            <Col span={currentSpan}>
                                {headerNodes?.[index] || null}
                            </Col>
                        )
                    })}
            </Row>
        </div>
    )
}

export default Header
