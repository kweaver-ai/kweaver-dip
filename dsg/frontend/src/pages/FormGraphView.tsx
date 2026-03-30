import * as React from 'react'
import FormGraphComponent from '@/components/FormGraph'
import BusinessModelProvider from '@/components/BusinessModeling/BusinessModelProvider'
import { BizModelType } from '@/core'

const FormGraph = () => {
    return (
        <BusinessModelProvider businessModelType={BizModelType.BUSINESS}>
            <FormGraphComponent />
        </BusinessModelProvider>
    )
}

export default FormGraph
