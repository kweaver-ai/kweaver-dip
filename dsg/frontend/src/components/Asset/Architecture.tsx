import React, { memo, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LeftOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { Breadcrumb } from 'antd'
import AssetGraph from './components/AssetGraph'
import styles from './styles.module.less'
import BizIntro from './components/BizIntro'
import { formatError, getSubjectDomain, getSubjectDomainDetail } from '@/core'
import {
    AssetNodeType,
    calcDataTypes,
    transformData,
} from './components/AssetGraph/helper'
import Loader from '@/ui/Loader'
import __ from './locale'
import { LabelType } from './components/Labels'

function AssetArchitecture() {
    const navigate = useNavigate()
    const [current, setCurrent] = useState<string>()
    const [searchParams, setSearchParams] = useSearchParams()
    const bizId = searchParams.get('bizId') || undefined
    const [data, setData] = useState<any>()
    const [loading, setLoading] = useState<boolean>(false)
    const [domain, setDomain] = useState<any>()
    const [group, setGroup] = useState<any>()
    const [listTypes, setListTypes] = useState<LabelType[]>()

    const getDomain = async () => {
        const params: any = {
            is_all: true,
            limit: 2000,
        }
        let levelOne: string
        let levelTwo: string
        if (bizId) {
            levelOne = AssetNodeType.SUBJECTGDOMAIN
            levelTwo = AssetNodeType.BUSINESSOBJ
            params.parent_id = bizId
        } else {
            levelOne = AssetNodeType.SUBJECTGROUP
            levelTwo = AssetNodeType.SUBJECTGDOMAIN
        }
        params.type = `${levelOne},${levelTwo}`

        // 主题域分组详情展示 业务对象+业务活动
        if (bizId) {
            params.type += `,${AssetNodeType.BUSINESSACT}`
        }

        try {
            setLoading(true)

            const getRoot = bizId
                ? getSubjectDomainDetail(bizId)
                : Promise.resolve({
                      id: 'root',
                      type: AssetNodeType.ROOT,
                      name: __('资产架构'),
                  })

            const [{ value: node }, { value: res }]: any =
                await Promise.allSettled([getRoot, getSubjectDomain(params)])

            // 为统计方便转换activity => object
            const listArr = (res?.entries ?? []).map((o) =>
                o.type === AssetNodeType.BUSINESSACT
                    ? { ...o, type: AssetNodeType.BUSINESSOBJ }
                    : o,
            )
            setListTypes(
                calcDataTypes(listArr, node?.id !== 'root' ? 'L1' : undefined),
            )
            const childs = transformData(listArr as any, levelOne, levelTwo)
            const root = {
                ...(node ?? {}),
                children: childs,
            }
            setData(root)
            if (node) {
                setDomain(bizId ? node : undefined)
            }

            if (!bizId) {
                const groupArr = res?.entries?.filter(
                    (o) => o.type === AssetNodeType.SUBJECTGROUP,
                )
                setGroup(groupArr)
            } else if (!group) {
                const groupRes = await getSubjectDomain({
                    limit: 2000,
                    is_all: true,
                    type: AssetNodeType.SUBJECTGROUP,
                })
                setGroup(groupRes?.entries)
            }
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setCurrent(bizId)
        getDomain()
    }, [bizId])

    const handleBack = () => {
        if (current) {
            searchParams.delete('bizId')
            setSearchParams(searchParams)
            return
        }
        navigate('/asset-view', { replace: true })
    }

    const handleTarget = (path: string) => {
        if (path) {
            navigate(path)
        }
    }

    const routeLine = useMemo(() => {
        return (
            <Breadcrumb>
                <Breadcrumb.Item>
                    <a onClick={() => handleTarget('/asset-view')}>
                        {__('资产全景')}
                    </a>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    {current ? (
                        <a
                            onClick={() =>
                                handleTarget('/asset-view/architecture')
                            }
                        >
                            {__('资产架构详情')}
                        </a>
                    ) : (
                        __('资产架构详情')
                    )}
                </Breadcrumb.Item>
                {current && (
                    <Breadcrumb.Item>{__('业务对象分组详情')}</Breadcrumb.Item>
                )}
            </Breadcrumb>
        )
    }, [current])

    return (
        <div className={styles['asset-architecture']}>
            <div className={styles['asset-architecture-title']}>
                <div
                    className={styles['asset-architecture-title-return']}
                    onClick={handleBack}
                >
                    <LeftOutlined
                        className={
                            styles['asset-architecture-title-return-icon']
                        }
                    />
                    <span className={styles.return}>{__('返回')}</span>
                </div>
                {routeLine}
            </div>
            {current && <BizIntro data={domain} bizId={bizId} group={group} />}
            <div
                className={classnames(
                    styles['asset-architecture-graph'],
                    !!current && styles['show-desc'],
                )}
            >
                {loading ? (
                    <Loader />
                ) : (
                    <AssetGraph data={data} listTypes={listTypes} />
                )}
            </div>
        </div>
    )
}

export default memo(AssetArchitecture)
