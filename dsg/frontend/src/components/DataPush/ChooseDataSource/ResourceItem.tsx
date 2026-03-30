import classnames from 'classnames'
import { Radio } from 'antd'
import { DatasheetViewColored } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'
import { ICatalogedResourceListItem } from '@/core'

export interface IResourceItem {
    data: ICatalogedResourceListItem
    // 是否选中
    checked?: boolean
    // 选中事件
    onCheck?: (item: any) => void
}

const ResourceItem = (props: IResourceItem) => {
    const { data, checked, onCheck } = props
    return (
        <div
            className={classnames({
                [styles.resourceItem]: true,
                [styles['is-checked']]: checked,
            })}
            onClick={() => !checked && onCheck?.(data)}
        >
            <Radio checked={checked} />
            <div className={styles.resourceItem_icon}>
                <DatasheetViewColored />
            </div>
            <div className={styles.resourceItem_content}>
                <span title={data?.name} className={styles.name}>
                    {data?.name}
                </span>
                <span
                    title={`${data?.name}(${data?.code})`}
                    className={styles.catalogInfo}
                >
                    {__('挂接目录：')}
                    {data?.name}({data?.code})
                </span>
            </div>
        </div>
    )
}

export default ResourceItem
