import { Button, message, Space, Table } from 'antd'

import { ExclamationCircleFilled } from '@ant-design/icons'
import { useAntdTable } from 'ahooks'
import { SortOrder } from 'antd/lib/table/interface'
import classnames from 'classnames'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dataEmpty from '@/assets/dataEmpty.svg'
import SearchLayout from '@/components/SearchLayout'
import { IFormItem, SearchType } from '@/components/SearchLayout/const'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import {
    closeDemand,
    deleteDemand,
    formatError,
    getDemandAnalyseInfoCount,
    getDemands,
    getObjects,
    IDemandCount,
    IObject,
    SortDirection,
} from '@/core'
import { AddOutlined } from '@/icons'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import { formatTime } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import { Architecture } from '../BusinessArchitecture/const'
import DropDownFilter from '../DropDownFilter'
import { SortBtn } from '../ToolbarComponents'
import {
    CatalogEnum,
    catalogs,
    defaultMenu,
    DemandStatus,
    menus,
    OperateAuthority,
    statusList,
} from './const'
import __ from './locale'
import Status from './Status'
import styles from './styles.module.less'

const Requirement = () => {
    const { checkPermission } = useUserPermCtx()
    const navigate = useNavigate()
    const searchRef: any = useRef()
    const [depts, setDepts] = useState<IObject[]>()
    const [searchIsExpansion, setSearchIsExpansion] = useState<boolean>(false)
    const [hasSearchCondition, setHasSearchCondition] = useState<boolean>(false)
    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        createAt: 'descend',
    })

    // 排序
    const [selectedSort, setSelectedSort] = useState<any>(defaultMenu)

    const [searchCondition, setSearchCondition] = useState<any>({
        keyword: '',
        limit: 10,
        current: 1,
        tag_filter: CatalogEnum.ALL,
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
    })

    const isSearchStatus = useMemo(() => {
        return (
            searchCondition.keyword ||
            searchCondition.org_code ||
            searchCondition.status ||
            searchCondition.apply_date_greater_than
        )
    }, [searchCondition])

    const [demandStatusCount, setDemandStatusCount] = useState<IDemandCount[]>(
        [],
    )

    const getDemandsCount = async () => {
        try {
            const res = await getDemandAnalyseInfoCount(1)
            setDemandStatusCount(res.entries)
        } catch (err) {
            formatError(err)
        }
    }

    useEffect(() => {
        getDemandsCount()
        getDepts()
    }, [])

    const getSearchCondition = (conditions) => {
        setSearchCondition({ ...searchCondition, ...conditions })
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
            current: 1,
        })
        // setSelectedSort(selectedMenu)
        onChangeMenuToTableSort(selectedMenu)
    }

    const onChangeMenuToTableSort = (selectedMenu) => {
        switch (selectedMenu.key) {
            case 'created_at':
                setTableSort({
                    createAt:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    name: null,
                })
                break
            case 'name':
                setTableSort({
                    name:
                        selectedMenu.sort === SortDirection.ASC
                            ? 'ascend'
                            : 'descend',
                    createAt: null,
                })
                break
            case 'updated_at':
                setTableSort({
                    name: null,
                    createAt: null,
                })
                break
            default:
                setTableSort({
                    name: null,
                    createAt: null,
                })
                break
        }
    }

    useEffect(() => {
        run({ ...searchCondition })
        const {
            sort,
            direction,
            current,
            limit,
            tag_filter,
            keyword,
            ...searchObj
        } = searchCondition
        setHasSearchCondition(Object.values(searchObj).some((item) => item))
    }, [searchCondition])

    const getRequirements = async (params: any) => {
        const {
            current: offset,
            limit,
            keyword,
            sort,
            direction,
            tag_filter: p,
            org_code,
            apply_date_greater_than,
            apply_date_less_than,
            status,
        } = params

        try {
            const res = await getDemands({
                offset,
                limit,
                sort,
                direction,
                keyword,
                tag_filter: p,
                org_code,
                apply_date_greater_than,
                apply_date_less_than,
                status,
            })

            return {
                total: res.total_count,
                list: res.entries,
            }
        } catch (error) {
            formatError(error)
            return {
                total: 0,
                list: [],
            }
        } finally {
            setSelectedSort(undefined)
        }
    }

    const { tableProps, run, pagination, loading } = useAntdTable(
        getRequirements,
        {
            defaultPageSize: 10,
            manual: true,
        },
    )

    const renderEmpty = () => {
        return <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
        // const hasAddAccess = getAccess(
        //     `${ResourceType.data_feature}.${RequestType.post}`,
        // )
        // return searchCondition.tag_filter !== CatalogEnum.ALL ||
        //     !hasAddAccess ? (
        //     <Empty iconSrc={dataEmpty} desc="暂无数据" />
        // ) : (
        //     <Empty
        //         iconSrc={empty}
        //         desc={
        //             <>
        //                 <div>暂无需求申请记录</div>
        //                 {/* <div>
        //                     点击
        //                     <Button type="link" onClick={() => handleCreate()}>
        //                         【新建】
        //                     </Button>
        //                     按钮可新建需求
        //                 </div> */}
        //             </>
        //         }
        //     />
        // )
    }

    const handleCreate = (id?: string) => {
        navigate(`/dataService/requirement/create?id=${id || ''}`)
    }

    const handleAnalysisRejectEdit = (id?: string) => {
        navigate(`/dataService/requirement/analysisRejectEdit?id=${id || ''}`)
    }

    const goDetails = (id: string) => {
        navigate(`/dataService/requirement/details?demandId=${id}`)
    }

    const handleDelDemand = async (id: string) => {
        try {
            await deleteDemand(id)
            message.success(__('删除成功'))
            setSearchCondition({ ...searchCondition })
        } catch (error) {
            formatError(error)
        }
    }

    const handleDelDemandConfirm = (id: string) => {
        confirm({
            title: __('确认要删除吗?'),
            icon: (
                <ExclamationCircleFilled style={{ color: 'rgb(250 173 20)' }} />
            ),
            content: __('删除后不可恢复，确认要删除吗?'),
            onOk() {
                handleDelDemand(id)
            },
            okText: __('确定'),
            cancelText: __('取消'),
        })
    }

    const handleCloseDemand = async (id: string) => {
        try {
            await closeDemand(id)
            message.success(__('需求已关闭'))
            setSearchCondition({ ...searchCondition })
            getDemandsCount()
        } catch (error) {
            formatError(error)
        }
    }

    const handleClose = (id: string) => {
        confirm({
            title: __('确认要关闭吗?'),
            icon: <ExclamationCircleFilled style={{ color: '#f5222d' }} />,
            content: __('关闭该需求记录后，将无法再次开启。'),
            onOk() {
                handleCloseDemand(id)
            },
        })
    }

    const handleDemandConfirm = (id: string) => {
        navigate(`/dataService/requirement/confirm?id=${id || ''}`)
    }

    // 是否至少有一种操作权限
    const hasOprAccess = useMemo(
        () => checkPermission('demandAnalysisAndImplement'),
        [checkPermission],
    )

    const columns: any = [
        {
            title: (
                <div>
                    <span>{__('需求名称')}</span>
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                        {__('（编号）')}
                    </span>
                </div>
            ),
            dataIndex: 'demand_title',
            key: 'demand_title',
            // ellipsis: true,
            sorter: true,
            sortOrder: tableSort.name,
            showSorterTooltip: {
                title: __('按需求名称排序'),
                placement: 'bottom',
            },
            width: 160,
            render: (_, record) => {
                return (
                    <>
                        <div
                            className={styles.topInfo}
                            onClick={() => goDetails(record.id)}
                            title={record.demand_title}
                        >
                            <span>{record.demand_title}</span>
                        </div>
                        <div
                            className={styles.bottomInfo}
                            title={record.demand_code}
                        >
                            {record.demand_code}
                        </div>
                    </>
                )
            },
        },
        {
            title: __('当前状态'),
            dataIndex: 'status',
            key: 'status',
            width: 160,
            render: (val) => <Status status={val} />,
        },
        {
            title: __('申请部门'),
            dataIndex: 'org_name',
            key: 'org_name',
            ellipsis: true,
            render: (val) => val || '--',
        },
        {
            title: __('申请人'),
            dataIndex: 'apply_user_name',
            key: 'apply_user_name',
            ellipsis: true,
        },
        {
            title: __('申请人联系方式'),
            dataIndex: 'apply_user_phone',
            key: 'apply_user_phone',
            ellipsis: true,
            render: (val) => val || '--',
        },
        {
            title: __('资源数量'),
            dataIndex: 'resource_count',
            key: 'resource_count',
        },
        {
            title: __('创建时间'),
            width: 180,
            dataIndex: 'created_at',
            sorter: true,
            sortOrder: tableSort.createAt,
            showSorterTooltip: false,
            key: 'created_at',
            render: (val: number) => formatTime(val),
        },
        // 1 编辑；2 删除；4 查看；8 开始分析；16 继续分析;32 分析确认需求;64 关闭需求;128 需求分析驳回编辑;
        // 允许多个操作读取数字换成二进制位，每一位0代表无权限，1代表有对应的操作权限
        hasOprAccess
            ? {
                  title: __('操作'),
                  key: 'action',
                  width: 180,
                  fixed: 'right',
                  render: (_: string, record) => {
                      // 转二进制数组
                      const authority = record.operations
                          .toString(2)
                          .split('')
                          .reverse()

                      return (
                          <Space size={16}>
                              {hasOprAccess &&
                                  authority[2] === OperateAuthority.Yes && (
                                      <a onClick={() => goDetails(record.id)}>
                                          {__('详情')}
                                      </a>
                                  )}
                              {hasOprAccess &&
                                  (authority[0] === OperateAuthority.Yes ||
                                      authority[7] ===
                                          OperateAuthority.Yes) && (
                                      <a
                                          onClick={() => {
                                              //   分析驳回
                                              if (
                                                  record.status ===
                                                  DemandStatus.ANALYSISREJECT
                                              ) {
                                                  handleAnalysisRejectEdit(
                                                      record.id,
                                                  )
                                                  return
                                              }
                                              handleCreate(record.id)
                                          }}
                                      >
                                          {[
                                              DemandStatus.TOBEANALYZED,
                                              DemandStatus.ANALYZING,
                                          ].includes(record.status)
                                              ? __('编辑')
                                              : __('处理')}
                                      </a>
                                  )}
                              {hasOprAccess &&
                                  authority[1] === OperateAuthority.Yes && (
                                      <a
                                          onClick={() =>
                                              handleDelDemandConfirm(record.id)
                                          }
                                      >
                                          {__('删除')}
                                      </a>
                                  )}

                              {authority[5] === OperateAuthority.Yes && (
                                  <a
                                      onClick={() =>
                                          handleDemandConfirm(record.id)
                                      }
                                  >
                                      {__('确认')}
                                  </a>
                              )}
                              {authority[6] === OperateAuthority.Yes && (
                                  <a onClick={() => handleClose(record.id)}>
                                      {__('关闭')}
                                  </a>
                              )}
                          </Space>
                      )
                  },
              }
            : {},
    ].filter((item) => item.key)

    const getCount = (status: number) => {
        return (
            demandStatusCount.find((item) => item.tag_filter === status)
                ?.count || 0
        )
    }

    // 表格排序改变
    const handleTableChange = (sorter) => {
        if (sorter.column) {
            if (sorter.columnKey === 'created_at') {
                setTableSort({
                    createAt: sorter.order || 'ascend',
                    name: null,
                })
            } else {
                setTableSort({
                    createAt: null,
                    name: sorter.order || 'ascend',
                })
            }
            return {
                key:
                    sorter.columnKey === 'demand_title'
                        ? 'name'
                        : sorter.columnKey,
                sort:
                    sorter.order === 'ascend'
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
        }
        if (searchCondition.sort === 'created_at') {
            if (searchCondition.direction === SortDirection.ASC) {
                setTableSort({
                    createAt: 'descend',
                    name: null,
                })
            } else {
                setTableSort({
                    createAt: 'ascend',
                    name: null,
                })
            }
        } else if (searchCondition.sort === SortDirection.ASC) {
            setTableSort({
                createAt: null,
                name: 'descend',
            })
        } else {
            setTableSort({
                createAt: null,
                name: 'ascend',
            })
        }
        return {
            key: searchCondition.sort,
            sort:
                searchCondition.direction === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC,
        }
    }

    // 查询form参数
    const searchFormData: IFormItem[] = [
        {
            label: __('需求名称、编号'),
            key: 'keyword',
            type: SearchType.Input,
            // defaultValue: '',
            isAlone: true,
        },
        {
            label: __('申请部门'),
            key: 'org_code',
            type: SearchType.Select,
            // defaultValue: '',
            itemProps: {
                fieldNames: { label: 'name', value: 'id' },
                options: depts,
            },
        },
        {
            label: __('当前状态'),
            key: 'status',
            type: SearchType.Select,
            // defaultValue: 0,
            itemProps: {
                options: statusList.filter((item) => item.value),
            },
        },
        {
            label: __('创建时间'),
            key: 'times',
            type: SearchType.RangePicker,
            defaultValue: '',
            startTime: 'apply_date_greater_than',
            endTime: 'apply_date_less_than',
            isTimestamp: true,
            itemProps: {
                format: 'YYYY-MM-DD',
            },
        },
    ]

    // 获取申请部门
    const getDepts = async () => {
        try {
            const res = await getObjects({
                limit: 0,
                id: '',
                is_all: true,
                type: Architecture.DEPARTMENT,
            })
            setDepts([
                // { name: __('全部'), id: '', path: '', type: '' },
                ...res.entries,
            ])
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <div className={styles.requirementWrapper}>
            <div className={styles.title}>{__('需求申请')}</div>
            <div className={styles.operateRow}>
                {hasOprAccess ? (
                    <Button
                        type="primary"
                        icon={<AddOutlined />}
                        onClick={() => handleCreate()}
                    >
                        {__('新建需求')}
                    </Button>
                ) : (
                    <div />
                )}
            </div>

            <div className={styles.searchBox}>
                <SearchLayout
                    ref={searchRef}
                    prefixNode={
                        <Space size={12}>
                            {catalogs.map((catalog) => (
                                <div
                                    key={catalog.key}
                                    className={classnames({
                                        [styles.catalogItem]: true,
                                        [styles.selectedCatalogItem]:
                                            searchCondition.tag_filter ===
                                            catalog.key,
                                    })}
                                    onClick={() => {
                                        searchRef.current?.resetHandel()
                                        setSearchCondition({
                                            ...searchCondition,
                                            tag_filter: catalog.key,
                                        })
                                    }}
                                >
                                    {catalog.key === CatalogEnum.ALL
                                        ? catalog.name
                                        : `${catalog.name}(${getCount(
                                              catalog.key,
                                          )})`}
                                </div>
                            ))}
                        </Space>
                    }
                    suffixNode={
                        <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={menus}
                                    defaultMenu={defaultMenu}
                                    menuChangeCb={handleMenuChange}
                                    changeMenu={selectedSort}
                                />
                            }
                        />
                    }
                    formData={searchFormData}
                    onSearch={(obj) => {
                        getSearchCondition(obj)
                    }}
                    getExpansionStatus={setSearchIsExpansion}
                />
            </div>

            {loading ? (
                <div className={styles.loader}>
                    <Loader />
                </div>
            ) : !loading &&
              tableProps.dataSource.length === 0 &&
              !isSearchStatus ? (
                <div className={styles.emptyWrapper}>{renderEmpty()}</div>
            ) : (
                <div className={styles.list}>
                    <Table
                        columns={columns}
                        {...tableProps}
                        rowKey="id"
                        rowClassName={styles.tableRow}
                        onChange={(currentPagination, filters, sorter) => {
                            if (
                                currentPagination.current ===
                                searchCondition.current
                            ) {
                                const selectedMenu = handleTableChange(sorter)
                                setSelectedSort(selectedMenu)
                                setSearchCondition({
                                    ...searchCondition,
                                    sort: selectedMenu.key,
                                    direction: selectedMenu.sort,
                                    current: 1,
                                })
                            } else {
                                setSearchCondition({
                                    ...searchCondition,
                                    current: currentPagination?.current || 1,
                                })
                            }
                        }}
                        scroll={{
                            x: 1200,
                            y:
                                tableProps.dataSource.length === 0
                                    ? undefined
                                    : `calc(100vh - ${
                                          !searchIsExpansion
                                              ? hasSearchCondition
                                                  ? 326 + 41
                                                  : 326
                                              : hasSearchCondition
                                              ? 436 + 41
                                              : 436
                                      }px)`,
                        }}
                        pagination={{
                            ...tableProps.pagination,
                            showSizeChanger: false,
                            hideOnSinglePage: true,
                        }}
                        locale={{ emptyText: <Empty /> }}
                    />
                </div>
            )}
        </div>
    )
}
export default Requirement
