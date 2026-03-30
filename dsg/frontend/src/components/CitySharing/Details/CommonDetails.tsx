import { Col, Row } from 'antd'
import { applyFieldsConfig } from './helper'
import styles from './styles.module.less'

interface ICommonDetailsProps {
    configData?: any
    data?: any
    clickEvent?: { name: string; onClick: (data) => void }[]
}
const CommonDetails = ({
    configData = applyFieldsConfig,
    data = {},
    clickEvent = [],
}: ICommonDetailsProps) => {
    return (
        <Row className={styles['apply-info-row']}>
            {configData.map((item) => {
                return (
                    <Col
                        key={item.key}
                        className={styles['basic-item']}
                        span={item.span}
                    >
                        <div className={styles.label}>{item.label}：</div>
                        <div
                            className={styles.value}
                            onClick={
                                clickEvent.find((e) => e.name === item.key)
                                    ?.onClick || undefined
                            }
                        >
                            {item.render
                                ? item.render(data[item.key], data)
                                : data[item.key] || '--'}
                        </div>
                    </Col>
                )
            })}
        </Row>
    )
}

export default CommonDetails
