import React, { useEffect, useState } from 'react'
import { Input } from 'antd'
import { useDebounce, useSize, useUpdateEffect } from 'ahooks'
import { trim } from 'lodash'
import classnames from 'classnames'
import { SearchOutlined } from '@ant-design/icons'
import {
    BusinessFormOutlined,
    BusinessMattersOutlined,
    BusinessSystemOutlined,
    ContainerOutlined,
    CoreBusinessOutlined,
    DepartmentOutlined,
    DistrictOutlined,
    DomainOutlined,
    OrganizationOutlined,
} from '@/icons'
import __ from './locale'
import styles from './styles.module.less'
import { formatError, ISystemItem, reqInfoSystemList } from '@/core'
import { Architecture, DataNode } from '../BusinessArchitecture/const'
import Empty from '@/ui/Empty'
import dataEmpty from '../../assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import Loader from '@/ui/Loader'
import { SearchInput } from '@/ui'

interface SelectIndicatorListType {
    onSelectSysId: (value) => void
    showPath?: boolean
    showTitle?: boolean
    canEmpty?: boolean // 能否展示空库表
    newSelNodeId?: string // 外部传入选中节点id
    onSelectedNode?: (node: any) => void
    needUncategorized?: boolean // 是否需要显示未分类
    unCategorizedKey?: string // 未分类的id
    unCategorizedName?: string // 未分类显示名称
}
const InfoSystem = ({
    onSelectSysId,
    showPath = true,
    showTitle = true,
    canEmpty = true,
    onSelectedNode,
    newSelNodeId,
    needUncategorized = false,
    unCategorizedKey = 'uncategory',
    unCategorizedName = __('未分类'),
}: SelectIndicatorListType) => {
    const [systems, setSystems] = useState<ISystemItem[]>([])
    const [keyword, setKeyword] = useState<string>('')
    const [sysId, setSysId] = useState<string>('')
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const uncategoryNode = {
        id: unCategorizedKey,
        name: unCategorizedName,
        description: '',
    }

    useEffect(() => {
        getSystems()
        onSelectedNode?.({})
    }, [])

    useEffect(() => {
        if (typeof newSelNodeId === 'string' && newSelNodeId !== sysId) {
            setSysId(newSelNodeId)
        }
    }, [newSelNodeId])

    useUpdateEffect(() => {
        getSystems()
    }, [keyword])

    const getSystems = async () => {
        setIsLoading(true)
        try {
            let { entries = [] } = await reqInfoSystemList({
                limit: 2000,
                offset: 1,
                keyword,
            })
            // const newSysArr = res.entries.map((item) => {
            //     const { path } = item
            //     const pathArr = path.split('/')
            //     const len = pathArr.length
            //     const depName = pathArr[len - 2]
            //     return { ...item, path: depName }
            // })
            // setSystems(newSysArr)
            if (!keyword && needUncategorized) {
                entries = [...entries, uncategoryNode]
            }
            setSystems(entries || [])
            // if (res.entries && res.entries.length > 0) {
            //     setSysId(newSysArr[0].id)
            //     onSelectSysId(newSysArr[0].id)
            //     onSelectedNode?.(newSysArr[0])
            // }
        } catch (error) {
            formatError(error)
        }
        setIsLoading(false)
    }
    const onSearch = (value: any) => {
        setKeyword(value)
        if (!value) {
            onSelectSysId('')
            setSysId('')
            onSelectedNode?.({})
        }
    }
    return (
        <div className={styles.infoSys}>
            <div className={styles.paddingWrap}>
                {showTitle && <div className={styles.title}>信息系统</div>}
                <SearchInput
                    placeholder={__('搜索信息系统名称')}
                    onKeyChange={(kw: string) => {
                        onSearch(kw)
                    }}
                />
            </div>
            {keyword === '' && (
                <div
                    className={classnames(
                        styles.sysItem,
                        sysId === '' ? styles.picked : '',
                        styles.all,
                    )}
                    onClick={() => {
                        onSelectSysId('')
                        setSysId('')
                        onSelectedNode?.({})
                    }}
                >
                    <div className={styles.name}>
                        <span className={styles.nameInfo}>{__('全部')}</span>
                    </div>
                </div>
            )}

            <div
                className="list-box"
                style={{
                    height:
                        keyword === ''
                            ? 'calc(100vh - 200px )'
                            : 'calc(100vh - 162px )',
                    overflowY: 'auto',
                }}
            >
                {!isLoading && systems.length > 0 ? (
                    <>
                        {systems.map((sys) => {
                            return (
                                <div
                                    className={classnames(
                                        styles.sysItem,
                                        sysId === sys.id ? styles.picked : '',
                                    )}
                                    key={sys.id}
                                    onClick={() => {
                                        onSelectSysId(sys.id)
                                        setSysId(sys.id || '')
                                        onSelectedNode?.(sys)
                                    }}
                                >
                                    <div className={styles.name}>
                                        {sys.id ===
                                        unCategorizedKey ? undefined : (
                                            <BusinessSystemOutlined
                                                className={styles.nameIcon}
                                            />
                                        )}
                                        <span
                                            className={styles.nameInfo}
                                            title={
                                                __('信息系统') +
                                                __('：') +
                                                sys.name
                                            }
                                        >
                                            {sys.name}
                                        </span>
                                    </div>
                                    {/* {showPath && sys.path && (
                                    <div
                                        className={styles.dep}
                                        title={sys.path}
                                    >
                                        {sys.path}
                                    </div>
                                )} */}
                                </div>
                            )
                        })}
                        {/* <div
                                className={classnames(
                                    styles.sysItem,
                                    sysId === sys.id ? styles.picked : '',
                                )}
                                key={sys.id}
                                onClick={() => {
                                    onSelectSysId(sys.id)
                                    setSysId(sys.id || '')
                                    onSelectedNode?.(sys)
                                }}
                            >
                                <div className={styles.name}>
                                    <BusinessSystemOutlined />
                                    <span
                                        className={styles.nameInfo}
                                        title={sys.name}
                                    >
                                        {sys.name}
                                    </span>
                                </div>
                            </div> */}
                    </>
                ) : (
                    <div style={{ paddingTop: '8px' }}>
                        {isLoading ? (
                            <div style={{ paddingTop: '24px' }}>
                                <Loader />
                            </div>
                        ) : keyword === '' ? (
                            canEmpty && (
                                <Empty
                                    desc={__('暂无数据')}
                                    iconSrc={dataEmpty}
                                    iconHeight={104}
                                />
                            )
                        ) : (
                            <Empty
                                desc={__('抱歉，没有找到相关内容')}
                                iconSrc={searchEmpty}
                                iconHeight={104}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
export default InfoSystem
