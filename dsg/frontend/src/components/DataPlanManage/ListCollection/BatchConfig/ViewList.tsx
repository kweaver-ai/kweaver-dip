import { memo } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import { Empty } from '@/ui'
import __ from './locale'
import styles from './styles.module.less'
import ViewItem from './ViewItem'

const ViewList = ({ data }: any) => {
    return (
        <div className={styles['view-list']}>
            {data?.length > 0 ? (
                <>
                    <div className={styles['view-list-top']}>
                        <span>
                            {__('已选资源')} ({data?.length ?? 0})
                        </span>
                    </div>
                    <div className={styles['view-list-list']}>
                        {data?.map((it) => (
                            <div
                                key={it?.id}
                                className={styles['view-list-item']}
                            >
                                <ViewItem
                                    title={it?.business_name}
                                    desc={it?.technical_name}
                                />
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className={styles.empty}>
                    <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                </div>
            )}
        </div>
    )
}

export default memo(ViewList)
