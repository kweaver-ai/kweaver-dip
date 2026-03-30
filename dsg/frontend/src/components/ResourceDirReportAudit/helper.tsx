import { ModalFuncProps } from 'antd'

import { ExclamationCircleFilled } from '@ant-design/icons'
import { confirm } from '@/utils/modalHelper'
import DataCatlgAbstract from '../DataAssetsCatlg/DataCatlgAbstract'
import DataConsanguinity from '../DataConsanguinity'
import DataPreview from '../DatasheetView/DataPreview'
import { DataServiceType, TabKey } from '../ResourcesDir/const'
import DirBasicInfo from '../ResourcesDir/DirBasicInfo'
import DirColumnInfo from '../ResourcesDir/DirColumnInfo'
import __ from './locale'

/**
 * 操作提示 modal
 */
export const PromptModal = ({ ...porps }: ModalFuncProps) => {
    confirm({
        icon: <ExclamationCircleFilled style={{ color: '#FAAD14' }} />,
        focusTriggerAfterClose: false, // 取消后不触发按钮聚焦
        okText: __('确定'),
        cancelText: __('取消'),
        keyboard: false,
        ...porps,
    })
}

interface DirItemsComponentType {
    catalogId: string
    formViewId?: string
    ref: any
    tabkey: TabKey
}
export const DirItemsComponent = ({
    catalogId,
    ref,
    tabkey,
    formViewId,
}: DirItemsComponentType) => {
    switch (tabkey) {
        case TabKey.BASIC:
            return <DirBasicInfo catalogId={catalogId} ref={ref} isAudit />
        case TabKey.COLUMN:
            return <DirColumnInfo catalogId={catalogId} showTitle />
        case TabKey.RELATEDCATALOG:
            return (
                <div style={{ height: '100%' }}>
                    <DataCatlgAbstract catalogId={catalogId} />
                </div>
            )
        case TabKey.CONSANGUINITYANALYSIS:
            return (
                <DataConsanguinity
                    id={formViewId || ''}
                    dataServiceType={DataServiceType.DirContent}
                />
            )
        case TabKey.DATAPREVIEW:
            return <DataPreview dataViewId={formViewId || ''} />
        default:
            return <div />
    }
}
