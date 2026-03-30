import BusinessArchitectureComp from '@/components/BusinessArchitecture'
import OrganizationMgmt from '@/components/OrganizationMgmt'
import styles from './styles.module.less'

function BusinessArchitecture() {
    return (
        <div className={styles.architectureWrapper}>
            {/* <div className={styles.title}>业务架构</div> */}
            {/* <BusinessArchitectureComp /> */}
            <OrganizationMgmt />
        </div>
    )
}

export default BusinessArchitecture
