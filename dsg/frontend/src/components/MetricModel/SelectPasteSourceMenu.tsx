import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useDebounce, useGetState } from 'ahooks'
import { Input, Tooltip } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import InfiniteScroll from 'react-infinite-scroll-component'
import {
    DragOutlined,
    FormDetailOutlined,
    BusinessFormOutlined,
    FormFieldsOutlined,
} from '@/icons'
import __ from './locale'
import styles from './styles.module.less'
// import { addFormType } from './const'
import { formatError, formsQuery, getFormsFieldsList } from '@/core'
import {
    MetaDataFormInfo,
    SourceFormInfo,
} from '@/core/apis/businessGrooming/index.d'
import Empty from '@/ui/Empty'
import { NewFormType } from '../Forms/const'
import dataEmpty from '../../assets/dataEmpty.svg'
import { SearchInput } from '@/ui'

interface SelectPasteSourceMenuType {
    onClick: () => void
    onStartDrag: (
        e: React.MouseEvent<HTMLDivElement, MouseEvent>,
        formInfo: any,
    ) => void
    existFormIds: Array<string>
    onSelectMetaData: (forms: Array<SourceFormInfo>) => void
    defaultMetaForms: Array<SourceFormInfo>
    mid: string
    onOpenViewTable: (fid, fields) => void
    hasSelectedFormId: Array<string>
}

const SelectPasteSourceMenu = ({
    onClick,
    onStartDrag,
    existFormIds,
    onSelectMetaData,
    defaultMetaForms,
    mid,
    onOpenViewTable,
    hasSelectedFormId,
}: SelectPasteSourceMenuType) => {
    const [keyword, setKeyword] = useState<string>('')
    const [businessForms, setBusinessForm] = useState<Array<any>>([])
    const [totalCount, setTotalCount] = useState<number>(0)
    const [hoverForm, setHoverForm] = useState<string>('')
    const timeoutIdRef = useRef<number | null>(null)

    useEffect(() => {
        getBusinessForms([])
    }, [])

    useEffect(() => {
        // 滚动条恢复到顶部
        setBusinessForm([])
        // 获取搜索结果
        if (keyword) {
            searchBusinessForms([])
        } else {
            getBusinessForms([])
        }
    }, [keyword])

    /**
     * 获取所有角色
     */
    const getBusinessForms = async (initRole) => {
        try {
            const { entries, total_count } = await formsQuery(mid, {
                offset: initRole.length ? businessForms.length / 50 + 1 : 1,
                limit: 2000,
                type: 2,
                complete: true,
            })
            setTotalCount(total_count)
            // 去除从数据源导入的未完善的业务表
            setBusinessForm([...initRole, ...entries])
        } catch (ex) {
            formatError(ex)
        }
    }
    /**
     * 搜索角色
     */
    const searchBusinessForms = async (initRole) => {
        try {
            const { entries, total_count } = await formsQuery(mid, {
                offset: initRole.length ? businessForms.length / 50 + 1 : 1,
                limit: 2000,
                type: 2,
                keyword,
                complete: true,
            })
            setTotalCount(total_count)
            setBusinessForm([...initRole, ...entries])
        } catch (ex) {
            formatError(ex)
        }
    }
    /**
     * 打查看表详情
     * @param recommendForm
     */
    const handleOpenTable = async (recommendForm) => {
        try {
            if (timeoutIdRef.current !== null) {
                clearTimeout(timeoutIdRef.current)
            }
            const { entries } = await getFormsFieldsList(recommendForm.id, {
                limit: 999,
            })
            onOpenViewTable(recommendForm.id, entries)
        } catch (ex) {
            formatError(ex)
        }
    }

    return (
        <div className={styles.selectMenu}>
            <div>
                <div className={styles.menuTitle}>{__('业务表列表')}</div>
            </div>
            {keyword === '' && !businessForms.length ? (
                <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
            ) : (
                <div className={styles.menueContent}>
                    <div className={styles.searchInput}>
                        <SearchInput
                            placeholder={__('搜索业务表名称')}
                            autoComplete="off"
                            onKeyChange={(kw: string) => {
                                setKeyword(kw)
                            }}
                        />
                    </div>

                    <div
                        style={{
                            height: `calc(100% - 100px)`,
                            overflow: 'auto',
                        }}
                        id="scrollableDiv"
                    >
                        <InfiniteScroll
                            hasMore={false}
                            endMessage={
                                businessForms.length === 0 ? <Empty /> : ''
                            }
                            loader=""
                            next={() => {
                                if (keyword) {
                                    searchBusinessForms(businessForms)
                                } else {
                                    getBusinessForms(businessForms)
                                }
                            }}
                            dataLength={businessForms.length}
                            scrollableTarget="scrollableDiv"
                        >
                            <div className={styles.listContent}>
                                {businessForms.map((value, index) => {
                                    return (
                                        <div
                                            key={index}
                                            className={classnames(
                                                styles.listItem,
                                                hasSelectedFormId.includes(
                                                    value.id,
                                                )
                                                    ? styles.listSelectedItemDisabled
                                                    : styles.listUnselectedItem,
                                            )}
                                            onMouseDown={(e) => {
                                                if (
                                                    !hasSelectedFormId.includes(
                                                        value.id,
                                                    )
                                                ) {
                                                    onStartDrag(e, value)
                                                }
                                            }}
                                            onMouseEnter={() =>
                                                setHoverForm(value.id)
                                            }
                                            onMouseLeave={() =>
                                                setHoverForm('')
                                            }
                                        >
                                            <div>
                                                <DragOutlined />
                                            </div>
                                            <div
                                                className={
                                                    styles.listItemContent
                                                }
                                            >
                                                <div className={styles.icon}>
                                                    <BusinessFormOutlined />
                                                </div>
                                                <div
                                                    className={
                                                        styles.rightContent
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.listName
                                                        }
                                                        title={value.name}
                                                    >
                                                        {value.name}
                                                    </div>

                                                    {hoverForm === value.id &&
                                                        !hasSelectedFormId.includes(
                                                            value.id,
                                                        ) && (
                                                            <div
                                                                className={
                                                                    styles.operate
                                                                }
                                                            >
                                                                <Tooltip
                                                                    placement="bottom"
                                                                    title={__(
                                                                        '业务表详情',
                                                                    )}
                                                                >
                                                                    <div
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation()
                                                                            handleOpenTable(
                                                                                value,
                                                                            )
                                                                        }}
                                                                        className={
                                                                            styles.detailBtn
                                                                        }
                                                                        onMouseDown={(
                                                                            e,
                                                                        ) =>
                                                                            e.stopPropagation()
                                                                        }
                                                                        onMouseLeave={(
                                                                            e,
                                                                        ) =>
                                                                            e.stopPropagation()
                                                                        }
                                                                    >
                                                                        <FormFieldsOutlined />
                                                                    </div>
                                                                </Tooltip>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </InfiniteScroll>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SelectPasteSourceMenu
