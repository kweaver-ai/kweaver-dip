import React, { useEffect, useState } from 'react'
import { LeftOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from './locale'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import GlobalMenu from '@/components/GlobalMenu'
import { ExplorationType } from '@/components/DatasheetView/DatasourceExploration/const'
import ExplorationForm from '@/components/DatasheetView/DatasourceExploration/ExplorationForm'

interface IJobConfig {
    id: string
    exploreReportStatus: any
    onClose: () => void
    isDrawer?: boolean
}

const JobConfig: React.FC<IJobConfig> = ({
    id,
    exploreReportStatus,
    onClose,
    isDrawer,
}) => {
    const [isChanged, setIsChanged] = useState<boolean>(true)
    // 多选项

    const onBack = () => {
        if (isChanged) {
            ReturnConfirmModal({
                onCancel: () => onClose(),
            })
        } else {
            onClose()
        }
    }

    return (
        <div
            className={classnames(
                styles.jobConfigWrapper,
                isDrawer && styles.isDrawer,
            )}
        >
            {!isDrawer && (
                <div className={styles.titleBox}>
                    <GlobalMenu />
                    <span className={styles.titleBtn} onClick={() => onBack()}>
                        <LeftOutlined style={{ marginRight: '8px' }} />{' '}
                        {__('返回')}
                    </span>
                    <div className={styles.titleLine} />
                    <div className={styles.titleText}>
                        {__('配置数据探查规则')}
                    </div>
                </div>
            )}
            <div className={styles.jobConfigBox}>
                <ExplorationForm
                    formViewId={id}
                    onClose={onClose}
                    explorationType={ExplorationType.FormView}
                />
            </div>
        </div>
    )
}

export default JobConfig
