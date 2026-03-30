import { Tooltip } from 'antd'
import styles from './styles.module.less'
import { ICardItem, thousandSplit } from '../../helper'
import { InfotipOutlined } from '@/icons'

type IAssetCardProps = {
    data: ICardItem
}

/**
 * 资产全景顶部卡片组件
 */
function AssetCard({ data }: IAssetCardProps) {
    const { label, value, tip, icon } = data
    return (
        <div className={styles['asset-card']}>
            <div className={styles['asset-card-info']}>
                <span className={styles.icon}>{icon}</span>
                <span className={styles.title}>{label}</span>
                {tip && (
                    <span className={styles.tip}>
                        <Tooltip
                            title={
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: 'rgba(0,0,0,0.85)',
                                    }}
                                >
                                    {tip}
                                </div>
                            }
                            overlayInnerStyle={{ width: 'max-content' }}
                            color="#fff"
                        >
                            <InfotipOutlined />
                        </Tooltip>
                    </span>
                )}
            </div>
            <div
                className={styles['asset-card-value']}
                title={`${thousandSplit(value)}`}
            >
                {thousandSplit(value)}
            </div>
        </div>
    )
}

export default AssetCard
