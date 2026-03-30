import { memo, useEffect, useMemo, useState } from 'react'
import { Dropdown, Spin } from 'antd'
import classnames from 'classnames'
import {
    CloseCircleFilled,
    RightOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import { getHistory, deleteHistory, formatError } from '@/core'
import { HistoryOutlined } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'
import { IHistoryItem, IHistoryDropdown } from './helper'

function HistoryDropdown({
    keyword,
    onClickHistory,
    onClickCogSearchQA,
    onClickCogSearchAll,
    children,
    showHistory,
    ...restProps
}: IHistoryDropdown) {
    const [historyItems, setHistoryItems] = useState<IHistoryItem[]>([])
    const [hoverItemId, setHoverItemId] = useState('')
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const { pathname } = useLocation()

    // 是否为认知搜索界面
    const isCogSearchPage = useMemo(
        () => pathname === `/cognitive-search`,
        [pathname],
    )

    useEffect(() => {
        getHistoryList(keyword)
    }, [keyword])

    // 获取历史记录
    const getHistoryList = async (kw) => {
        try {
            setLoading(true)
            const { res } = await getHistory(kw.trim())
            setHoverItemId('')
            setHistoryItems(res)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 下拉菜单渲染历史记录字样
    const dropdownRender = (menu) => {
        if (!open) {
            return ''
        }

        if (historyItems.length === 0 && isCogSearchPage) {
            return ''
        }

        if (historyItems.length === 0 && !isCogSearchPage && !keyword) {
            return ''
        }

        if (loading) {
            return (
                <div className={styles.dropdown_content}>
                    <Spin className={styles.spin} size="small" />
                </div>
            )
        }

        return (
            <div className={styles.dropdown_content}>
                {!isCogSearchPage && (
                    <div className={styles.top_wrap}>
                        {/* {llm && (
                            <div
                                className={classnames(
                                    styles.history_item,
                                    styles.cogQA_item,
                                )}
                                onClick={() => onClickCogSearchQA?.(keyword)}
                            >
                                <div className={styles.history_info}>
                                    <img src={qaColored} alt="" width="16px" />
                                    <span className={styles.history_keyword}>
                                        {__('获取认知助手回答')}
                                    </span>
                                </div>
                                <RightOutlined style={{ color: '#126ee3' }} />
                            </div>
                        )} */}
                        {keyword && (
                            <div
                                className={classnames(
                                    styles.history_item,
                                    styles.cogQA_item,
                                )}
                                onClick={() => onClickCogSearchAll?.(keyword)}
                            >
                                <div className={styles.history_info}>
                                    <SearchOutlined
                                        className={styles.history_icon}
                                    />
                                    <span className={styles.history_keyword}>
                                        {__('“${keyword}”所有搜索结果', {
                                            keyword,
                                        })}
                                        <span className={styles.enter}>
                                            {__('（按Enter键快速进入）')}
                                        </span>
                                    </span>
                                </div>
                                <RightOutlined />
                            </div>
                        )}
                    </div>
                )}
                {historyItems?.length !== 0 && (
                    <>
                        <div
                            className={styles.tips}
                            style={{ paddingTop: isCogSearchPage ? 4 : 0 }}
                        >
                            {__('历史记录')}
                        </div>
                        {menu}
                    </>
                )}
            </div>
        )
    }

    // 点击一条历史记录
    const handleClickItem = (item) => {
        setOpen(false)
        onClickHistory(item)
    }

    // 下拉菜单渲染历史记录
    const items = historyItems?.map((item: IHistoryItem) => {
        return {
            key: item?.qid,
            label: (
                <div
                    onFocus={() => {}}
                    onBlur={() => {}}
                    onMouseOver={() => setHoverItemId(item?.qid)}
                    onMouseOut={() => setHoverItemId('')}
                    className={styles.history_item}
                >
                    {keyword === '' ? (
                        <>
                            <div
                                className={styles.history_info}
                                onClick={() => handleClickItem(item)}
                            >
                                <HistoryOutlined
                                    className={styles.history_icon}
                                />
                                <span
                                    title={item?.qword}
                                    className={styles.history_keyword}
                                >
                                    {item?.qword}
                                </span>
                            </div>
                            <CloseCircleFilled
                                onClick={(e) => handleDelete(e, item)}
                                className={classnames(
                                    styles.delete,
                                    hoverItemId === item?.qid && styles.visible,
                                )}
                            />
                        </>
                    ) : (
                        <div
                            className={styles.history_info}
                            onClick={() => handleClickItem(item)}
                        >
                            <SearchOutlined className={styles.history_icon} />
                            <span
                                title={item?.qword}
                                className={styles.history_keyword}
                                dangerouslySetInnerHTML={{
                                    __html: item?.qhighlight || item?.qword,
                                }}
                            />
                        </div>
                    )}
                </div>
            ),
        }
    })

    // 删除一条历史记录
    const handleDelete = async (event, item) => {
        event.stopPropagation()
        try {
            await deleteHistory(item?.qid)
            setHistoryItems(historyItems.filter((i) => i?.qid !== item?.qid))
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        setOpen(showHistory)
    }, [showHistory])

    // 展开收起状态变更
    const handleOpenChange = (op) => {
        if (showHistory) {
            setOpen(true)
        } else {
            setOpen(op)
        }
    }

    return (
        <Dropdown
            trigger={['click']}
            menu={{ items }}
            open={open}
            dropdownRender={(menu) => dropdownRender(menu)}
            placement="bottomLeft"
            onOpenChange={handleOpenChange}
            {...restProps}
        >
            {children}
        </Dropdown>
    )
}

export default memo(HistoryDropdown)
