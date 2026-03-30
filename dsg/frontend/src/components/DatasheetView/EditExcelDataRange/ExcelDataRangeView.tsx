import { FC, useEffect } from 'react'
import { Col, Row } from 'antd'
import __ from '../locale'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'

/**
 * 单元格范围库表
 */
interface ExcelDataRangeViewProps {
    data: any // 数据
    size: [number, number] // 列宽
}
const ExcelDataRangeView: FC<ExcelDataRangeViewProps> = ({ data, size }) => {
    return (
        <div className={styles.dataRangeView}>
            <Row>
                <Col span={size[0]}>{__('Sheet页：')}</Col>
                <Col span={size[1]}>
                    <div className={styles.sheetWrapper}>
                        {data?.sheet?.map((item) => {
                            return (
                                <div
                                    key={item}
                                    className={styles.item}
                                    title={item}
                                >
                                    <FontIcon name="icon-sheetye" />
                                    <span className={styles.text}>{item}</span>
                                </div>
                            )
                        })}
                    </div>
                </Col>
            </Row>
            <Row>
                <Col span={size[0]}>{__('单元格范围：')}</Col>
                <Col span={size[1]}>{data?.cell_range?.join('-')}</Col>
            </Row>
            <Row>
                <Col span={size[0]}>{__('库表字段配置：')}</Col>
                <Col span={size[1]}>
                    {data?.has_headers ? __('选取首行字段') : __('自定义')}
                </Col>
            </Row>
            <Row>
                <Col span={size[0]}>{__('Sheet名作字段：')}</Col>
                <Col span={size[1]}>
                    {data.sheet_as_new_column ? __('是') : __('否')}
                </Col>
            </Row>
        </div>
    )
}

export default ExcelDataRangeView
