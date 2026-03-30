import { useMemo, useState } from 'react'
import { Button } from 'antd'
import SelectedList from './SelectedList'
import { ClassificationContextProvider } from './ClassificationProvider'
import styles from './styles.module.less'
import __ from '../locale'
import ClassifyTable from './ClassifyTable'
import GradingTable from './GradingTable'

import { GradeLabelStatusEnum } from '@/core'
import { getActualUrl } from '@/utils'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'
import { Empty } from '@/ui'
import empty from '@/assets/dataEmpty.svg'

interface ClassificationProps {
    objectiveId: string
}
const Classification = ({ objectiveId }: ClassificationProps) => {
    const [selectedAttribute, setSelectedAttribute] = useState<any>({})
    const [labelStatus] = useGradeLabelState()
    const [emptyStatus, setEmptyStatus] = useState(false)

    const contextValue = useMemo(() => {
        return {
            selectedAttribute,
            setSelectedAttribute,
            isEmpty: emptyStatus,
            updateEmptyStatus: setEmptyStatus,
        }
    }, [selectedAttribute, setSelectedAttribute, emptyStatus, setEmptyStatus])

    return (
        <div className={styles.classificationContainer}>
            <ClassificationContextProvider value={contextValue}>
                {emptyStatus ? (
                    <div className={styles.emptyWrapper}>
                        <Empty
                            iconSrc={empty}
                            desc={
                                <div className={styles.description}>
                                    <div className={styles.item}>
                                        {__('暂无属性')}
                                    </div>
                                    <div className={styles.item}>
                                        {__('需要先定义属性才能进行配置')}
                                    </div>
                                </div>
                            }
                        />
                    </div>
                ) : (
                    <>
                        <div className={styles.leftContainer}>
                            <SelectedList objectiveId={objectiveId} />
                        </div>
                        {selectedAttribute && (
                            <div className={styles.rightContainer}>
                                <div className={styles.title}>
                                    <div>
                                        <span className={styles.titleText}>
                                            {__('识别规则')}
                                        </span>
                                        <span className={styles.titleDesc}>
                                            {__(
                                                '（对库表进行数据探查时，将按照以下规则识别分类分级）',
                                            )}
                                        </span>
                                    </div>
                                    {/* <Button
                                        type="link"
                                        onClick={() => {
                                            window.open(
                                                getActualUrl(
                                                    '/systemConfig/metadataManage',
                                                ),
                                            )
                                        }}
                                    >
                                        {__('去探查')}
                                    </Button> */}
                                </div>
                                <div className={styles.firstTable}>
                                    <ClassifyTable />
                                </div>
                                {labelStatus && (
                                    <div className={styles.gradeTable}>
                                        <GradingTable />
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </ClassificationContextProvider>
        </div>
    )
}

export default Classification
