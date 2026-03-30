import { Tooltip } from 'antd'
import { FieldTypeIcon } from '@/core'
import styles from './styles.module.less'
import __ from './locale'
import { FormatDataTypeToText } from '@/components/DatasheetView/DataQuality/helper'

interface IFieldItem {
    data: any
}
/**
 * 字段
 */
const FieldItem = ({ data }: IFieldItem) => {
    const {
        data_type,
        original_data_type,
        business_name,
        technical_name,
        primary_key,
    } = data

    return (
        <div className={styles.fieldItem}>
            <div className={styles.firstRow}>
                <Tooltip
                    title={
                        <span
                            style={{
                                color: 'rgba(0,0,0,0.85)',
                                fontSize: '12px',
                            }}
                        >
                            {FormatDataTypeToText(
                                data_type || original_data_type?.toLowerCase(),
                            )}
                        </span>
                    }
                    color="#fff"
                >
                    <span>
                        <FieldTypeIcon
                            dataType={
                                data_type || original_data_type?.toLowerCase()
                            }
                        />
                    </span>
                </Tooltip>
                <div className={styles.name} title={business_name}>
                    {business_name}
                </div>
                {primary_key ? (
                    <span className={styles.primaryKey}>{__('主键')}</span>
                ) : (
                    ''
                )}
            </div>
            <div className={styles.secondRow} title={technical_name}>
                {technical_name}
            </div>
        </div>
    )
}

export default FieldItem
