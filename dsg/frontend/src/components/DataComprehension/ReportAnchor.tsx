import React, { HTMLAttributes, useState } from 'react'
import { Anchor, Button, Tooltip } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { AnchorContainer } from 'antd/lib/anchor/Anchor'
import styles from './styles.module.less'
import __ from './locale'
import { ReactComponent as hoverNavigation } from '@/icons/svg/outlined/hoverNavigation.svg'
import CommonIcon from '../CommonIcon'
import { IdimensionModel } from '@/core'
import { ILinkModel, reportClassify } from './const'

const { Link } = Anchor

interface IReportAnchor extends HTMLAttributes<HTMLDivElement> {
    details: IdimensionModel
    targetOffset?: number
    container?: AnchorContainer
}

/**
 * 报告导航
 * @param details 详情
 * @param targetOffset 锚点滚动偏移量
 * @param container 滚动的容器
 */
const ReportAnchor: React.FC<IReportAnchor> = ({
    details,
    targetOffset = 24,
    container,
    ...props
}) => {
    // 导航显示/隐藏
    const [show, setShow] = useState<boolean>(true)

    const renderLink = (data: ILinkModel[], level: number) => {
        return data.map((d) => {
            return (
                <div key={d.key}>
                    <div
                        className={styles.linkWrap}
                        style={{ marginLeft: level * 16, marginTop: -2 }}
                    >
                        <div className={styles.linkDot} />
                        <Link
                            href={`#${d.key}`}
                            title={d.title}
                            className={styles.link}
                        />
                    </div>
                    {d.children && renderLink(d.children, level + 1)}
                </div>
            )
        })
    }

    return (
        <div className={styles.reportAnchorWrap} {...props}>
            <div hidden={show}>
                <Tooltip title={__('展开导航')} placement="bottom">
                    <Button
                        shape="circle"
                        icon={<CommonIcon icon={hoverNavigation} />}
                        size="large"
                        onClick={() => setShow(true)}
                        className={styles.ra_hoverBtn}
                    />
                </Tooltip>
            </div>
            <div hidden={!show} className={styles.ra_contentWrap}>
                <div className={styles.ra_titleWrap}>
                    <div className={styles.ra_title}>{__('导航')}</div>
                    <CloseOutlined
                        className={styles.ra_close}
                        onClick={() => setShow(false)}
                    />
                </div>
                <Anchor
                    className={styles.anchorWrap}
                    affix={false}
                    bounds={targetOffset}
                    targetOffset={targetOffset}
                    getContainer={() =>
                        container ||
                        document.getElementById('reportWrap') ||
                        document.body
                    }
                >
                    {renderLink(reportClassify(details), 0)}
                </Anchor>
            </div>
        </div>
    )
}
export default ReportAnchor
