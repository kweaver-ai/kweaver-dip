import DataAssetsCatlg from '@/components/DataAssetsCatlg'
import styles from './styles.module.less'

// 数据资源目录（原名：服务超市）
function DataCatlg() {
    return (
        <div className={styles.serviceSupermarketPgWrapper}>
            <DataAssetsCatlg />
        </div>
    )
}

export default DataCatlg
