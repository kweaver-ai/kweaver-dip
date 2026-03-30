import * as React from 'react'
import { memo } from 'react'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'
import CustomDrawer from '@/components/CustomDrawer'
import styles from '@/components/SceneAnalysis/styles.module.less'

interface DataDetailItem {
    setViewDetailOpen: (value: boolean) => void
    // 当前项是否被选中
    viewDetailOpen?: boolean
    selectedResc: any
    isIntroduced: boolean
}

const DataDetail = ({
    viewDetailOpen,
    setViewDetailOpen,
    selectedResc,
    isIntroduced,
}: any) => {
    return (
        <LogicViewDetail
            open={viewDetailOpen}
            onClose={() => {
                setViewDetailOpen(false)
            }}
            hasPermission
            id={selectedResc?.id}
            isIntroduced={isIntroduced}
            headerStyle={{ display: 'block' }}
            headerTitle="库表详情"
            isShowHeader={false}
            isFromAi
            aiStyle={{ marginTop: '24px' }}
            fullHeight
            maskClosable
        />
    )
}

export default memo(DataDetail)
