import styles from './styles.module.less'
import CognitiveSearch from '@/components/CognitiveSearch'

// 认知搜索
function CongSearch() {
    return (
        <div className={styles.serviceSupermarketPgWrapper}>
            <CognitiveSearch />
        </div>
    )
}

export default CongSearch
