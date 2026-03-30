import { Checkbox } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { noop } from 'lodash'
import { FC, useEffect } from 'react'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import styles from './styles.module.less'

interface DataViewItemProps {
    onSelect?: (info: any, isSelected: boolean) => void
    onClick?: (id: string) => void
    showCheck?: boolean
    nodeInfo: any
    checked?: boolean
    showDelete?: boolean
    onDelete?: (id: string) => void
    checkDisabled?: boolean
}

const DataViewItem: FC<DataViewItemProps> = ({
    onSelect = noop,
    onClick = noop,
    showCheck = false,
    nodeInfo,
    checked = false,
    showDelete = false,
    onDelete = noop,
    checkDisabled = false,
}) => {
    return (
        <div
            onClick={() => {
                if (showCheck) {
                    onSelect(nodeInfo, !checked)
                }
                onClick(nodeInfo.id)
            }}
            className={styles.dataViewItemWrapper}
        >
            {showCheck && (
                <div className={styles.checkedWrapper}>
                    <Checkbox checked={checked} disabled={checkDisabled} />
                </div>
            )}
            <div className={styles.itemWrapper}>
                <div className={styles.iconWrapper}>
                    <FontIcon
                        type={IconType.COLOREDICON}
                        name="icon-shujubiaoshitu"
                    />
                </div>
                <div className={styles.textWrapper}>
                    <div
                        className={styles.firstText}
                        title={nodeInfo.business_name}
                    >
                        {nodeInfo.business_name || '--'}
                    </div>
                    <div
                        className={styles.lastText}
                        title={nodeInfo.technical_name}
                    >
                        {nodeInfo.technical_name || '--'}
                    </div>
                </div>
            </div>
            {showDelete && (
                <div onClick={onDelete} className={styles.deleteWrapper}>
                    <CloseOutlined />
                </div>
            )}
        </div>
    )
}

export default DataViewItem
