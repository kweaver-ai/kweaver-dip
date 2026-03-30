import { memo, useMemo } from 'react'
import { PermissionScope } from '@/core'
import DepartView from './DepartView'
import OwnerView from './OwnerView'
import styles from './styles.module.less'
import { Loader } from '@/ui'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const QualityOverview = () => {
    const { checkPermission } = useUserPermCtx()
    // 是否拥有数据质量概览全部的权限
    const hasAllAccess = useMemo(() => {
        return (
            checkPermission([
                {
                    key: 'dataQualityOverview',
                    scope: PermissionScope.All,
                },
            ]) ?? false
        )
    }, [checkPermission])

    return (
        <div className={styles['overview-wrapper']}>
            {hasAllAccess === undefined ? (
                <div className={styles['overview-wrapper-loading']}>
                    <Loader />
                </div>
            ) : hasAllAccess ? (
                <OwnerView />
            ) : (
                <DepartView />
            )}
        </div>
    )
}

export default memo(QualityOverview)
