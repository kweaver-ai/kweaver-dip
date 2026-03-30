import React from 'react'
import { Button } from 'antd'
import { UpOutlined, DownOutlined } from '@ant-design/icons'
import __ from '../locale'
import styles from '../styles.module.less'

interface IPageInfo {
    showItems: number
    totalItems: number
}

interface IPageTurning {
    pageInfo: IPageInfo
    defaultShowItems: number
    onShowLess: () => void
    onShowMore: () => void
}

const PageTurning: React.FC<IPageTurning> = ({
    pageInfo,
    defaultShowItems,
    onShowLess,
    onShowMore,
}) => {
    const { showItems, totalItems } = pageInfo

    return (
        <div>
            {totalItems > defaultShowItems ? (
                <div className={styles.pageTurning}>
                    {totalItems > showItems ? (
                        <div
                            onClick={onShowMore}
                            className={styles.buttonWrpper}
                        >
                            <Button type="link" className={styles.moreButton}>
                                {__('展开更多')}
                            </Button>
                            <DownOutlined className={styles.icon} />
                        </div>
                    ) : null}
                    {showItems === 0 ? null : (
                        <div
                            onClick={onShowLess}
                            className={styles.buttonWrpper}
                        >
                            <Button type="link" className={styles.lessButton}>
                                {__('收起')}
                            </Button>
                            <UpOutlined className={styles.icon} />
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    )
}

export default PageTurning
