import { FC, useEffect, useState } from 'react'
import styles from './styles.module.less'
import __ from '../../locale'
import { LabelTitle } from '../../helper'
import {
    formatError,
    IBusinessIndicator,
    getCoreBusinessIndicatorDetail,
} from '@/core'
import { useBusinessModelContext } from '../../BusinessModelProvider'
import SourceTableView from './SourceTableView'

interface IDetailDataIndicator {
    indicatorId: string
}

const DetailDataIndicator: FC<IDetailDataIndicator> = ({ indicatorId }) => {
    const [indicatorInfo, setIndicatorInfo] = useState<IBusinessIndicator>()
    const { isDraft, selectedVersion } = useBusinessModelContext()
    useEffect(() => {
        getIndicatorInfo(indicatorId)
    }, [indicatorId])

    /**
     * 获取指标信息
     * @param indicatorId 指标ID
     * @returns 指标信息
     */
    const getIndicatorInfo = async (id: string) => {
        try {
            const res = await getCoreBusinessIndicatorDetail(id, {
                is_draft: isDraft,
                version_id: selectedVersion,
            })
            setIndicatorInfo(res)
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <div className={styles['common-detail']}>
            <div className={styles.commonDetailContent}>
                <LabelTitle
                    label={__('基本信息')}
                    id="component-indictor-base"
                />
                <div className={styles.contentWrapper}>
                    <div className={styles.contentItem}>
                        <span className={styles.label}>{__('指标名称：')}</span>
                        <span
                            className={styles.value}
                            title={indicatorInfo?.name}
                        >
                            {indicatorInfo?.name}
                        </span>
                    </div>
                    <div className={styles.contentItem}>
                        <span className={styles.label}>{__('指标编号：')}</span>
                        <span
                            className={styles.value}
                            title={indicatorInfo?.code}
                        >
                            {indicatorInfo?.code}
                        </span>
                    </div>
                    <div className={styles.contentItem}>
                        <span className={styles.label}>{__('描述：')}</span>
                        <span
                            className={styles.value}
                            title={indicatorInfo?.description}
                        >
                            {indicatorInfo?.description}
                        </span>
                    </div>
                </div>
                <LabelTitle
                    label={__('统计信息')}
                    id="component-indicator-statistics"
                />
                <div className={styles.contentWrapper}>
                    {indicatorInfo?.source_table?.map((item) => (
                        <SourceTableView key={item.table_id} tableData={item} />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default DetailDataIndicator
