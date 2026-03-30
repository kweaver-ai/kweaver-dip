import React, { ReactNode, useState, useEffect, useMemo } from 'react'
import classnames from 'classnames'
import { LeftOutlined } from '@ant-design/icons'
import { isEqual } from 'lodash'
import styles from './styles.module.less'
import __ from '../locale'
import { useCongSearchContext } from '../CogSearchProvider'
import FilterPanel from './FilterPanel/FilterPanel'
import searchEmptySmile from '@/assets/searchEmptySmile.png'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { Empty } from '@/ui'
import { AssetType } from '@/context'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { HasAccess } from '@/core'

interface IPageLayout {
    children?: ReactNode
}

function PageLayout({ children }: IPageLayout) {
    const { searchKey, filters, qaList, bigHeader, assetType } =
        useCongSearchContext()
    const [{ using }, updateUsing] = useGeneralConfig()
    // useCogAsstContext 已移除，相关功能已下线
    const { checkPermissions } = useUserPermCtx()

    const hasBusinessRoles = useMemo(
        () => checkPermissions(HasAccess.isHasBusiness),
        [checkPermissions],
    )

    const [expand, setExpand] = useState<boolean>(false)

    useEffect(() => {
        if (!filters || isEqual(filters, {})) {
            setExpand(false)
        }
    }, [filters])

    return (
        <div
            className={classnames(styles['page-layout'])}
            style={{
                width: '100%',
            }}
        >
            <div
                className={styles['page-layout-result']}
                style={{
                    height: bigHeader
                        ? 'calc(100vh - 108px)'
                        : 'calc(100vh - 60px)',
                }}
            >
                {!searchKey?.trim() ? (
                    <div style={{ paddingTop: 104 }}>
                        <Empty
                            desc={__('请在搜索框输入关键字后再进行搜索')}
                            iconSrc={searchEmptySmile}
                        />
                    </div>
                ) : (
                    <>
                        {/* {searchKey &&
                            qaList.length > 0 &&
                            assetType !== AssetType.INTERFACESVC &&
                            hasBusinessRoles && <QASearch data={qaList[0]} />} */}
                        <div
                            className={classnames(
                                styles['page-wrapper'],
                                searchKey &&
                                    qaList.length > 0 &&
                                    styles['page-wrapper-margin'],
                            )}
                            style={
                                using === 1
                                    ? { height: 'calc(100vh - 76px)' }
                                    : undefined
                            }
                        >
                            <span
                                className={classnames({
                                    [styles['page-layout-switch']]: true,
                                    [styles['is-hidden']]: expand,
                                })}
                                onClick={() => {
                                    setExpand(true)
                                }}
                            >
                                <span>{__('筛选')}</span>
                            </span>
                            <div
                                className={classnames({
                                    [styles['page-layout-filter']]: true,
                                    [styles['is-expand']]: expand,
                                    [styles['is-unexpand']]: !expand,
                                })}
                            >
                                <div
                                    className={classnames({
                                        [styles['page-layout-filter-tree']]:
                                            true,
                                        [styles['is-hidden']]: !expand,
                                    })}
                                >
                                    <div
                                        className={
                                            styles[
                                                'page-layout-filter-unexpand'
                                            ]
                                        }
                                        onClick={() => setExpand(false)}
                                    >
                                        <LeftOutlined />
                                    </div>
                                    {expand && <FilterPanel />}
                                </div>
                            </div>
                            {children}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default PageLayout
