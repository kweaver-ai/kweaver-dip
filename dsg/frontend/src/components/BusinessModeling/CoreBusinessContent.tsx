import { FC, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BizModelType } from '@/core'
import styles from './styles.module.less'
import ContentTabs from './ContentTabs'
import __ from './locale'
import BusinessModelProvider from './BusinessModelProvider'

interface CoreBusinessContentProps {
    businessModelType?: BizModelType
}

const CoreBusinessContent: FC<CoreBusinessContentProps> = ({
    businessModelType = BizModelType.BUSINESS,
}) => {
    const [coreBusinessId, setCoreBusinessId] = useState<string>()
    const { id } = useParams()

    useEffect(() => {
        setCoreBusinessId(id)
    }, [id])

    return (
        <div className={styles.coreBusinessContentWrapper}>
            <BusinessModelProvider
                businessModelType={businessModelType}
                id={coreBusinessId}
            >
                <ContentTabs id={coreBusinessId || ''} />
            </BusinessModelProvider>
        </div>
    )
}

export default CoreBusinessContent
