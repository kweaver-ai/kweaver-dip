import { useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

import { TaskInfoProvider, initTaskInfoData } from '@/context'
import __ from './locale'
import styles from './styles.module.less'
import CompleteTaskHeader from '@/components/CompleteTaskHeader'
import IndicatorManage from '@/components/IndicatorManage'

const IndicatorDevelopment = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const taskId = searchParams.get('taskId') || ''
    const contentRef: any = useRef()
    // 侧边栏是否收起，默认false(展开)

    return (
        <TaskInfoProvider initTaskInfo={initTaskInfoData}>
            <div className={styles.needSiderBarPage}>
                <div className={styles.header}>
                    <CompleteTaskHeader />
                </div>
                <div className={styles.indicatorContainer}>
                    <div className={styles.indicatorContent} ref={contentRef}>
                        <IndicatorManage
                            collapsed
                            getContainer={() => contentRef.current}
                            taskId={taskId}
                        />
                    </div>
                </div>
            </div>
        </TaskInfoProvider>
    )
}
export default IndicatorDevelopment
