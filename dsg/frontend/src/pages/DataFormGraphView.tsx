import * as React from 'react'
import DataFormGraphComponent from '@/components/DataFormGraph'
import BusinessModelProvider from '@/components/BusinessModeling/BusinessModelProvider'
import { BizModelType } from '@/core'

const DataFormGraph = () => {
    return (
        <BusinessModelProvider businessModelType={BizModelType.DATA}>
            <DataFormGraphComponent />
        </BusinessModelProvider>
    )
}

export default DataFormGraph
