import { Anchor } from 'antd'
import { CheckCircleFilled, ExclamationCircleFilled } from '@ant-design/icons'
import React from 'react'
import styles from './styles.module.less'
import __ from './locale'

const { Link } = Anchor

interface IReportAnchorComponent {
    unCheckedFormLength: number
}

const ReportAnchor: React.FC<IReportAnchorComponent> = ({
    unCheckedFormLength,
}) => {
    const getCurrentAnchor = () => {
        return '#components-anchor-standard'
    }

    const getTitle = (title: string) => {
        return (
            <span>
                {title}
                {unCheckedFormLength === 0 ? (
                    <CheckCircleFilled
                        style={{
                            color: '#126EE3',
                            paddingLeft: '4px',
                        }}
                    />
                ) : (
                    <ExclamationCircleFilled
                        style={{
                            color: '#FAAC14',
                            paddingLeft: '4px',
                        }}
                    />
                )}
            </span>
        )
    }

    return (
        <Anchor getCurrentAnchor={getCurrentAnchor} className={styles.affix}>
            <Link href="#components-anchor-summary" title={__('摘要')} />
            <Link href="#components-anchor-flow" title={__('流程')} />
            <Link
                href="#components-anchor-standard"
                title={getTitle(__('标准'))}
            />
            <Link href="#components-anchor-target" title={__('指标')} />
            <Link href="#components-anchor-process" title={__('加工')} />
            <Link href="#components-anchor-quality" title={__('质量')} />
        </Anchor>
    )
}

export default ReportAnchor
