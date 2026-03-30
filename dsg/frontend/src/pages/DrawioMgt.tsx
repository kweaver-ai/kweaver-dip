import DrawioMgt from '@/components/DrawioMgt'
import BusinessModelProvider from '@/components/BusinessModeling/BusinessModelProvider'
import { BizModelType } from '@/core'

const DrawioMgtPage = () => {
    return (
        <BusinessModelProvider businessModelType={BizModelType.BUSINESS}>
            <DrawioMgt />
        </BusinessModelProvider>
    )
}
export default DrawioMgtPage
