import classnames from 'classnames'
import { memo, useEffect, useMemo, useState } from 'react'
import { Result } from 'antd'
import { formatError, getSubjectDomain } from '@/core'
import Loader from '@/ui/Loader'
import __ from '../locale'
import AssetGraph from './AssetGraph'
import {
    AssetNodeType,
    calcDataTypes,
    transformData,
} from './AssetGraph/helper'
import styles from '../styles.module.less'
import { LabelType } from './Labels'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

function AssetSnapshot() {
    const [data, setData] = useState<any>()
    const [loading, setLoading] = useState<boolean>(false)

    const [listTypes, setListTypes] = useState<LabelType[]>()
    const { checkPermissions } = useUserPermCtx()

    const getDomain = async () => {
        const params: any = {
            is_all: true,
            limit: 2000,
        }

        const levelOne = AssetNodeType.SUBJECTGROUP
        const levelTwo = AssetNodeType.SUBJECTGDOMAIN
        params.type = `${levelOne},${levelTwo}`

        try {
            setLoading(true)

            const getRoot = Promise.resolve({
                id: 'root',
                type: AssetNodeType.ROOT,
                name: __('资产架构'),
            })

            const [{ value: node }, { value: res }]: any =
                await Promise.allSettled([getRoot, getSubjectDomain(params)])
            setListTypes(
                calcDataTypes(
                    res?.entries ?? [],
                    node?.id !== 'root' ? 'L1' : undefined,
                ),
            )
            const childs = transformData(
                (res?.entries || []) as any,
                levelOne,
                levelTwo,
            )
            const root = {
                ...(node ?? {}),
                children: childs,
            }
            setData(root)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getDomain()
    }, [])

    return (
        <div className={styles['asset-architecture']}>
            {checkPermissions('basicPermission') ? (
                <div className={classnames(styles['asset-architecture-graph'])}>
                    {loading ? (
                        <Loader />
                    ) : (
                        <AssetGraph
                            data={data}
                            listTypes={listTypes}
                            isSnapshot
                        />
                    )}
                </div>
            ) : (
                <div
                    className={classnames(
                        styles['asset-architecture-nopermission'],
                    )}
                >
                    <Result
                        status="warning"
                        title={
                            <div className={styles.errorTitle}>
                                {__('暂无访问权限')}
                            </div>
                        }
                    />
                </div>
            )}
        </div>
    )
}

export default memo(AssetSnapshot)
