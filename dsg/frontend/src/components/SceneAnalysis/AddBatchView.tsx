import {
    Button,
    Modal,
    ModalProps,
    Select,
    Tooltip,
    Dropdown,
    Space,
    Pagination,
    List,
    Checkbox,
    Collapse,
} from 'antd'
import React, { useRef, useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import Icon, { DownOutlined, CloseOutlined } from '@ant-design/icons'
import { useUpdateEffect } from 'ahooks'
import __ from './locale'
import styles from './styles.module.less'
import { ReactComponent as basicInfo } from '@/assets/DataAssetsCatlg/basicInfo.svg'
import dataEmpty from '@/assets/dataEmpty.svg'
import { CongSearchProvider } from '@/components/SceneAnalysis/AiSearchProvider'
import AiDialog from '@/components/SceneAnalysis/AiDialog'
import FieldList from '@/components/DimensionModel/components/ChooseBizTable/FieldList'
import { DatasheetViewColored } from '@/icons'
import { ViewType, viewOptionList } from './const'
import { Empty, Loader, SearchInput } from '@/ui'
import { formatError, getDatasetTree, getUserDatasheetView } from '@/core'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

const { Panel } = Collapse

const EmptyView = (search: boolean) => {
    const text = (
        <div className={styles.emptyText}>
            <div className={styles.emptyFirstText}>
                {__('抱歉，没有找到相关内容')}
            </div>
            <div>{__('找不到的可能原因是：')}</div>
            <div>{__('1、库表不存在')}</div>
            <div>{__('2、库表存在但未发布')}</div>
        </div>
    )
    return search ? (
        <Empty iconHeight={100} desc={text} />
    ) : (
        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
    )
}

const CatalogItem = (props: any) => {
    const {
        item,
        selected,
        checked,
        onSelect,
        handleChangeCheckbox,
        inDataset,
    } = props
    return (
        <div
            className={classnames({
                [styles['catalog-item']]: true,
                [styles['is-selected']]: selected,
                [styles['is-checked']]: checked,
                [styles['in-dataset']]: inDataset,
            })}
        >
            {handleChangeCheckbox && (
                <Checkbox
                    checked={checked}
                    style={{ marginRight: 12 }}
                    onChange={(e) => handleChangeCheckbox(e, item)}
                />
            )}
            <div
                className={styles['catalog-item-icon']}
                onClick={() => !selected && onSelect?.()}
            >
                <DatasheetViewColored />
            </div>
            <div
                className={styles['catalog-item-title']}
                onClick={() => !selected && onSelect?.()}
            >
                <div
                    title={`${item?.business_name}（${item?.technical_name}）`}
                    className={styles['catalog-item-title-name']}
                >
                    {`${item?.business_name}（${item?.technical_name}）`}
                </div>
                <div
                    title={item?.uniform_catalog_code}
                    className={styles['catalog-item-title-code']}
                >
                    {item?.uniform_catalog_code}
                </div>
            </div>
        </div>
    )
}

interface IChooseLogicalView extends ModalProps {
    open: boolean
    checkedId?: string
    onClose: () => void
    onSure: (info) => void
    hasAiButton?: boolean
    formDataApp?: boolean
}
/**
 * 库表选择窗
 */
const ChooseLogicalView: React.FC<IChooseLogicalView> = ({
    open,
    checkedId,
    onClose,
    onSure,
    hasAiButton = true,
    formDataApp = false,
    ...props
}) => {
    const initSearchCondition = {
        keyword: '',
        offset: 1,
        limit: 10,
        publish_status: 'publish',
        owner: false,
    }
    const [checkedItem, setCheckedItem] = useState<any>([])
    const [viewKey, setViewKey] = useState<ViewType>(ViewType.Give)
    const [selectedNode, setSelectedNode] = useState<any>()
    const [dropdownItems, setDropdownItems] = useState<any>([])
    const [data, setData] = useState<any[]>()
    const [total, setTotal] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>()
    const [searchCondition, setSearchCondition] =
        useState<any>(initSearchCondition)
    const [{ using }] = useGeneralConfig()
    // 来自数据产品
    const [aiShow, setAiShow] = useState(false)
    const [isDialogShowClick, setIsDialogShowClick] = useState(true)
    const initDataRef = useRef<any[]>([])

    const [datasetLoading, setDatasetLoading] = useState<boolean>(false)
    const [datasetList, setDatasetList] = useState<any[]>([])
    const [datasetKeyword, setDatasetKeyword] = useState<string>('')

    const searchDataset = useMemo(() => {
        if (!datasetKeyword) return []
        const kw = datasetKeyword.trim().toLowerCase()
        return datasetList
            .map((item) => item.children)
            .flat()
            .reduce((acc, item) => {
                if (
                    !acc.find((o) => o.id === item.id) &&
                    (item.name.toLowerCase().includes(kw) ||
                        item.technical_name.toLowerCase().includes(kw) ||
                        item.uniform_catalog_code.toLowerCase().includes(kw))
                ) {
                    acc.push(item)
                }
                return acc
            }, [])
    }, [datasetKeyword, datasetList])

    const handleOk = async () => {
        onSure(checkedItem)
        setCheckedItem([])
    }

    const removeDropList = (key: string) => {
        let newCheckItems = []
        if (key !== 'all') {
            newCheckItems = checkedItem.filter(
                (checkItem) => checkItem.id !== key,
            )
        }
        setCheckedItem(newCheckItems)
    }

    const getListData = async (params) => {
        try {
            setLoading(true)
            const res = await getUserDatasheetView(params)
            initDataRef.current = res?.entries || []
            setData(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
            setData([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }

    useUpdateEffect(() => {
        getListData(searchCondition)
    }, [searchCondition])

    const handleChangeCheckbox = (e, curr) => {
        let newCheckItems: any = []
        if (e.target.checked) {
            const tmp = [...checkedItem, curr]
            newCheckItems = tmp.reduce((acc, current: any) => {
                const exists = acc.some((item: any) => item.id === current.id)
                if (!exists) {
                    // @ts-ignore
                    acc.push(current)
                }
                return acc
            }, [])
        } else {
            newCheckItems = checkedItem.filter(
                (checkItem) => checkItem.id !== curr.id,
            )
        }
        setCheckedItem(newCheckItems)
    }

    const handleChangeDatasetCheckbox = (e, curr) => {
        let newCheckItems: any = []
        const { children } = curr
        if (e.target.checked) {
            const tmp = [...checkedItem, ...children]
            newCheckItems = tmp.reduce((acc, current: any) => {
                const exists = acc.some((item: any) => item.id === current.id)
                if (!exists) {
                    // @ts-ignore
                    acc.push(current)
                }
                return acc
            }, [])
        } else {
            newCheckItems = checkedItem.filter(
                (checkItem) => !children.find((o) => o.id === checkItem.id),
            )
        }
        setCheckedItem(newCheckItems)
    }

    const itemRender = (item: any, inDataset = false) => {
        return (
            <CatalogItem
                key={item.id}
                item={item}
                selected={item.id === selectedNode?.id}
                onSelect={() => setSelectedNode(item)}
                checked={checkedItem.find((o) => o.id === item.id)}
                handleChangeCheckbox={handleChangeCheckbox}
                inDataset={inDataset}
            />
        )
    }

    const handleAiOpen = () => {
        // setAiOpen?.(true)
        // setIsDialogClick?.(true)
        onClose?.()
    }

    const handleAiShow = () => {
        setAiShow(true)
        onClose?.()
        // setIsDialogClick?.(true)
    }

    const handleSearch = (value: string) => {
        if (searchCondition.keyword === value) return
        if (value) {
            setSearchCondition({
                ...searchCondition,
                keyword: value,
            })
        } else {
            setSearchCondition({
                ...searchCondition,
                keyword: '',
            })
        }
    }

    // 获取数据集列表
    const getDatasetList = async () => {
        try {
            setDatasetLoading(true)
            const res = await getDatasetTree({
                limit: 2000,
                offset: 1,
            })
            setDatasetList(
                res?.map((item) => ({
                    ...item,
                    children:
                        item.children?.map((child) => ({
                            ...child,
                            business_name: child.name,
                        })) || [],
                })) || [],
            )
        } catch (error) {
            formatError(error)
        } finally {
            setDatasetLoading(false)
        }
    }

    useEffect(() => {
        if (open) {
            setCheckedItem([])
            setViewKey(ViewType.Give)
            setSelectedNode(undefined)
            setSearchCondition(initSearchCondition)
            setDatasetKeyword('')
            getDatasetList()
        }
    }, [open])

    useEffect(() => {
        const initailItem = {
            label: (
                <div
                    className={styles['addBatchView-bottom-title']}
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className={styles['addBatchView-bottom-title-text']}>
                        {__('本次已选')}：{checkedItem.length} 个
                    </span>
                    <a
                        className={styles['addBatchView-bottom-title-clearAll']}
                        onClick={() => removeDropList('all')}
                    >
                        {__('清空')}
                    </a>
                </div>
            ),
            key: `initail`,
        }
        const dropList = checkedItem.map((listItem: any) => ({
            label: (
                <div
                    className={styles['addBatchView-bottom-item']}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Space size={8}>
                        <DatasheetViewColored />
                        <span
                            className={styles['addBatchView-bottom-text']}
                            title={listItem.business_name || listItem.name}
                        >
                            {listItem.business_name || listItem.name}
                        </span>
                    </Space>
                    <CloseOutlined
                        onClick={() => removeDropList(listItem.id)}
                    />
                </div>
            ),
            key: `${listItem.id}`,
        }))
        const newDropList = [initailItem, ...dropList]
        setDropdownItems(newDropList)
    }, [checkedItem.length])

    const footer = (
        <div className={styles['addBatchView-bottom']}>
            <div className={styles['addBatchView-bottom-openAi']}>
                {/* {hasAiButton && using === 1 && (
                    <>
                        {__('不知道或找不到要用的数据？试试')}
                        <span
                            className={styles['addBatchView-bottom-configIcon']}
                            onClick={formDataApp ? handleAiShow : handleAiOpen}
                        >
                            <img
                                src={aiGuide}
                                alt=""
                                className={styles.aiImg}
                            />
                            <span>AI{__('找数')}</span>
                        </span>
                    </>
                )} */}
            </div>
            <div className={styles['justify-end']}>
                <div
                    className={classnames(
                        styles['addBatchView-bottom-wrapper'],
                        checkedItem.length > 7
                            ? styles['addBatchView-bottom-box-more']
                            : styles['addBatchView-bottom-box-less'],
                    )}
                >
                    {checkedItem.length === 0 ? (
                        <p className={styles['addBatchView-bottom-gray']}>
                            {__('本次已选')}：{checkedItem.length} 个
                        </p>
                    ) : (
                        <Dropdown
                            menu={{
                                items: dropdownItems,
                            }}
                            trigger={['click']}
                            getPopupContainer={(node) => node}
                        >
                            <a onClick={(e) => e.preventDefault()}>
                                <Space>
                                    <span>
                                        {__('本次已选')}：{checkedItem.length}{' '}
                                        个
                                    </span>
                                    <DownOutlined />
                                </Space>
                            </a>
                        </Dropdown>
                    )}
                </div>
                <Button style={{ minWidth: 80, height: 32 }} onClick={onClose}>
                    {__('取消')}
                </Button>
                <Tooltip
                    placement="topRight"
                    title={checkedItem.length ? '' : __('请选择要引用的库表')}
                >
                    <Button
                        style={{
                            minWidth: 80,
                            height: 32,
                            marginLeft: 8,
                        }}
                        type="primary"
                        disabled={!checkedItem.length}
                        onClick={handleOk}
                    >
                        {__('确定')}
                    </Button>
                </Tooltip>
            </div>
        </div>
    )

    // 检查全选
    const isAllChecked = (value: any) => {
        const { children } = value
        if (children?.length === 0) {
            return false
        }
        return children?.every((item) =>
            checkedItem.some((o) => o.id === item.id),
        )
    }

    // 检查部分选中
    const isIndeterminate = (value: any) => {
        const { children } = value
        if (children?.length === 0) {
            return false
        }
        const itemData = children?.filter((item) =>
            checkedItem.some((o) => o.id === item.id),
        )
        return itemData.length > 0 && itemData.length < children?.length
    }

    return (
        <>
            <Modal
                title={__('批量添加库表')}
                width={1000}
                maskClosable={false}
                open={open}
                onCancel={onClose}
                onOk={handleOk}
                destroyOnClose
                getContainer={false}
                okButtonProps={{
                    disabled: checkedItem.length === 0,
                }}
                footer={footer}
                bodyStyle={{ height: 534, padding: 0 }}
                {...props}
            >
                <div className={styles.addBatchView}>
                    <div className={styles['addBatchView-left']}>
                        <div className={styles['addBatchView-left-top']}>
                            <Icon component={basicInfo} />
                            <Select
                                value={viewKey}
                                bordered={false}
                                options={viewOptionList}
                                onChange={(option: ViewType) => {
                                    setViewKey(option)
                                    if (option === ViewType.Dataset) {
                                        setSearchCondition({
                                            ...searchCondition,
                                            keyword: '',
                                        })
                                    } else {
                                        setSearchCondition({
                                            ...searchCondition,
                                            keyword: '',
                                            owner: option === ViewType.Owner,
                                        })
                                    }
                                }}
                                dropdownStyle={{ minWidth: 140 }}
                                getPopupContainer={(n) => n}
                            />
                        </div>
                        {(viewKey === ViewType.Give ||
                            viewKey === ViewType.Owner) && (
                            <div
                                className={styles['addBatchView-left-orgTree']}
                            >
                                <div
                                    className={
                                        styles['addBatchView-wrapper-search']
                                    }
                                >
                                    <SearchInput
                                        placeholder={__(
                                            '搜索库表业务名称、技术名称、编码',
                                        )}
                                        value={searchCondition.keyword}
                                        onKeyChange={handleSearch}
                                    />
                                </div>
                                {loading ? (
                                    <div style={{ paddingTop: '56px' }}>
                                        <Loader />
                                    </div>
                                ) : data?.length ? (
                                    <div
                                        className={classnames(
                                            styles['catalog-wrapper-list'],
                                            // owner && isDataOwner && styles.ownerList,
                                        )}
                                    >
                                        <div
                                            id="catalog-list"
                                            className={
                                                styles[
                                                    'catalog-wrapper-list-box'
                                                ]
                                            }
                                        >
                                            <List
                                                dataSource={data}
                                                renderItem={(item) =>
                                                    itemRender(item)
                                                }
                                            />
                                        </div>
                                        <div
                                            className={
                                                styles[
                                                    'catalog-wrapper-list-page'
                                                ]
                                            }
                                        >
                                            <Pagination
                                                total={total}
                                                current={searchCondition.offset}
                                                size="small"
                                                showSizeChanger={false}
                                                onChange={(page, pageSize) => {
                                                    setSearchCondition({
                                                        ...searchCondition,
                                                        offset: page,
                                                        limit: pageSize,
                                                    })
                                                }}
                                                hideOnSinglePage
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    EmptyView(!!searchCondition.keyword)
                                )}
                            </div>
                        )}
                        {viewKey === ViewType.Dataset && (
                            <div
                                className={styles['addBatchView-left-dataset']}
                            >
                                <div
                                    className={
                                        styles['addBatchView-wrapper-search']
                                    }
                                >
                                    <SearchInput
                                        placeholder={__(
                                            '搜索库表业务名称、技术名称、编码',
                                        )}
                                        value={datasetKeyword}
                                        onKeyChange={(value) => {
                                            if (datasetKeyword === value) return
                                            setDatasetKeyword(value)
                                        }}
                                    />
                                </div>
                                {datasetLoading ? (
                                    <div style={{ paddingTop: '56px' }}>
                                        <Loader />
                                    </div>
                                ) : datasetKeyword ? (
                                    searchDataset.length > 0 ? (
                                        <div
                                            className={classnames(
                                                styles['dataset-search-list'],
                                            )}
                                        >
                                            <div
                                                id="catalog-list"
                                                className={
                                                    styles[
                                                        'dataset-search-list-box'
                                                    ]
                                                }
                                            >
                                                <List
                                                    dataSource={searchDataset}
                                                    renderItem={(item) =>
                                                        itemRender(item)
                                                    }
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        EmptyView(!!datasetKeyword)
                                    )
                                ) : datasetList?.length ? (
                                    <div className={styles.datasetCollapse}>
                                        <Collapse
                                            accordion
                                            expandIconPosition="end"
                                            ghost
                                        >
                                            {datasetList.map((item) => (
                                                <Panel
                                                    showArrow={
                                                        item.children?.length >
                                                        0
                                                    }
                                                    collapsible={
                                                        item.children?.length >
                                                        0
                                                            ? undefined
                                                            : 'disabled'
                                                    }
                                                    header={
                                                        <div
                                                            className={
                                                                styles.panelHeader
                                                            }
                                                        >
                                                            <Checkbox
                                                                checked={isAllChecked(
                                                                    item,
                                                                )}
                                                                indeterminate={isIndeterminate(
                                                                    item,
                                                                )}
                                                                disabled={
                                                                    item
                                                                        .children
                                                                        ?.length ===
                                                                    0
                                                                }
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                                onChange={(e) =>
                                                                    handleChangeDatasetCheckbox(
                                                                        e,
                                                                        item,
                                                                    )
                                                                }
                                                            />
                                                            <span
                                                                className={
                                                                    styles.panelHeaderText
                                                                }
                                                                title={
                                                                    item.name
                                                                }
                                                            >
                                                                {item.name}
                                                            </span>
                                                        </div>
                                                    }
                                                    key={item.id}
                                                >
                                                    {item.children?.map(
                                                        (child) =>
                                                            itemRender(
                                                                child,
                                                                true,
                                                            ),
                                                    )}
                                                </Panel>
                                            ))}
                                        </Collapse>
                                    </div>
                                ) : (
                                    EmptyView(false)
                                )}
                            </div>
                        )}
                    </div>
                    <div className={styles['addBatchView-right']}>
                        <div className={styles['lv-fieldlist']}>
                            <FieldList
                                showCode
                                selectedId={selectedNode?.id}
                                search={false}
                                title={__('预览')}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
            {aiShow && (
                <CongSearchProvider>
                    <AiDialog
                        onStartDrag={() => {}}
                        setIsDialogClick={setIsDialogShowClick}
                        isDialogClick={isDialogShowClick}
                        graphCase={null}
                        setAiOpen={setAiShow}
                        aiOpen={aiShow}
                        isUseData
                        selectorId="graphAIIcon"
                        style={{ left: '300px' }}
                    />
                </CongSearchProvider>
            )}
        </>
    )
}

export default ChooseLogicalView
