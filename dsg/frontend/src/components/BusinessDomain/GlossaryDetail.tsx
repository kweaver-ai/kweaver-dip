import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useDebounce, useMap, useSize, useUpdateEffect } from 'ahooks'
import {
    Input,
    Tabs,
    Pagination,
    Spin,
    Button,
    Space,
    Divider,
    message,
    List,
    Table,
} from 'antd'
import classnames from 'classnames'
import moment from 'moment'
import { useNavigate } from 'react-router-dom'
import styles from './styles.module.less'
import { AddOutlined } from '@/icons'
import DropdownOperate from './DropdownOperate'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import { ClossaryStatusList, GlossaryStatus } from '../BusinessGlossary/const'
import {
    getCategoriesDetails,
    getGlossaryCount,
    getGlossaryLevel,
    formatError,
    getSubjectDomain,
    LoginPlatform,
    PermissionScope,
} from '@/core'
import { positionIcon, GlossaryIcon } from './GlossaryIcons'
import __ from './locale'
import BusinessActivityGraph from './BusinessActivityGraph'
import {
    BusinessDomainType,
    defaultMenu,
    menus,
    ObjectActiveDetail,
    ObjectActiveTabs,
} from './const'
import DropDownFilter from '../DropDownFilter'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import {
    ListDefaultPageSize,
    ListPagination,
    ListType,
    OptionBarTool,
    OptionMenuType,
    SearchInput,
} from '@/ui'
import Loader from '@/ui/Loader'
import { getPlatformNumber } from '@/utils'
import Classification from './Classification'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IGlossaryDetail {
    ref?: any
    currentData?: any
    setSelectedNode?: (data) => void
    handleOperate: (op, data) => void
}
const GlossaryDetail: React.FC<IGlossaryDetail> = forwardRef(
    (props: any, ref) => {
        const { handleOperate, currentData, setSelectedNode } = props
        const navigator = useNavigate()
        const [detailsData, setDetailsData] = useState<any>({})
        const [categoriesAndTermsData, setCategoriesAndTermsData] =
            useState<any>({
                entries: [],
                total_count: 0,
            })

        const [glossaryContData, setGlossaryContData] = useState<any>({})
        const [activeKey, setActiveKey] = useState<any>()
        const [searchParams, setSearchParams] = useState({
            limit: ListDefaultPageSize[ListType.WideList],
            offset: 1,
            parent_id: '',
            type: '',
            keyword: '',
            is_all: true,
            // sort: defaultMenu.key,
            // direction: defaultMenu.sort,
            need_count: true,
        })
        const [loading, setLoading] = useState(true)
        const [fetching, setFetching] = useState(false)
        const [currentPage, setCurrentPage] = useState<number>(1)

        const platformNumber = getPlatformNumber()
        const listRef = useRef<HTMLDivElement>(null)

        const { checkPermission } = useUserPermCtx()
        const hasSecurityAdmin = useMemo(
            () =>
                checkPermission([
                    {
                        key: 'dataSecurityManagement',
                        scope: PermissionScope.All,
                    },
                ]),
            [checkPermission],
        )

        const hasOprAccess = useMemo(
            () =>
                checkPermission([
                    {
                        key: 'manageDataClassification',
                        scope: PermissionScope.All,
                    },
                ]),
            [checkPermission],
        )
        //
        const [objectActive, setObjectActive] = useState(
            ObjectActiveDetail.Attribute,
        )
        // 列表大小
        const size = useSize(listRef)
        const col = size
            ? (size?.width || 0) >= 1356
                ? 4
                : (size?.width || 0) >= 1012
                ? 3
                : (size?.width || 0) >= 668
                ? 2
                : 1
            : 3

        useImperativeHandle(ref, () => ({
            getDetails,
            getGlossaryCountList,
            getGlossaryLevelList,
            tabsLabel,
            setSearchParams,
            categoriesAndTermsData,
        }))

        useEffect(() => {
            if (hasSecurityAdmin && !hasOprAccess) {
                setObjectActive(ObjectActiveDetail.Classification)
            }
        }, [hasSecurityAdmin])

        useMemo(() => {
            setLoading(true)
        }, [currentData?.id])

        useEffect(() => {
            setObjectActive(ObjectActiveDetail.Attribute)
        }, [currentData])
        useEffect(() => {
            getDetails()
            getGlossaryCountList()
            setActiveKey(
                !currentData.type
                    ? BusinessDomainType.subject_domain_group
                    : currentData.type ===
                      BusinessDomainType.subject_domain_group
                    ? BusinessDomainType.subject_domain
                    : BusinessDomainType.business_object,
            )

            setSearchParams({
                ...searchParams,
                type: !currentData.type
                    ? BusinessDomainType.subject_domain_group
                    : currentData.type ===
                      BusinessDomainType.subject_domain_group
                    ? BusinessDomainType.subject_domain
                    : `${BusinessDomainType.business_object},${BusinessDomainType.business_activity}`,
                parent_id: currentData.id || '',
                offset: 1,
                keyword: '',
            })
            setCurrentPage(1)
        }, [currentData])

        useEffect(() => {
            getGlossaryLevelList()
        }, [searchParams])

        const isEmpty = useMemo(
            () =>
                categoriesAndTermsData?.total_count === 0 &&
                !searchParams.keyword &&
                !fetching,
            [categoriesAndTermsData, searchParams, fetching],
        )
        const debouncedEmpty = useDebounce(isEmpty, { wait: 400 })

        const getDetails = async () => {
            // 全部时没有id 不需要查询详情
            if (!currentData.id) return
            try {
                const res = await getCategoriesDetails(currentData.id)
                setDetailsData(res)
            } catch (error) {
                if (
                    error.data.code ===
                    'BusinessGrooming.Glossary.ObjectNotExist'
                ) {
                    message.error(
                        __('${name}被删除，请刷新后重试', {
                            name: currentData.name,
                        }),
                    )
                    return
                }
                formatError(error)
            }
        }

        const getGlossaryLevelList = async () => {
            try {
                if (!searchParams.type) return
                setFetching(true)
                const res = await getSubjectDomain(searchParams)
                setCategoriesAndTermsData(res)
            } catch (error) {
                if (error.data.code === 'DataSubject.Glossary.ObjectNotExist') {
                    message.error(
                        __('${name}被删除，请刷新后重试', {
                            name: currentData.name,
                        }),
                    )
                    return
                }
                formatError(error)
            } finally {
                setFetching(false)
                setLoading(false)
            }
        }
        const getGlossaryCountList = async () => {
            // try {
            //     const res = await getGlossaryCount(currentData.id || '')
            //     await setGlossaryContData(res)
            // } catch (error) {
            //     if (
            //         error.data.code ===
            //         'BusinessGrooming.Glossary.ObjectNotExist'
            //     ) {
            //         message.error(
            //             __('${name}被删除，请刷新后重试', {
            //                 name: currentData.name,
            //             }),
            //         )
            //         return
            //     }
            //     formatError(error)
            // }
        }

        const renderEmpty = () => {
            if (loading) {
                return null
            }
            // 选择业务域分组时：
            // 业务域为空时提示：点击【新建业务域】按钮，可新建业务域
            // 主题域/业务对象为空显示：暂无数据图标
            // 选择业务域或主题域时：
            // 主题域/业务对象为空显示：点击【新建主题域/业务对象】按钮，可新建业务域
            const desc = (
                <p>
                    <div>
                        {__('暂无')}
                        {activeKey === BusinessDomainType.subject_domain_group
                            ? // platformNumber === LoginPlatform.default
                              //     ? __('主题域分组')
                              //     :
                              __('业务对象分组')
                            : activeKey === BusinessDomainType.subject_domain
                            ? // platformNumber === LoginPlatform.default
                              //     ? __('主题域')
                              //     :
                              __('业务对象分组')
                            : // : platformNumber === LoginPlatform.default
                              // ? __('业务对象/活动')
                              __('业务对象')}
                    </div>
                    <div>{__('点击下方按钮可开始新建')}</div>
                </p>
            )
            const showEmptyText =
                !searchParams.keyword &&
                ((activeKey !== BusinessDomainType.subject_domain_group &&
                    !currentData.type) ||
                    (currentData.type ===
                        BusinessDomainType.subject_domain_group &&
                        activeKey === BusinessDomainType.business_object))
            return (
                <div className={styles.emptyBox}>
                    <Empty iconSrc={dataEmpty} desc={desc} />
                    {checkPermission([
                        {
                            key: 'manageDataClassification',
                            scope: PermissionScope.All,
                        },
                    ]) && (
                        <Button
                            type="primary"
                            icon={<AddOutlined />}
                            onClick={() =>
                                handleOperate('addTerms', currentData)
                            }
                        >
                            {activeKey ===
                            BusinessDomainType.subject_domain_group
                                ? // platformNumber === LoginPlatform.default
                                  //     ? __('新建主题域分组')
                                  //     :
                                  __('新建业务对象分组')
                                : activeKey ===
                                  BusinessDomainType.subject_domain
                                ? //  platformNumber === LoginPlatform.default
                                  //     ? __('新建主题域')
                                  //     :
                                  __('新建业务对象分组')
                                : activeKey ===
                                  BusinessDomainType.business_object
                                ? __('新建业务对象')
                                : // platformNumber === LoginPlatform.default
                                  //     ? __('新建业务对象/活动')
                                  //     : __('新建业务对象')
                                  null}
                        </Button>
                    )}
                </div>
            )
        }

        const pageOnChange = async (offset, limit) => {
            setCurrentPage(offset)
            setSearchParams({ ...searchParams, offset, limit })
        }

        const getOptionMenus = (record) => {
            let optionMenus = [
                {
                    key: 'edit',
                    label: __('编辑基本信息'),
                    menuType: OptionMenuType.Menu,
                },
                {
                    key: 'del',
                    label: __('删除'),
                    menuType: OptionMenuType.Menu,
                },
            ]
            if (
                [
                    BusinessDomainType.business_object,
                    BusinessDomainType.business_activity,
                ].includes(activeKey)
            ) {
                optionMenus.splice(0, 0, {
                    key: 'editDefine',
                    label: __('定义属性'),
                    menuType: OptionMenuType.Menu,
                })
            }
            optionMenus = hasOprAccess ? optionMenus : []
            return optionMenus
        }

        const columns = () => {
            const items = [
                {
                    title:
                        activeKey === BusinessDomainType.subject_domain_group
                            ? // platformNumber === LoginPlatform.default
                              //     ? __('主题域分组')
                              //     :
                              __('业务对象分组')
                            : activeKey === BusinessDomainType.subject_domain
                            ? // platformNumber === LoginPlatform.default
                              //     ? __('主题域')
                              //     :
                              __('业务对象分组')
                            : // : platformNumber === LoginPlatform.default
                              // ? __('业务对象/活动')
                              __('业务对象'),
                    dataIndex: 'title',
                    key: 'title',
                    render: (value, record) => (
                        <div className={styles.tableCol}>
                            <GlossaryIcon
                                type={record.type}
                                fontSize="20px"
                                width="20px"
                                styles={{ flexShrink: 0 }}
                            />
                            <div className={styles['tableCol-content']}>
                                <span
                                    className={styles['tableCol-content-top']}
                                    title={record.name}
                                >
                                    {record.name}
                                </span>
                                <span
                                    className={
                                        styles['tableCol-content-bottom']
                                    }
                                    title={
                                        record.description || __('[暂无描述]')
                                    }
                                >
                                    {record.description || __('[暂无描述]')}
                                </span>
                            </div>
                        </div>
                    ),
                },
                {
                    title: __('更新人/时间'),
                    dataIndex: 'updateInfo',
                    key: 'updateInfo',
                    render: (value, record) => (
                        <div className={styles['tableCol-content']}>
                            <span
                                className={styles['tableCol-content-top']}
                                title={record.updated_by}
                            >
                                {record.updated_by}
                            </span>
                            <span
                                className={styles['tableCol-content-bottom']}
                                title={moment(record.updated_at).format(
                                    'YYYY-MM-DD HH:mm:ss',
                                )}
                            >
                                {moment(record.updated_at).format(
                                    'YYYY-MM-DD HH:mm:ss',
                                )}
                            </span>
                        </div>
                    ),
                },
                {
                    title: __('操作'),
                    dataIndex: 'op',
                    key: 'op',
                    width: [
                        BusinessDomainType.business_object,
                        BusinessDomainType.business_activity,
                    ].includes(activeKey)
                        ? 232
                        : 162,
                    render: (_: string, record) => (
                        <OptionBarTool
                            menus={getOptionMenus(record) as any[]}
                            onClick={(key, e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleOperate(key, record)
                            }}
                        />
                    ),
                },
            ]
            if (
                [
                    BusinessDomainType.business_object,
                    BusinessDomainType.business_activity,
                ].includes(activeKey)
            ) {
                items.splice(
                    1,
                    0,
                    ...[
                        {
                            title: __('逻辑实体数量'),
                            dataIndex: 'child_count',
                            key: 'child_count',
                            render: (value, record) => value,
                        },
                        {
                            title: __('属性数量'),
                            dataIndex: 'second_child_count',
                            key: 'second_child_count',
                            render: (value, record) => value,
                        },
                    ],
                )
            }
            return items
        }

        // 术语表和类别
        const glossaryAndCategoriesCantainer = () => {
            return (
                <div className={styles.ategoriesAndTermsBox}>
                    <div
                        className={styles.searchBox}
                        hidden={isEmpty || loading}
                    >
                        {/* 选中业务域分组可新建业务域 || 选中业务域可新建主题域 || 选中主题域可新建业务对象 */}
                        {((activeKey ===
                            BusinessDomainType.subject_domain_group &&
                            !currentData.type) ||
                            (activeKey === BusinessDomainType.subject_domain &&
                                currentData.type ===
                                    BusinessDomainType.subject_domain_group) ||
                            (activeKey === BusinessDomainType.business_object &&
                                currentData.type ===
                                    BusinessDomainType.subject_domain)) &&
                        hasOprAccess ? (
                            <Button
                                type="primary"
                                icon={<AddOutlined />}
                                onClick={() =>
                                    handleOperate('addTerms', currentData)
                                }
                            >
                                {activeKey ===
                                BusinessDomainType.subject_domain_group
                                    ? // platformNumber === LoginPlatform.default
                                      //     ? __('新建主题域分组')
                                      //     :
                                      __('新建业务对象分组')
                                    : activeKey ===
                                      BusinessDomainType.subject_domain
                                    ? // platformNumber === LoginPlatform.default
                                      //     ? __('新建主题域')
                                      //     :
                                      __('新建业务对象分组')
                                    : activeKey ===
                                      BusinessDomainType.business_object
                                    ? // platformNumber === LoginPlatform.default
                                      //     ? __('新建业务对象/活动')
                                      //     :
                                      __('新建业务对象')
                                    : null}
                            </Button>
                        ) : (
                            <div />
                        )}
                        <Space size={8}>
                            <SearchInput
                                placeholder={
                                    activeKey ===
                                    BusinessDomainType.subject_domain_group
                                        ? // platformNumber ===
                                          //   LoginPlatform.default
                                          //     ? __('搜索主题域分组')
                                          //     :
                                          __('搜索业务对象分组')
                                        : activeKey ===
                                          BusinessDomainType.subject_domain
                                        ? __('搜索主题域')
                                        : activeKey ===
                                          BusinessDomainType.business_object
                                        ? //  platformNumber ===
                                          //   LoginPlatform.default
                                          //     ? __('搜索业务对象/活动')
                                          //     :
                                          __('搜索业务对象')
                                        : ''
                                }
                                value={searchParams.keyword}
                                onKeyChange={(value: string) => {
                                    if (value === searchParams?.keyword) return
                                    setSearchParams({
                                        ...searchParams,
                                        offset: 1,
                                        keyword: value,
                                    })
                                    setCurrentPage(1)
                                }}
                                className={styles.searchInput}
                                style={{ width: 272 }}
                            />
                            {/* <SortBtn
                                contentNode={
                                    <DropDownFilter
                                        menus={menus}
                                        defaultMenu={defaultMenu}
                                        menuChangeCb={handleMenuChange}
                                    />
                                }
                            />
                            <RefreshBtn
                                onClick={() =>
                                    setSearchParams({
                                        ...searchParams,
                                    })
                                }
                            /> */}
                        </Space>
                    </div>
                    {loading ? (
                        <Loader />
                    ) : isEmpty ? (
                        renderEmpty()
                    ) : (
                        // <div className={styles.containerBox} ref={listRef}>
                        //     <List
                        //             grid={{
                        //                 gutter: 20,
                        //                 column: col,
                        //             }}
                        //             dataSource={categoriesAndTermsData?.entries}
                        //             renderItem={(item: any) => (
                        //                 <List.Item
                        //                     style={{
                        //                         maxWidth:
                        //                             (size?.width ||
                        //                                 0 - (col - 1) * 20) /
                        //                             col,
                        //                     }}
                        //                 >
                        //                     <div
                        //                         className={styles.itemBox}
                        //                         key={item.id}
                        //                         onClick={() =>
                        //                             setSelectedNode?.(item)
                        //                         }
                        //                     >
                        //                         <div
                        //                             className={
                        //                                 styles.itemTitleBox
                        //                             }
                        //                         >
                        //                             <span
                        //                                 className={classnames(
                        //                                     styles.typeIcon,
                        //                                     styles[
                        //                                         `${item.type}`
                        //                                     ],
                        //                                 )}
                        //                             >
                        //                                 <GlossaryIcon
                        //                                     type={item.type}
                        //                                     status={item.status}
                        //                                     fontSize="26px"
                        //                                     width="32px"
                        //                                 />
                        //                             </span>
                        //                             <span
                        //                                 className={
                        //                                     styles.itemTitle
                        //                                 }
                        //                                 title={item.name}
                        //                             >
                        //                                 {item.name}
                        //                             </span>
                        //                         </div>
                        //                         <div
                        //                             className={
                        //                                 styles.itemDescBox
                        //                             }
                        //                             title={item.description}
                        //                         >
                        //                             {item.description ||
                        //                                 `[${__('暂无描述')}]`}
                        //                         </div>
                        //                         <div
                        //                             className={
                        //                                 styles.updateInfo
                        //                             }
                        //                         >
                        //                             <div
                        //                                 className={
                        //                                     styles.updateBy
                        //                                 }
                        //                                 title={item?.updated_by}
                        //                             >
                        //                                 {item?.updated_by}
                        //                             </div>
                        //                             <div
                        //                                 className={
                        //                                     styles.updateAt
                        //                                 }
                        //                             >
                        //                                 {`${__(
                        //                                     '更新于',
                        //                                 )} ${moment(
                        //                                     item.updated_at,
                        //                                 ).format(
                        //                                     'YYYY-MM-DD HH:mm:ss',
                        //                                 )}`}
                        //                             </div>
                        //                         </div>
                        //                     </div>
                        //                 </List.Item>
                        //             )}
                        //             className={styles.list}
                        //             locale={{
                        //                 emptyText: (
                        //                     <Empty
                        //                         desc={__('暂无数据')}
                        //                         iconSrc={dataEmpty}
                        //                     />
                        //                 ),
                        //             }}
                        //         />
                        //     <div className={styles.paginationBox}>
                        //                 <ListPagination
                        //                     listType={ListType.CardList}
                        //                     queryParams={searchParams}
                        //                     totalCount={
                        //                         categoriesAndTermsData?.total_count || 0
                        //                     }
                        //                     onChange={pageOnChange}
                        //                 />
                        //             </div>
                        // </div>
                        <div className={styles.tableBox}>
                            <Table
                                loading={fetching}
                                columns={columns()}
                                dataSource={categoriesAndTermsData?.entries}
                                pagination={false}
                                rowClassName={styles.tableRow}
                                scroll={{
                                    y:
                                        categoriesAndTermsData?.entries.length >
                                        0
                                            ? categoriesAndTermsData?.total_count >
                                              searchParams.limit
                                                ? `calc(100vh - ${
                                                      (currentData?.type
                                                          ? 243
                                                          : 209) + 48
                                                  }px)`
                                                : `calc(100vh - ${
                                                      currentData?.type
                                                          ? 243
                                                          : 209
                                                  }px)`
                                            : undefined,
                                }}
                                locale={{
                                    emptyText: <Empty />,
                                }}
                            />
                            <Pagination
                                current={searchParams.offset}
                                pageSize={searchParams.limit}
                                onChange={pageOnChange}
                                className={styles.paginationBox}
                                total={categoriesAndTermsData?.total_count || 0}
                                showSizeChanger={false}
                                hideOnSinglePage
                            />
                        </div>
                    )}
                </div>
            )
        }

        const tabsLabel = (key: string) => {
            let text: string = ''

            switch (key) {
                case BusinessDomainType.subject_domain:
                    text = __('主题域')
                    break
                case BusinessDomainType.business_object:
                    text =
                        // platformNumber === LoginPlatform.default
                        //     ? __('业务对象/活动')
                        //     :
                        __('业务对象')
                    break
                default:
                    text =
                        // platformNumber === LoginPlatform.default
                        //     ? __('主题域分组')
                        //     :
                        __('业务对象分组')
            }
            return (
                <span>
                    <span className={styles.tabsText}>{text}</span>
                </span>
            )
        }

        const tabsItems = [
            {
                label: tabsLabel(BusinessDomainType.subject_domain_group),
                key: BusinessDomainType.subject_domain_group,
            },
            {
                label: tabsLabel(BusinessDomainType.subject_domain),
                key: BusinessDomainType.subject_domain,
            },
            {
                label: tabsLabel(BusinessDomainType.business_object),
                key: BusinessDomainType.business_object,
            },
        ]
        const tabsChange = async (key) => {
            if (fetching) {
                return
            }
            await setActiveKey(key)
            setCurrentPage(1)
            setSearchParams({
                ...searchParams,
                type:
                    key === BusinessDomainType.business_object
                        ? `${BusinessDomainType.business_object},${BusinessDomainType.business_activity}`
                        : key,
                offset: 1,
                keyword: '',
            })
        }

        // 筛选顺序变化
        const handleMenuChange = (selectedMenu) => {
            setSearchParams({
                ...searchParams,
                // sort: selectedMenu.key,
                // direction: selectedMenu.sort,
            })
        }

        return (
            <div className={styles.ClossaryDetailWrapper}>
                {currentData?.type ? (
                    <div className={styles.titleBox} hidden={loading}>
                        <div className={styles.titleLeft}>
                            <GlossaryIcon
                                type={currentData.type}
                                fontSize="50px"
                                width="50px"
                            />
                            <div className={styles.titleBoxRight}>
                                <div className={styles.firstTitle}>
                                    <div
                                        className={styles.text}
                                        title={detailsData.name}
                                    >
                                        {detailsData.name}
                                    </div>
                                    <span
                                        className={styles.typeFlag}
                                        hidden={
                                            platformNumber !==
                                                LoginPlatform.default &&
                                            currentData.type ===
                                                BusinessDomainType.subject_domain
                                        }
                                    >
                                        {currentData.type ===
                                        BusinessDomainType.subject_domain_group ? (
                                            __('业务对象分组')
                                        ) : currentData.type ===
                                          BusinessDomainType.subject_domain ? (
                                            __('业务对象分组')
                                        ) : (
                                            <span>
                                                {detailsData.type ===
                                                BusinessDomainType.business_activity
                                                    ? __('业务活动')
                                                    : __('业务对象')}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className={styles.infos}>
                                    {detailsData?.owners?.user_name && (
                                        <>
                                            <div className={styles.label}>
                                                {__('数据Owner')}
                                                {__('：')}
                                            </div>
                                            <div
                                                className={styles.ownerName}
                                                title={
                                                    detailsData?.owners
                                                        ?.user_name
                                                }
                                            >
                                                {detailsData?.owners?.user_name}
                                            </div>
                                        </>
                                    )}

                                    <div className={styles.label}>
                                        {__('描述')}
                                        {__('：')}
                                    </div>
                                    <div
                                        className={styles.details}
                                        title={
                                            detailsData.description ||
                                            __('[暂无描述]')
                                        }
                                    >
                                        {detailsData.description ||
                                            __('[暂无描述]')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.operateContainer}>
                            <div className={styles.updateInfo}>
                                <span
                                    title={detailsData.updated_by}
                                    className={styles.updateBy}
                                >
                                    {detailsData.updated_by?.length > 10
                                        ? `${detailsData.updated_by?.substring(
                                              0,
                                              10,
                                          )}...`
                                        : detailsData.updated_by}
                                </span>
                                <span className={styles.updateAt}>{`${__(
                                    '修改于',
                                )} ${moment(detailsData.updated_at).format(
                                    'YYYY-MM-DD HH:mm:ss',
                                )}`}</span>
                            </div>
                            <Space size={16}>
                                <Button
                                    type="link"
                                    onClick={() =>
                                        handleOperate('edit', currentData)
                                    }
                                    hidden={!hasOprAccess}
                                    className={styles.btn}
                                >
                                    {__('编辑基本信息')}
                                </Button>
                                {/* {getAccess(
                                    `${ResourceType.business_model}.${RequestType.delete}`,
                                ) &&
                                    getAccess(
                                        `${ResourceType.business_domain}.${RequestType.put}`,
                                    ) && (
                                        <Divider
                                            type="vertical"
                                            style={{
                                                borderColor:
                                                    'rgba(0, 0, 0, 0.25)',
                                            }}
                                        />
                                    )} */}
                                <Button
                                    type="link"
                                    onClick={() =>
                                        handleOperate('del', currentData)
                                    }
                                    className={styles.btn}
                                    hidden={!hasOprAccess}
                                >
                                    {__('删除')}
                                </Button>
                            </Space>
                        </div>
                    </div>
                ) : (
                    <div className={styles.titleAll} hidden={loading}>
                        {
                            // platformNumber === LoginPlatform.default
                            //     ? __('全部主题域分组')
                            //     :
                            __('全部业务对象分组')
                        }
                    </div>
                )}
                {[
                    BusinessDomainType.business_activity,
                    BusinessDomainType.business_object,
                ].includes(currentData.type) &&
                    hasSecurityAdmin &&
                    hasOprAccess && (
                        <div>
                            <Tabs
                                items={ObjectActiveTabs}
                                activeKey={objectActive}
                                onChange={(key) =>
                                    setObjectActive(key as ObjectActiveDetail)
                                }
                            />
                        </div>
                    )}

                {[
                    BusinessDomainType.business_activity,
                    BusinessDomainType.business_object,
                ].includes(currentData.type) &&
                    (loading ? (
                        <Loader />
                    ) : (
                        <div className={styles.graphWrapper}>
                            {objectActive ===
                            ObjectActiveDetail.Classification ? (
                                <Classification objectiveId={currentData.id} />
                            ) : currentData.child_count === 0 ? (
                                <div
                                    className={classnames(
                                        styles.emptyBox,
                                        styles.gray,
                                    )}
                                >
                                    <Empty
                                        iconSrc={dataEmpty}
                                        desc={
                                            <p>
                                                <div>{__('暂无属性')}</div>
                                                <div>
                                                    {hasOprAccess
                                                        ? __(
                                                              '点击下方按钮可开始定义',
                                                          )
                                                        : __(
                                                              '需先定义属性猜能进行配置',
                                                          )}
                                                </div>
                                            </p>
                                        }
                                    />
                                    {hasOprAccess && hasOprAccess && (
                                        <Button
                                            type="primary"
                                            onClick={() =>
                                                navigator(
                                                    `/standards/define?objId=${currentData.id}&name=${currentData.name}&type=${currentData.type}`,
                                                )
                                            }
                                        >
                                            {__('定义属性')}
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className={styles.topInfo}>
                                        <Button
                                            type="primary"
                                            onClick={() => {
                                                navigator(
                                                    `/standards/define?objId=${currentData.id}&name=${currentData.name}&type=${currentData.type}`,
                                                )
                                            }}
                                            hidden={!hasOprAccess}
                                        >
                                            {__('定义属性')}
                                        </Button>
                                    </div>
                                    <BusinessActivityGraph
                                        currentData={currentData}
                                        mode="view"
                                    />
                                </>
                            )}
                        </div>
                    ))}
                <div
                    className={classnames(
                        styles.detailsTabs,
                        !currentData?.type && styles.noTitle,
                    )}
                    hidden={[
                        BusinessDomainType.business_activity,
                        BusinessDomainType.business_object,
                    ].includes(currentData.type)}
                >
                    {/* <Tabs
                        getPopupContainer={(node) => node}
                        tabBarGutter={32}
                        items={
                            !currentData.type
                                ? tabsItems
                                : tabsItems.filter((item) => {
                                      switch (currentData.type) {
                                          case BusinessDomainType.subject_domain_group:
                                              return (
                                                  item.key !==
                                                  BusinessDomainType.subject_domain_group
                                              )
                                          case BusinessDomainType.subject_domain:
                                              return (
                                                  item.key ===
                                                  BusinessDomainType.business_object
                                              )
                                          default:
                                              return false
                                      }
                                  })
                        }
                        activeKey={activeKey}
                        destroyInactiveTabPane
                        onChange={tabsChange}
                    /> */}
                    {glossaryAndCategoriesCantainer()}
                </div>
            </div>
        )
    },
)
export default GlossaryDetail
