import __ from './locale'
import styles from './styles.module.less'

const PrimaryKeyLabel = () => {
    return <div className={styles.primaryKeyLabel}>{__('主键')}</div>
}

export default PrimaryKeyLabel
