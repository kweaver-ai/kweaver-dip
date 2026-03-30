import { useUpdateEffect } from 'ahooks'
import { Button, Dropdown, Radio, Spin, Tabs, message } from 'antd'
import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react'

import {
    DeleteOutlined,
    ExclamationCircleFilled,
    MoreOutlined,
} from '@ant-design/icons'
import classnames from 'classnames'
import moment from 'moment'
import dataEmpty from '@/assets/dataEmpty.svg'
import emptyAdd from '@/assets/emptyAdd.svg'
import {
    delTermsRelation,
    formatError,
    getCategories,
    getCategoriesDetails,
    getGlossaryDetails,
    getMembers,
    termsDetails,
} from '@/core'
import { AddOutlined, AvatarOutlined, ResourceDirOutlined } from '@/icons'
import {
    ListDefaultPageSize,
    ListPagination,
    ListType,
    SearchInput,
} from '@/ui'
import Empty from '@/ui/Empty'
import { confirm } from '@/utils/modalHelper'
import {
    GlossaryMgmtIcons,
    menuIcon,
    positionIcon,
    statusIcon,
} from '../BusinessDomain/GlossaryIcons'
import __ from '../BusinessDomain/locale'
import {
    ClossaryStatusList,
    GlossaryStatus,
    GlossaryType,
    GlossaryTypeOptions,
    optionType,
} from './const'
import DropdownOperate from './DropdownOperate'
import MoveModal from './MoveModal'
import styles from './styles.module.less'

interface IGlossaryDetail {
    ref?: any
    id?: string
    currentData?: any
    handleOperate: (op, data) => void
}
const GlossaryDetail: React.FC<IGlossaryDetail> = forwardRef(
    (props: any, ref) => {
        const { handleOperate, currentData } = props
        const moveModalRef: any = useRef()
        const [isEmpty, setIsEmpty] = useState<boolean>(false)
        const [selectdRelations, setSelectdRelations] = useState<any>({})
        const [searchValue, setSearchValue] = useState('')
        const [searchType, setSearchType] = useState('')
        const [activeKey, setActiveKey] = useState<any>('general')
        const [searchParams, setSearchParams] = useState({
            limit: ListDefaultPageSize[ListType.CardList],
            offset: 1,
            parent_id: '',
            keyword: '',
            type: '',
        })
        const [fetching, setFetching] = useState(false)
        const [currentPage, setCurrentPage] = useState<number>(1)
        const [detailsData, setDatailsData] = useState<any>({})

        const [members, setMembers] = useState<any>([])

        useUpdateEffect(() => {
            setSearchParams({ ...searchParams, keyword: searchValue })
        }, [searchValue])

        const [categoriesAndTermsData, setCategoriesAndTermsData] =
            useState<any>({})

        useImperativeHandle(ref, () => ({
            getDetails,
            getCategoriesAndTermsList,
        }))

        useEffect(() => {
            getAllMembers()
        }, [])

        useEffect(() => {
            if (currentData) {
                if (currentData?.id) {
                    getDetails()
                }
                setActiveKey('general')
                if (currentData.type !== GlossaryType.TERMS) {
                    setSearchParams({
                        ...searchParams,
                        type: '',
                        parent_id: currentData.id,
                    })
                }
            }
        }, [currentData])

        useEffect(() => {
            if (searchParams.parent_id) {
                getCategoriesAndTermsList()
                setSearchType(searchParams.type)
            }
        }, [searchParams])

        const getDetails = async () => {
            try {
                let actions: any
                switch (currentData.type) {
                    case GlossaryType.GLOSSARY:
                        actions = getGlossaryDetails
                        break
                    case GlossaryType.CATEGORIES:
                        actions = getCategoriesDetails
                        break
                    case GlossaryType.TERMS:
                        actions = termsDetails
                        break
                    default:
                        actions = null
                }
                const res = await actions(currentData.id)
                setDatailsData(res)
                if (res?.relations && res?.relations.length > 0) {
                    const relations = selectdRelations?.relation_type
                        ? res?.relations?.find(
                              (item) =>
                                  item.relation_type ===
                                  selectdRelations?.relation_type,
                          )
                        : res?.relations[0]
                    setSelectdRelations(relations)
                }
            } catch (err) {
                formatError(err)
            }
        }
        const getCategoriesAndTermsList = async () => {
            try {
                const res = await getCategories(searchParams)
                setIsEmpty(res.entries.length === 0)
                setCategoriesAndTermsData(res)
            } catch (err) {
                formatError(err)
            }
        }

        // 获取所有成员
        const getAllMembers = async () => {
            try {
                const res = await getMembers()
                setMembers(res)
            } catch (error) {
                formatError(error)
            }
        }

        const baseLabel = (label: string) => {
            return (
                <div style={{ marginBottom: '18px', fontWeight: 550 }}>
                    <span
                        style={{
                            width: '4px',
                            height: '11px',
                            background: '#126EE3',
                            marginRight: '16px',
                            display: 'inline-block',
                        }}
                    />
                    <span style={{ fontSize: '16px' }}>{label}</span>
                </div>
            )
        }

        const statusLabel = (status: GlossaryStatus) => {
            const statusObj = ClossaryStatusList.find(
                (item) => item.value === status,
            )
            return (
                <div
                    className={styles.authIcon}
                    style={{
                        color: statusObj?.color,
                        background: statusObj?.bgColor,
                    }}
                >
                    {statusObj?.label || '--'}
                </div>
            )
        }

        // 概览
        const generalCantainer = () => {
            return (
                <div className={styles.generalCantainer}>
                    <div className={styles.baseInfo}>
                        {detailsData.type === 'glossary' ? (
                            <div
                                className={classnames(
                                    styles.baseInfoItem,
                                    styles.first,
                                )}
                            >
                                {baseLabel(__('统计信息'))}
                                <div className={styles.statisticsBox}>
                                    <div className={styles.statisticsItem}>
                                        <div className={styles.statisticsIcon}>
                                            {/* <ResourceDirOutlined
                                                style={{ color: '#FFA034' }}
                                            /> */}
                                            <GlossaryMgmtIcons
                                                showDot={false}
                                                type={GlossaryType.CATEGORIES}
                                                style={{
                                                    fontSize: '30px',
                                                    color: '#FFA034',
                                                }}
                                            />
                                        </div>
                                        <div className={styles.statisticsText}>
                                            <div className={styles.staticLabel}>
                                                {__('类别个数')}
                                            </div>
                                            <div className={styles.staticSum}>
                                                {detailsData?.count_info
                                                    ?.categories_count || 0}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.statisticsItem}>
                                        <div className={styles.statisticsIcon}>
                                            <GlossaryMgmtIcons
                                                showDot={false}
                                                type={GlossaryType.TERMS}
                                                style={{
                                                    fontSize: '30px',
                                                    color: '#3A8FF0',
                                                }}
                                            />
                                        </div>
                                        <div className={styles.statisticsText}>
                                            <div className={styles.staticLabel}>
                                                {__('术语个数')}
                                            </div>
                                            <div className={styles.staticSum}>
                                                {detailsData?.count_info
                                                    ?.terms_count || 0}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                className={classnames(
                                    styles.baseInfoItem,
                                    styles.first,
                                )}
                            >
                                {baseLabel(__('所在位置'))}
                                <div className={styles.localtionBox}>
                                    <div className={styles.authItem}>
                                        <span className={styles.authItemLabel}>
                                            {__('术语表')}
                                        </span>
                                        <span
                                            title={
                                                detailsData?.path_map?.glossary
                                                    ?.map((it) => it.name)
                                                    ?.join('') || ''
                                            }
                                            className={styles.authItemText}
                                        >
                                            {detailsData?.path_map?.glossary
                                                ?.map((it) => it.name)
                                                ?.join('') || '--'}
                                        </span>
                                    </div>
                                    <div className={styles.authItem}>
                                        <span className={styles.authItemLabel}>
                                            {__('类别')}
                                        </span>
                                        <span
                                            title={
                                                detailsData?.path_map?.category
                                                    ?.map((it) => it.name)
                                                    ?.join(' > ') || ''
                                            }
                                            className={styles.authItemText}
                                        >
                                            {detailsData?.path_map?.category
                                                ?.map((it) => it.name)
                                                ?.join(' > ') || '--'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div
                            className={classnames(
                                styles.baseInfoItem,
                                styles.second,
                            )}
                        >
                            {baseLabel(__('拥有者'))}
                            <div className={styles.ownersInfoBox}>
                                {(detailsData?.owners &&
                                    detailsData?.owners.length > 0 &&
                                    detailsData?.owners?.map((item) => (
                                        <div
                                            key={item.user_id}
                                            className={styles.ownersItems}
                                        >
                                            <AvatarOutlined
                                                className={styles.avatarIcon}
                                            />
                                            <span className={styles.ownersText}>
                                                {
                                                    members.find(
                                                        (it) =>
                                                            it.id ===
                                                            item.user_id,
                                                    )?.name
                                                }
                                            </span>
                                        </div>
                                    ))) ||
                                    '--'}
                            </div>
                        </div>
                        <div
                            className={classnames(
                                styles.baseInfoItem,
                                styles.third,
                            )}
                        >
                            <div className={styles.authLabel}>
                                {baseLabel(__('认证状态'))}
                                {detailsData?.certification_info?.status &&
                                    statusLabel(
                                        detailsData?.certification_info?.status,
                                    )}
                            </div>
                            <div className={styles.authBox}>
                                <div className={styles.authItem}>
                                    <span className={styles.authItemLabel}>
                                        {__('认证人')}
                                    </span>
                                    <span className={styles.authItemText}>
                                        {members.find(
                                            (it) =>
                                                it.id ===
                                                detailsData?.certification_info
                                                    ?.certificated_by,
                                        )?.name || '--'}
                                    </span>
                                </div>
                                <div className={styles.authItem}>
                                    <span className={styles.authItemLabel}>
                                        {__('认证时间')}
                                    </span>
                                    <span className={styles.authItemText}>
                                        {detailsData?.certification_info
                                            ?.certificated_at
                                            ? moment(
                                                  detailsData
                                                      ?.certification_info
                                                      ?.certificated_at,
                                              ).format('YYYY-MM-DD HH:mm:ss')
                                            : '--'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.descInfoBox}>
                        {baseLabel(__('描述信息'))}
                        <div className={styles.descInfoText}>
                            {detailsData?.description || '--'}
                        </div>
                    </div>
                </div>
            )
        }

        const renderEmpty = () => {
            const emptyText =
                searchParams.type === 'category' ? (
                    <div>
                        <div>
                            {__('点击')}
                            <Button
                                type="link"
                                onClick={() =>
                                    handleOperate('addCategories', currentData)
                                }
                            >
                                【{__('新建类别')}】
                            </Button>
                            {__('按钮可新建类别')}
                        </div>
                    </div>
                ) : searchParams.type === 'term' ? (
                    <div>
                        <div>
                            {__('点击')}
                            <Button
                                type="link"
                                onClick={() =>
                                    handleOperate('addTerms', currentData)
                                }
                            >
                                【{__('新建术语')}】
                            </Button>
                            {__('按钮可新建术语')}
                        </div>
                    </div>
                ) : (
                    <div>
                        <div>
                            {__('点击')}
                            <Button
                                type="link"
                                onClick={() =>
                                    handleOperate('addCategories', currentData)
                                }
                            >
                                【{__('新建类别')}】
                            </Button>
                            {__('按钮或')}
                            <Button
                                type="link"
                                onClick={() =>
                                    handleOperate('addTerms', currentData)
                                }
                            >
                                【{__('新建术语')}】
                            </Button>
                            {__('按钮')}
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            {__('可新建类别或术语')}
                        </div>
                    </div>
                )
            const desc = searchValue ? __('抱歉，没有找到相关内容') : emptyText
            return (
                <div className={styles.emptyBox}>
                    <Empty
                        iconSrc={searchValue ? undefined : emptyAdd}
                        desc={desc}
                    />
                </div>
            )
        }

        const pageOnChange = async (offset, limit) => {
            setCurrentPage(offset)
            setSearchParams({ ...searchParams, offset, limit })
        }

        const typeChange = (val) => {
            const type = val.target.value
            setCurrentPage(1)
            setSearchParams({ ...searchParams, type, offset: 1 })
        }

        const delRelation = async (id: string) => {
            confirm({
                title: `${__(`确定要删除吗？`)}`,
                icon: <ExclamationCircleFilled style={{ color: '#F5222D' }} />,
                content: __('删除后后将无法找回，请谨慎操作！'),
                async onOk() {
                    try {
                        await delTermsRelation(id)
                        message.success(__('删除成功'))
                        getDetails()
                    } catch (err) {
                        formatError(err)
                    }
                },
                onCancel() {},
            })
        }

        // 术语
        const termsCantainer = () => {
            return (
                <div className={styles.termsCantainer}>
                    <div className={styles.termsLeft}>
                        {detailsData?.relations?.map((item) => (
                            <div
                                className={classnames(
                                    styles.termsLeftItem,
                                    selectdRelations.relation_type ===
                                        item.relation_type && styles.active,
                                )}
                                key={item.relation_type}
                                onClick={() => setSelectdRelations(item)}
                            >
                                <div
                                    className={styles.termsItemLabel}
                                    title={item.relation_name}
                                >
                                    {item.relation_name}
                                </div>
                                <div className={styles.termsItemSum}>
                                    {item.terms_count}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.termsRight}>
                        <div className={styles.termsRightTitle}>
                            <div className={styles.termsTitle}>
                                {selectdRelations.relation_name}
                            </div>
                            {selectdRelations.relation_type !==
                                'ContainedBy' && (
                                <Button
                                    className={styles.addBtn}
                                    icon={<AddOutlined />}
                                    onClick={() =>
                                        moveModalRef?.current?.setOpen(true)
                                    }
                                >
                                    {__('添加')}
                                </Button>
                            )}
                        </div>

                        {selectdRelations?.terms?.length > 0 ? (
                            selectdRelations?.terms?.map((item) => (
                                <div
                                    className={styles.termsRightBox}
                                    key={item.id}
                                >
                                    <div className={styles.termsItemTitle}>
                                        {item.name}
                                    </div>
                                    <div className={styles.termsDescBox}>
                                        <div
                                            title={item.description}
                                            className={styles.termsItemDesc}
                                        >
                                            {item.description}
                                        </div>
                                        {selectdRelations.relation_type !==
                                            'ContainedBy' && (
                                            <Dropdown
                                                menu={{
                                                    items: [
                                                        {
                                                            key: 'delRelations',
                                                            label: (
                                                                <a
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        delRelation(
                                                                            item.relation_id,
                                                                        )
                                                                    }}
                                                                >
                                                                    <DeleteOutlined
                                                                        style={{
                                                                            marginRight:
                                                                                '10px',
                                                                        }}
                                                                    />
                                                                    删除
                                                                </a>
                                                            ),
                                                        },
                                                    ],
                                                }}
                                                placement="bottomRight"
                                            >
                                                <span
                                                    onClick={(e) =>
                                                        e.preventDefault()
                                                    }
                                                >
                                                    <MoreOutlined />
                                                </span>
                                            </Dropdown>
                                        )}
                                    </div>
                                    <div className={styles.termsItemPosition}>
                                        <div
                                            title={`${
                                                item?.path_map?.glossary
                                                    ?.map((it) => it.name)
                                                    ?.join('') || '--'
                                            }${
                                                item?.path_map?.category &&
                                                item?.path_map?.category
                                                    .length > 0
                                                    ? ' | '
                                                    : ''
                                            }${
                                                item?.path_map?.category
                                                    ? item?.path_map?.category
                                                          ?.map((it) => it.name)
                                                          ?.join(' > ')
                                                    : ''
                                            }`}
                                            className={styles.itemPositionBox}
                                        >
                                            <span
                                                className={styles.potisionIcon}
                                            >
                                                {positionIcon()}
                                            </span>
                                            {item?.path_map?.glossary
                                                ?.map((it) => it.name)
                                                ?.join('') || '--'}
                                            {item?.path_map?.category &&
                                                item?.path_map?.category
                                                    .length > 0 &&
                                                ` | `}
                                            {item?.path_map?.category
                                                ?.map((it) => it.name)
                                                ?.join(' > ')}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyBox}>
                                <Empty
                                    iconSrc={
                                        selectdRelations.relation_type ===
                                        'ContainedBy'
                                            ? dataEmpty
                                            : emptyAdd
                                    }
                                    desc={
                                        selectdRelations.relation_type ===
                                        'ContainedBy' ? (
                                            __('暂无数据')
                                        ) : (
                                            <div>
                                                <div>
                                                    {__('点击')}
                                                    <Button
                                                        type="link"
                                                        onClick={() =>
                                                            moveModalRef?.current?.setOpen(
                                                                true,
                                                            )
                                                        }
                                                    >
                                                        【{__('添加')}】
                                                    </Button>
                                                    {__('按钮，可新建关联术语')}
                                                </div>
                                            </div>
                                        )
                                    }
                                />
                            </div>
                        )}
                    </div>
                </div>
            )
        }
        // 术语表和类别
        const glossaryAndCategoriesCantainer = () => {
            return (
                <div className={styles.ategoriesAndTermsBox}>
                    <div className={styles.searchBox}>
                        <Radio.Group onChange={typeChange} defaultValue="">
                            <Radio.Button value="">
                                <ResourceDirOutlined />
                                <span className={styles.searchText}>
                                    {__('全部')}
                                </span>
                                <span>
                                    {detailsData?.count_info?.total_count || 0}
                                </span>
                            </Radio.Button>
                            <Radio.Button value="category">
                                <GlossaryMgmtIcons
                                    showDot={false}
                                    type={GlossaryType.CATEGORIES}
                                />
                                <span className={styles.searchText}>
                                    {__('类别')}
                                </span>
                                <span>
                                    {detailsData?.count_info
                                        ?.categories_count || 0}
                                </span>
                            </Radio.Button>
                            <Radio.Button value="term">
                                <GlossaryMgmtIcons
                                    showDot={false}
                                    type={GlossaryType.TERMS}
                                />
                                <span className={styles.searchText}>
                                    {__('术语')}
                                </span>
                                <span>
                                    {detailsData?.count_info?.terms_count || 0}
                                </span>
                            </Radio.Button>
                        </Radio.Group>
                        <SearchInput
                            placeholder={__('请输入名称')}
                            value={searchValue}
                            onKeyChange={(value: string) => {
                                setSearchValue(value)
                            }}
                            className={styles.searchInput}
                            style={{ width: 272 }}
                            hidden={isEmpty && !searchValue}
                        />
                    </div>
                    {isEmpty ? (
                        renderEmpty()
                    ) : (
                        <div className={styles.containerBox}>
                            {categoriesAndTermsData?.entries.map((item) => (
                                <div className={styles.itemBox} key={item.id}>
                                    <div className={styles.itemTitleBox}>
                                        <span className={styles.typeIcon}>
                                            <GlossaryMgmtIcons
                                                showDot={false}
                                                type={item.type}
                                                style={{
                                                    fontSize: '20px',
                                                    width: '20px',
                                                    color: 'rgba(18, 110, 227, 0.80)',
                                                }}
                                            />
                                        </span>
                                        <span
                                            className={styles.itemTitle}
                                            title={item.name}
                                        >
                                            {item.name}
                                        </span>
                                        <span className={styles.statueIcon}>
                                            {statusIcon(item.status)}
                                        </span>
                                    </div>
                                    <div
                                        className={styles.itemDescBox}
                                        title={item.description}
                                    >
                                        {item.description || '--'}
                                    </div>
                                    <div
                                        title={`${
                                            item?.path_map?.glossary
                                                ?.map((it) => it.name)
                                                ?.join('') || '--'
                                        }${
                                            item?.path_map?.category &&
                                            item?.path_map?.category.length >
                                                0 &&
                                            ' | '
                                        }${item?.path_map?.category
                                            ?.map((it) => it.name)
                                            ?.join(' > ')}`}
                                        className={styles.itemPositionBox}
                                    >
                                        <span className={styles.potisionIcon}>
                                            {positionIcon()}
                                        </span>
                                        {item?.path_map?.glossary
                                            ?.map((it) => it.name)
                                            ?.join('') || '--'}
                                        {item?.path_map?.category &&
                                            item?.path_map?.category.length >
                                                0 &&
                                            ` | `}
                                        {item?.path_map?.category
                                            ?.map((it) => it.name)
                                            ?.join(' > ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className={styles.paginationBox}>
                        <ListPagination
                            listType={ListType.CardList}
                            queryParams={searchParams}
                            total={categoriesAndTermsData?.total_count || 0}
                            onChange={pageOnChange}
                        />
                    </div>
                </div>
            )
        }
        // 术语tabs
        const categoriesAndTermsCantainer = () => {
            return detailsData.type === GlossaryType.TERMS
                ? termsCantainer()
                : glossaryAndCategoriesCantainer()
        }

        const tabsLabel = () => {
            if (detailsData.type === GlossaryType.TERMS) {
                return <span className={styles.tabsText}>{__('关联术语')}</span>
            }
            return (
                <span className={styles.tabsText}>
                    <span>{__('术语和类别')}</span>
                    <span className={styles.tabsLabel}>
                        {detailsData.count_info?.total_count ||
                            categoriesAndTermsData?.total_count}
                    </span>
                </span>
            )
        }

        const tabsItems = [
            {
                label: <span className={styles.tabsText}>{__('概览')}</span>,
                key: 'general',
            },
            {
                label: tabsLabel(),
                key: 'categoriesAndTerms',
            },
        ]

        const tabsChange = async (key) => {
            await setActiveKey(key)
            setCurrentPage(1)
            setSearchValue('')
            if (key === 'general' && currentData.type !== GlossaryType.TERMS) {
                setSearchParams({
                    ...searchParams,
                    offset: 1,
                    keyword: '',
                })
            }
        }

        return (
            <div className={styles.ClossaryDetailWrapper}>
                <div className={styles.titleBox}>
                    <div className={styles.titleLeft}>
                        <span className={styles.titleBoxLeft}>
                            {menuIcon()}
                        </span>
                        <div className={styles.titleBoxRight}>
                            <div className={styles.firstTitle}>
                                <span className={styles.text}>
                                    {detailsData.name}
                                </span>
                                {statusIcon(
                                    detailsData?.certification_info?.status,
                                )}
                            </div>
                            <div className={styles.subTitle}>
                                <GlossaryMgmtIcons
                                    showDot={false}
                                    type={currentData.type}
                                />
                                &nbsp;
                                {GlossaryTypeOptions.find(
                                    (item) => item.value === currentData.type,
                                )?.label || currentData.type}
                            </div>
                        </div>
                    </div>
                    <DropdownOperate
                        currentData={currentData}
                        handleOperate={handleOperate}
                    />
                </div>
                <div className={styles.detailsTabs}>
                    <Tabs
                        getPopupContainer={(node) => node}
                        tabBarGutter={32}
                        items={tabsItems}
                        activeKey={activeKey}
                        destroyInactiveTabPane
                        onChange={tabsChange}
                    />
                    <Spin spinning={fetching}>
                        {activeKey === 'general'
                            ? generalCantainer()
                            : categoriesAndTermsCantainer()}
                    </Spin>
                </div>

                <MoveModal
                    optionsType={optionType.AddRelation}
                    currentData={detailsData}
                    ref={moveModalRef}
                    relationType={selectdRelations?.relation_type}
                    onOk={getDetails}
                />
            </div>
        )
    },
)
export default GlossaryDetail
