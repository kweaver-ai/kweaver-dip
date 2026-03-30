import ViewItem from './ViewItem'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'

const CheckedViewItem = ({ data, onDelete }: any) => {
    return (
        <div className={styles['view-list-item']}>
            <div className={styles['view-list-item-content']}>
                <ViewItem
                    title={data?.business_name}
                    desc={data?.technical_name}
                />
            </div>
            <div className={styles['view-list-item-icon']}>
                <FontIcon
                    name="icon-yichu"
                    type={IconType.FONTICON}
                    onClick={() => onDelete([data])}
                />
            </div>
        </div>
    )
}

const ViewList = ({ data, onDelete }: any) => {
    return (
        <div className={styles['view-list']}>
            {data?.length > 0 ? (
                <>
                    <div className={styles['view-list-top']}>
                        <span>已选择: {data?.length ?? 0} 个</span>
                        <span
                            hidden={data?.length === 0}
                            onClick={() => onDelete(data)}
                        >
                            全部移除
                        </span>
                    </div>
                    <div className={styles['view-list-list']}>
                        {data?.map((it) => (
                            <CheckedViewItem
                                key={it?.id}
                                data={it}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <div className={styles.empty}>
                    <Empty iconSrc={dataEmpty} desc="暂无数据" />
                </div>
            )}
        </div>
    )
}

export default ViewList
