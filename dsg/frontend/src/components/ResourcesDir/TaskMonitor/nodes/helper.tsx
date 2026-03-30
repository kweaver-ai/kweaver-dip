import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { RecordTypeText } from '../helper'
import styles from './styles.module.less'

export const getTableContent = (sourceFromName: string, sourceType: string) => {
    return (
        <div className={styles.table}>
            <div className={styles['table-title']}>
                <FontIcon
                    name="icon-shujubiao-xianxing"
                    type={IconType.FONTICON}
                    style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.85)' }}
                />
                <div className={styles.title} title={sourceFromName}>
                    {sourceFromName || '--'}
                </div>
            </div>
            <div className={styles['table-desc']} hidden={!sourceType}>
                {RecordTypeText?.[sourceType]}
            </div>
        </div>
    )
}
