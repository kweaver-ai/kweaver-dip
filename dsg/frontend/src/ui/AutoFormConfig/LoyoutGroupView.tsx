import * as React from 'react'
import { ReactNode, useState, useEffect } from 'react'
import { Row, Col } from 'antd'
import styles from 'style.module.less'

interface LoyoutGroupViewType {
    children: Array<ReactNode>
    widths: Array<number>
}
const LoyoutGroupView = ({ children, widths }: LoyoutGroupViewType) => {
    return (
        <div>
            <Row gutter={16}>
                {children.map((child, index) => {
                    return <Col span={widths[index]}>{child}</Col>
                })}
            </Row>
        </div>
    )
}

export default LoyoutGroupView
