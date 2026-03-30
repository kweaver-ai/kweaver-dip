import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { uniq } from 'lodash'
import { Button, Checkbox, Drawer, Space, Tooltip } from 'antd'
import { useDebounce } from 'ahooks'
import { CloseOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { Resizable } from 're-resizable'
import InfiniteScroll from 'react-infinite-scroll-component'
import styles from './styles.module.less'
import __ from '../../locale'
import { FormTableKind, FormTableKindOptions } from '@/components/Forms/const'
import {
    FieldTypeIcon,
    formatError,
    formsQuery,
    getCommonDataType,
    getFormsFieldsList,
    SortDirection,
    transformQuery,
} from '@/core'
import { useBusinessModelContext } from '../../BusinessModelProvider'
import dataEmpty from '@/assets/dataEmpty.svg'
import { Empty, Loader, SearchInput } from '@/ui'
import { IconType } from '@/icons/const'
import { FontIcon } from '@/icons'
import { RefreshBtn } from '@/components/ToolbarComponents'
import { getTableTypeTag } from '../../helper'

const initQueryParams = {
    limit: 30,
    offset: 1,
    keyword: '',
    table_kind: undefined,
    direction: SortDirection.ASC,
    sort: 'name',
}

interface ISelectDataFormDrawer {
    open: boolean
    onClose: () => void
    title: string
    mid: string
    addedFormIds?: string[]
    onConfirm?: (selectedForms: any[]) => void
}

const SelectDataFormDrawer = ({
    open,
    onClose,
    title,
    mid,
    addedFormIds = [],
    onConfirm,
}: ISelectDataFormDrawer) => {
    const [queryParams, setQueryParams] = useState<{
        limit: number
        offset: number
        keyword: string
        table_kind: FormTableKind | undefined
        direction: SortDirection
        sort: string
    }>(initQueryParams)
    const [totalCount, setTotalCount] = useState(0)
    const [originForms, setOriginForms] = useState<Array<any>>([])
    const { isDraft, selectedVersion } = useBusinessModelContext()
    const [selectedFormIds, setSelectedFormIds] = useState<string[]>([])
    const scrollRef = useRef<HTMLDivElement>(null)
    const scrollListId = 'scrollableDiv'

    const [searchKeyword, setSearchKeyword] = useState<string>('')

    const debounceSearchKey = useDebounce(searchKeyword, { wait: 500 })

    const [initLoading, setInitLoading] = useState(true)

    const [listLoading, setListLoading] = useState(false)

    const [indeterminate, setIndeterminate] = useState(false)

    const [checkedAll, setCheckedAll] = useState(false)

    const [viewFormId, setViewFormId] = useState<string | undefined>(undefined)

    const [fieldList, setFieldList] = useState<Array<any>>([])

    const [fieldListLoading, setFieldListLoading] = useState(false)

    const [newAddForms, setNewAddForms] = useState<Array<any>>([])

    const [isOpenMore, setIsOpenMore] = useState(false)

    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])

    useEffect(() => {
        setQueryParams({
            ...queryParams,
            keyword: debounceSearchKey,
            offset: 1,
        })
    }, [debounceSearchKey])

    useEffect(() => {
        if (addedFormIds.length > 0) {
            setSelectedFormIds(addedFormIds)
        }
    }, [addedFormIds])

    useEffect(() => {
        if (open) {
            if (queryParams.offset === 1) {
                getOriginForms([])
            } else {
                getOriginForms(originForms)
            }
        }
    }, [queryParams, open])

    useEffect(() => {
        const newAddFormIds = selectedFormIds.filter(
            (id) => !addedFormIds.includes(id),
        )
        if (newAddFormIds.length > 0) {
            const lastNewAddFormIds = newAddForms?.map((item) => item.id)

            const filteredNewAddFormsIds = newAddFormIds.filter(
                (id) => !lastNewAddFormIds.includes(id),
            )

            const filteredOriginForms = filteredNewAddFormsIds
                .map((id) => originForms.find((item) => item.id === id))
                .filter((item) => item)
            setNewAddForms(
                [...newAddForms, ...filteredOriginForms].filter((item) =>
                    newAddFormIds.includes(item.id),
                ),
            )
        } else {
            setNewAddForms([])
        }
    }, [selectedFormIds])

    useEffect(() => {
        if (viewFormId) {
            getFieldList(viewFormId)
        }
    }, [viewFormId])

    /**
     * 获取数据表
     * @param lastData 上一次获取的数据
     */
    const getOriginForms = async (lastData: Array<any>) => {
        try {
            setListLoading(true)
            const res = await formsQuery(mid, {
                ...queryParams,
                ...versionParams,
            })
            setTotalCount(res.total_count)
            setOriginForms([...lastData, ...res.entries])
        } catch (err) {
            formatError(err)
        } finally {
            if (initLoading) {
                setInitLoading(false)
            }
            setListLoading(false)
        }
    }

    useEffect(() => {
        if (originForms.length > 0 && selectedFormIds.length > 0) {
            if (selectedFormIds.length < originForms.length) {
                setIndeterminate(true)
            } else {
                const originFormIds = originForms.map((item) => item.id)
                let selectedCount: number = 0

                originFormIds.forEach((id) => {
                    if (selectedFormIds.includes(id)) {
                        selectedCount += 1
                    }
                })
                setIndeterminate(
                    selectedCount > 0 && selectedCount < originFormIds.length,
                )
                setCheckedAll(selectedCount === originFormIds.length)
            }
        } else {
            setIndeterminate(false)
            setCheckedAll(false)
        }
    }, [originForms, selectedFormIds])

    /**
     * 全选
     */
    const handleSelectAll = () => {
        if (addedFormIds.length > 0) {
            if (selectedFormIds.length === originForms.length) {
                setSelectedFormIds(addedFormIds)
            } else {
                setSelectedFormIds(
                    uniq([
                        ...addedFormIds,
                        ...originForms.map((item) => item.id),
                    ]),
                )
            }
        } else if (selectedFormIds.length === originForms.length) {
            setSelectedFormIds([])
        } else {
            setSelectedFormIds(originForms.map((item) => item.id))
        }
    }

    /**
     * 获取字段列表
     * @param formId 表id
     */
    const getFieldList = async (formId: string) => {
        try {
            setFieldListLoading(true)
            const res = await getFormsFieldsList(formId, {
                limit: 999,
                ...versionParams,
            })
            setFieldList(res.entries)
        } catch (err) {
            formatError(err)
        } finally {
            setFieldListLoading(false)
        }
    }

    const onDelete = (item: any) => {
        setSelectedFormIds(selectedFormIds.filter((id) => id !== item.id))
    }

    const getItemTooltipTitle = (item: any) => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                rowGap: 4,
                maxHeight: 400,
                overflow: 'hidden auto',
            }}
        >
            <div style={{ color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>
                {__('数据表名称：')}
            </div>
            <div>{item.name}</div>
        </div>
    )
    const getCheckedItemTag = (item: any) => {
        return (
            <div key={item.id} className={styles.selInfoItem}>
                <Tooltip
                    title={getItemTooltipTitle(item)}
                    color="#fff"
                    overlayInnerStyle={{
                        color: 'rgba(0,0,0,0.85)',
                    }}
                >
                    <div className={styles.selFieldInfo} title={item.name}>
                        <div className={styles.selInfoItemName}>
                            {item.name || '--'}
                        </div>
                    </div>
                </Tooltip>
                <CloseOutlined
                    className={styles.selInfoItemDelBtn}
                    onClick={() => onDelete(item)}
                />
            </div>
        )
    }

    /**
     * 确定
     */
    const handleOk = () => {
        // setSelectedFormIds([...selectedFormIds, ...newAddForms])
        onConfirm?.(newAddForms)
    }

    const footer = (
        <div className={styles.footer}>
            <div className={styles.selFieldList}>
                <div className={styles.selectedInfo}>
                    {__('已选（${text}）', {
                        text: newAddForms.length || '0',
                    })}
                </div>
                <div className={styles.selInfoItemsContWrapper}>
                    {newAddForms
                        ?.filter((item) => item.id)
                        ?.slice(0, 3)
                        ?.map((item) => getCheckedItemTag(item))}
                    {newAddForms.length > 3 && (
                        <Tooltip
                            color="#fff"
                            overlayInnerStyle={{
                                display: 'flex',
                                flexDirection: 'column',
                                rowGap: 4,
                                color: 'rgba(0,0,0,0.85)',
                                maxHeight: 'calc(100vh - 133px)',
                                overflow: 'hidden auto',
                            }}
                            trigger="click"
                            placement="top"
                            getPopupContainer={(n) => n.parentElement || n}
                            onOpenChange={(op) => {
                                setIsOpenMore(op)
                            }}
                            title={newAddForms
                                .slice(3)
                                .map((item) => getCheckedItemTag(item))}
                        >
                            <div
                                className={classnames(styles.selInfoItemsMore, {
                                    [styles.moreOpen]: isOpenMore,
                                })}
                            >
                                {`+${newAddForms.length - 3}`}
                            </div>
                        </Tooltip>
                    )}
                </div>

                {newAddForms.length > 0 && (
                    <div
                        onClick={() => {
                            if (newAddForms.length > 0) {
                                setSelectedFormIds(
                                    selectedFormIds.filter(
                                        (id) =>
                                            !newAddForms
                                                .map((item) => item.id)
                                                .includes(id),
                                    ),
                                )
                            } else {
                                setSelectedFormIds([])
                            }
                        }}
                        className={styles.clearAllBtn}
                    >
                        {__('清空')}
                    </div>
                )}
            </div>
            <Space size={8}>
                <Button onClick={onClose} className={styles.btnOp}>
                    {__('取消')}
                </Button>
                <Button
                    type="primary"
                    onClick={handleOk}
                    className={styles.btnOp}
                >
                    {__('确定')}
                </Button>
            </Space>
        </div>
    )

    return (
        <Drawer
            title={__('添加来源表')}
            width="100%"
            maskClosable={false}
            open={open}
            onClose={onClose}
            footer={footer}
            destroyOnClose
            contentWrapperStyle={{
                maxWidth: '1000px',
            }}
            bodyStyle={{
                display: 'flex',
                padding: '0 0 0 0',
            }}
            className={styles.catlgInfoChooseDrawer}
        >
            <Resizable
                defaultSize={{ width: 250, height: '100%' }}
                maxWidth={250}
                minWidth={100}
                enable={{
                    right: true,
                }}
            >
                <div className={styles.selectListWrapper}>
                    <div className={styles.selectListTitle}>{__('表类型')}</div>
                    <div className={styles.allWrapper}>
                        <div
                            className={classnames(
                                styles.allItem,
                                queryParams.table_kind === undefined &&
                                    styles.selectedItem,
                            )}
                            onClick={() => {
                                setQueryParams({
                                    ...queryParams,
                                    table_kind: undefined,
                                    offset: 1,
                                })
                            }}
                        >
                            {__('全部')}
                        </div>
                        <div className={styles.listWrapper}>
                            {FormTableKindOptions.filter(
                                (item) =>
                                    item.value !== FormTableKind.BUSINESS &&
                                    item.value !== FormTableKind.STANDARD,
                            ).map((item) => (
                                <div
                                    key={item.value}
                                    className={classnames(
                                        styles.leftItemData,
                                        queryParams.table_kind === item.value &&
                                            styles.selectedItem,
                                    )}
                                    onClick={() => {
                                        setQueryParams({
                                            ...queryParams,
                                            table_kind: item.value,
                                            offset: 1,
                                        })
                                    }}
                                >
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Resizable>
            <div className={styles.selectTableListWrapper}>
                <div className={styles.selectListTitle}>{__('数据表')}</div>
                {initLoading ? (
                    <div className={styles.listLoading}>
                        <Loader />
                    </div>
                ) : !queryParams.keyword && originForms.length === 0 ? (
                    <div className={styles.listLoading}>
                        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                    </div>
                ) : (
                    <>
                        {(totalCount > 0 || !queryParams.keyword) && (
                            <div className={styles.searchWrapper}>
                                <SearchInput
                                    placeholder={__('搜索数据表')}
                                    value={searchKeyword}
                                    onKeyChange={(keyword: string) => {
                                        setSearchKeyword(keyword)
                                    }}
                                />
                                <RefreshBtn
                                    onClick={() =>
                                        setQueryParams({
                                            ...queryParams,
                                            offset: 1,
                                        })
                                    }
                                />
                            </div>
                        )}
                        {(totalCount > 0 || !queryParams.keyword) && (
                            <div
                                className={styles.selectedAllWrapper}
                                onClick={handleSelectAll}
                            >
                                <Checkbox
                                    checked={checkedAll}
                                    indeterminate={indeterminate}
                                />
                                <div>{__('全选')}</div>
                            </div>
                        )}
                        <div
                            ref={scrollRef}
                            id={scrollListId}
                            className={styles.scrollWrapper}
                        >
                            <InfiniteScroll
                                hasMore={originForms.length < totalCount}
                                loader={
                                    <div
                                        className={styles.listLoading}
                                        hidden={!listLoading}
                                    >
                                        <Loader />
                                    </div>
                                }
                                next={() => {
                                    setQueryParams({
                                        ...queryParams,
                                        offset: queryParams.offset + 1,
                                    })
                                }}
                                dataLength={originForms.length}
                                scrollableTarget={scrollListId}
                            >
                                {originForms.map((item) => (
                                    <div className={styles.itemWrapper}>
                                        <Checkbox
                                            checked={selectedFormIds.includes(
                                                item.id,
                                            )}
                                            disabled={addedFormIds.includes(
                                                item.id,
                                            )}
                                            onClick={() => {
                                                if (
                                                    addedFormIds.includes(
                                                        item.id,
                                                    )
                                                ) {
                                                    return
                                                }

                                                if (
                                                    selectedFormIds.includes(
                                                        item.id,
                                                    )
                                                ) {
                                                    setSelectedFormIds(
                                                        selectedFormIds.filter(
                                                            (id) =>
                                                                id !== item.id,
                                                        ),
                                                    )
                                                } else {
                                                    setSelectedFormIds([
                                                        ...selectedFormIds,
                                                        item.id,
                                                    ])
                                                }
                                            }}
                                        />
                                        <div
                                            className={classnames(
                                                styles.itemContent,
                                                viewFormId === item.id &&
                                                    styles.selected,
                                            )}
                                            onClick={() => {
                                                setViewFormId(item.id)
                                            }}
                                        >
                                            <div className={styles.iconWrapper}>
                                                <FontIcon
                                                    type={IconType.COLOREDICON}
                                                    name="icon-shujumuluguanli1"
                                                />
                                            </div>
                                            <div
                                                className={classnames(
                                                    styles.textWrapper,
                                                )}
                                            >
                                                <div
                                                    className={
                                                        styles.nameWrapper
                                                    }
                                                >
                                                    <div
                                                        className={styles.text}
                                                        title={item.name}
                                                    >
                                                        {item.name || '--'}
                                                    </div>
                                                    {getTableTypeTag(
                                                        item.table_kind,
                                                    )}
                                                </div>
                                                <div
                                                    className={
                                                        styles.name_enWrapper
                                                    }
                                                    title={item.technical_name}
                                                >
                                                    {item.technical_name ||
                                                        '--'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </InfiniteScroll>
                        </div>
                    </>
                )}
            </div>

            <Resizable
                defaultSize={{ width: 250, height: '100%' }}
                maxWidth={250}
                minWidth={100}
                boundsByDirection
                enable={{
                    left: true,
                }}
            >
                <div className={styles.selectListWrapper}>
                    <div className={styles.selectListTitle}>
                        {__('字段预览')}
                    </div>
                    {fieldListLoading ? (
                        <div className={styles.emptyWrapper}>
                            <Loader />
                        </div>
                    ) : fieldList?.length > 0 ? (
                        <div className={styles.fieldListWrapper}>
                            {fieldList.map((item) => (
                                <div className={styles.fieldItem} key={item.id}>
                                    <div className={styles.fieldIcon}>
                                        <FieldTypeIcon
                                            dataType={getCommonDataType(
                                                item.data_type,
                                            )}
                                            style={{
                                                color: 'rgba(0, 0, 0, 0.65)',
                                            }}
                                        />
                                    </div>
                                    <div className={styles.fieldName}>
                                        <div
                                            className={styles.fieldText}
                                            title={item.name}
                                        >
                                            {item.name}
                                        </div>
                                        <div
                                            className={styles.lastText}
                                            title={item.name_en}
                                        >
                                            {item.name_en}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyWrapper}>
                            <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                        </div>
                    )}
                </div>
            </Resizable>
        </Drawer>
    )
}

export default SelectDataFormDrawer
