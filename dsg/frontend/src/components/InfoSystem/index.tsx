import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Space, Pagination, List } from 'antd'
import _, { noop } from 'lodash'
import { useSize } from 'ahooks'
import {
    SearchInput,
    ListPagination,
    ListType,
    ListDefaultPageSize,
    LightweightSearch,
} from '@/ui'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import { AddOutlined, FiltersOutlined } from '@/icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import DropDownFilter from '../DropDownFilter'
import Empty from '@/ui/Empty'
import { menus, defaultMenu } from '../DataSource/const'
import Loader from '@/ui/Loader'

import {
    formatError,
    IInfoSystemParams,
    ISystemItem,
    reqInfoSystemList,
    SortDirection,
} from '@/core'
import InfoSystemCard from './InfoSystemCard'
import { OperateType } from '@/utils'
import { infoTypeList } from '../ResourcesDir/const'

import __ from './locale'
import styles from './styles.module.less'
import AddInfoSystem from './AddInfoSystem'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import OrgAndDepartmentFilterTree from '../MyAssets/OrgAndDepartmentFilterTree'
import { Architecture } from '../BusinessArchitecture/const'

const OriginSelectComponent: React.FC<{
    value?: any
    onChange?: (value: any) => void
    treeRef?: React.RefObject<any>
}> = ({ onChange = noop, value, treeRef }) => {
    return (
        <OrgAndDepartmentFilterTree
            getSelectedNode={(sn) => {
                onChange(sn.id)
            }}
            filterType={[
                Architecture.ORGANIZATION,
                Architecture.DEPARTMENT,
            ].join()}
            ref={treeRef}
        />
    )
}

const InfoSystem = () => {
    const [loading, setLoading] = useState(false)
    const [operateType, setOperateType] = useState(OperateType.CREATE)
    const [keyword, setKeyword] = useState('')
    const [searchCondition, setSearchCondition] = useState<IInfoSystemParams>({
        limit: ListDefaultPageSize[ListType.CardList],
        offset: 1,
        direction: 'desc',
        keyword: '',
    })
    const [infoSystemList, setInfoSystemList] = useState<Array<ISystemItem>>([])
    const [total, setTotal] = useState(0)
    const [editItem, setEditItem] = useState<ISystemItem>()
    const departmentTreeRef = useRef<any>(null)
    const jsDepartmentTreeRef = useRef<any>(null)
    const [filterConditionData, setFilterConditionData] = useState<
        Array<IformItem>
    >([
        {
            label: __('所属部门'),
            key: 'department_id',
            options: [],
            type: SearchType.Customer,
            Component: OriginSelectComponent as React.ComponentType<{
                value?: any
                onChange: (value: any) => void
                treeRef?: React.RefObject<any>
            }>,
            componentProps: {
                treeRef: departmentTreeRef,
            },
        },
        {
            label: __('建设部门'),
            key: 'js_department_id',
            options: [],
            type: SearchType.Customer,
            Component: OriginSelectComponent as React.ComponentType<{
                value?: any
                onChange: (value: any) => void
                treeRef?: React.RefObject<any>
            }>,
            componentProps: {
                treeRef: jsDepartmentTreeRef,
            },
        },
    ])

    const searchChange = (data: any, key: string) => {
        if (!key) {
            setSearchCondition({
                ...searchCondition,
                offset: 1,
                department_id: undefined,
                js_department_id: undefined,
            })
            departmentTreeRef.current?.setSelectedKeys([''])
            jsDepartmentTreeRef.current?.setSelectedKeys([''])
        } else {
            setSearchCondition({
                ...searchCondition,
                offset: 1,
                department_id: data.department_id || undefined,
                js_department_id: data.js_department_id || undefined,
            })
        }

        // setSearchCondition({
        //     ...searchCondition,
        //     offset: 1,
        //     ...data,
        // })
    }
    const ref = useRef<HTMLDivElement>(null)

    // 添加信息系统对话框
    const [addInfoSystemOpen, setAddInfoSystemOpen] = useState(false)

    const getInfoSystemList = async (params: any) => {
        try {
            setLoading(true)
            const res = await reqInfoSystemList({ ...params })
            setInfoSystemList(res.entries || [])
            setTotal(res.total_count || 0)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getInfoSystemList(searchCondition)
    }, [searchCondition])

    // 列表大小
    const size = useSize(ref)
    const col = useMemo(() => {
        const refOffsetWidth = ref?.current?.offsetWidth || size?.width || 0
        return refOffsetWidth >= 1272
            ? 4
            : refOffsetWidth >= 948
            ? 3
            : undefined
    }, [size?.width])

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            direction: selectedMenu.sort || SortDirection.DESC,
            sort: selectedMenu.key,
        })
    }

    const handleOperate = (type: OperateType, item?: ISystemItem) => {
        setOperateType(type)
        if ([OperateType.CREATE, OperateType.EDIT].includes(type)) {
            setAddInfoSystemOpen(true)
            setEditItem(item)
        }
    }

    const onCreateSuccess = () => {
        setAddInfoSystemOpen(false)
        setSearchCondition({ ...searchCondition })
    }

    const onDeleteSuccess = () => {
        setSearchCondition({
            ...searchCondition,
            offset:
                infoTypeList.length === 1
                    ? (searchCondition.offset || 1) - 1 || 1
                    : searchCondition.offset,
        })
    }

    const handlePageChange = (offset: number, limit: number) => {
        setSearchCondition({ ...searchCondition, offset, limit })
    }

    const renderEmpty = () => {
        // 未搜索 没数据
        if (total === 0 && !searchCondition.keyword) {
            return <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
        }
        if (total === 0 && searchCondition.keyword) {
            return <Empty />
        }
        return null
    }

    return (
        <div className={styles.infoSystemWrapper} ref={ref}>
            <div className={styles.title}>{__('信息系统')}</div>
            <div className={styles.top}>
                <Space>
                    <Button
                        type="primary"
                        icon={<AddOutlined />}
                        onClick={() => handleOperate(OperateType.CREATE)}
                        style={{
                            visibility: 'visible',
                        }}
                    >
                        {__('添加信息系统')}
                    </Button>
                    {/* <Button onClick={() => getInfoSystemList(searchCondition)}>
                        {__('同步信息系统')}
                    </Button> */}
                </Space>
                <Space>
                    <SearchInput
                        className={styles.nameInput}
                        style={{ width: 272 }}
                        placeholder={__('搜索信息系统名称')}
                        onKeyChange={(kw: string) => {
                            setSearchCondition({
                                ...searchCondition,
                                offset: 1,
                                keyword: kw,
                            })
                        }}
                    />
                    <Space size={0}>
                        <LightweightSearch
                            formData={filterConditionData}
                            onChange={(data: any, key: any) => {
                                searchChange(data, key)
                            }}
                            defaultValue={{
                                department_id: '',
                                js_department_id: '',
                            }}
                        />
                        <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={menus}
                                    defaultMenu={defaultMenu}
                                    menuChangeCb={handleMenuChange}
                                />
                            }
                        />
                        <RefreshBtn
                            onClick={() => getInfoSystemList(searchCondition)}
                        />
                    </Space>
                </Space>
            </div>
            {loading ? (
                <Loader />
            ) : total > 0 ? (
                <div className={styles.bottom} ref={ref}>
                    <div className={styles.listWrapper}>
                        <List
                            grid={{
                                gutter: 24,
                                column: col,
                            }}
                            dataSource={infoSystemList}
                            renderItem={(item) => (
                                <List.Item
                                    style={{
                                        maxWidth: col
                                            ? (size?.width ||
                                                  0 - (col - 1) * 24) / col
                                            : undefined,
                                    }}
                                >
                                    <InfoSystemCard
                                        item={item}
                                        handleOperate={handleOperate}
                                        onDeleteSuccess={onDeleteSuccess}
                                    />
                                </List.Item>
                            )}
                            className={styles.list}
                            locale={{
                                emptyText: (
                                    <Empty
                                        desc={__('暂无数据')}
                                        iconSrc={dataEmpty}
                                    />
                                ),
                            }}
                        />
                    </div>
                    <ListPagination
                        listType={ListType.CardList}
                        queryParams={searchCondition}
                        totalCount={total}
                        onChange={handlePageChange}
                    />
                </div>
            ) : (
                <div className={styles.emptyWrapper}>{renderEmpty()}</div>
            )}

            {addInfoSystemOpen && (
                <AddInfoSystem
                    visible={addInfoSystemOpen}
                    operateType={operateType}
                    editItem={editItem}
                    onClose={() => setAddInfoSystemOpen(false)}
                    onSuccess={onCreateSuccess}
                />
            )}
        </div>
    )
}

export default InfoSystem
