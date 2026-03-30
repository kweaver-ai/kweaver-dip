import { noop, trim } from 'lodash'
import JSONBig from 'json-bigint'
import __ from '../locale'
import styles from './styles.module.less'
import empty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'

interface JsonPreViewType {
    value?: string
    onChange?: () => void
}
const JsonPreView = ({ value = '', onChange = noop }: JsonPreViewType) => {
    return value ? (
        <div className={styles.jsonPreviewContainer}>
            <pre style={{ whiteSpace: 'pre' }}>
                {JSONBig.stringify(JSONBig.parse(value), null, 4)}
            </pre>
        </div>
    ) : (
        <div className={styles.jsonPreviewContainer}>
            <div className={styles.previewEmpty}>
                <Empty
                    desc={
                        <div className={styles.emptyText}>
                            <div>{__('暂无数据')}</div>
                        </div>
                    }
                    iconSrc={empty}
                />
            </div>
        </div>
    )
}
export default JsonPreView
