import React from 'react'
import DataCatlgAbstract from '../DataAssetsCatlg/DataCatlgAbstract'
import DataConsanguinity from '../DataConsanguinity'
import DataPreview from '../DatasheetView/DataPreview'
import { DataServiceType, TabKey } from '../ResourcesDir/const'
import DirColumnInfo from '../ResourcesDir/DirColumnInfo'
import __ from './locale'
import DirBasicInfo from '../ResourcesDir/DirBasicInfo'

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
