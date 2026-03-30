import DataAssetsIndicator from '@/components/DataAssetsIndicator'
import styles from './styles.module.less'

// 仅指标 数据服务超市
function DataCatlgIndicator() {
    return (
        <div
            className={styles.serviceSupermarketPgWrapper}
            style={{ background: '#f0f2f6' }}
        >
            <DataAssetsIndicator />
        </div>
    )
}

export default DataCatlgIndicator
