import {
    MinusSquareOutlined,
    CaretDownOutlined,
    FileSearchOutlined,
    MessageOutlined,
    LeftOutlined,
    CloseSquareOutlined,
} from '@ant-design/icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
    Input,
    Dropdown,
    message,
    Space,
    Spin,
    Skeleton,
    Tooltip,
    List,
} from 'antd'
import type { MenuProps } from 'antd'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import classnames from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import { Dnd } from '@antv/x6-plugin-dnd'
import { useGetState } from 'ahooks'
import styles from '@/components/SceneAnalysis/styles.module.less'
import aiGuide from '@/assets/guideImage/aiGuide.png'
import __ from '@/components/CognitiveSearch/locale'
import local from './locale'
import {
    FeedbackAction,
    getStatusMessage,
    QAStatus,
} from '@/components/CognitiveSearch/helper'
import {
    AppApiColored,
    AppDataContentColored,
    DatasheetViewColored,
    DisLikeColored,
    DisLikeOutlined,
    FontIcon,
    LikeColored,
    LikeOutlined,
    StopQAAnswerColored,
} from '@/icons'
import Tips from './Tips'
import { ParamsType, useCongSearchContext } from './AiSearchProvider'
import { AssetType } from '@/components/CognitiveSearch/const'
import { copyToClipboard } from '@/components/MyAssets/helper'
import { modifyParamsArr } from '@/components/SceneAnalysis/helper'
import ScrollList from './List/ScrollList'
import LogicViewItem from './LogicView/LogicViewItem'
import actionType from '@/redux/actionType'
import { IconType } from '@/icons/const'
import { ICiteItem } from './AiSearchProvider/helper'
import DataDetail from '@/components/SceneAnalysis/DataDetail'
import AiWrap from './AiWrap'

const { TextArea } = Input

const items: MenuProps['items'] = [
    {
        label: (
            <div className={styles.selectedList}>
                <div className={styles.menuTitle}>匹配数据服务超市</div>
                <div className={styles.titleTip}>
                    匹配数据服务超市全部上线的资源
                </div>
            </div>
        ),
        key: 1,
        title: '匹配数据服务超市',
    },
    {
        label: (
            <div className={styles.selectedList}>
                <div className={styles.menuTitle}>匹配可用资源</div>
                <div className={styles.titleTip}>
                    仅匹配可直接使用（有读取或下载权限）的资源
                </div>
            </div>
        ),
        key: 2,
        title: '匹配可用资源',
    },
]

const AiDialog = ({
    graphCase,
    onStartDrag,
    setAiOpen,
    aiOpen,
    isDialogClick,
    setIsDialogClick,
    style,
    isUseData = true,
    selectorId,
}: any) => {
    const [isLoading, setLoading] = useState(false)
    const selectedId = useRef<string>('')
    const [isMoreShow, setIsMoreShow] = useState(false)
    const [isFocus, setIsFocus] = useState(false)
    const [isDrag, setIsDrag, getIsDrag] = useGetState(false)
    const [isHasMore, setIsHasMore] = useState(false)
    const [showCiteList, setShowCiteList] = useState<any>([])
    const [keyword, setKeyword] = useState<string>('')
    const [selectedTitle, setSelectedTitle] =
        useState<string>('可长按拖动至画布')
    const [selectedItem, setSelectedItem] = useState<any>(items[0])
    const [selectedKeys, setSelectedKeys] = useState<Array<any>>(['1'])
    const dispatch = useDispatch()
    const payload = useSelector((state: any) => state?.dataProductReducer)
    const dataProductIds = payload.dataProductIds || []
    const scrollTop = 0
    const [current, setCurrent] = useState<any>()
    const [viewDetailOpen, setViewDetailOpen] = useState(false)
    const currentDndCase: any = useRef()
    const answerRef: any = useRef()
    const {
        loading,
        searchKey,
        searchInfo,
        conditions,
        updateParams,
        data,
        onLoadMore,
        isCongSearch,
        status,
        cites,
        answerText,
        table,
        stop,
        onStopAnswer,
        feedback,
        onFeedback,
        errorText,
    } = useCongSearchContext()
    const agentData = useSelector((state: any) => {
        return state?.AgentManagerReducer
    })

    useEffect(() => {
        const initialData = agentData?.config?.data_views || []
        let tempCites: any = []
        if (cites.length > 4) {
            setIsHasMore(true)
            tempCites = cites.slice(0, 4)
        } else {
            setIsHasMore(false)
            tempCites = [...cites]
        }
        tempCites = modifyParamsArr(tempCites, initialData, 'isAdd')
        setShowCiteList(tempCites)
    }, [cites, agentData?.config?.data_views?.length])

    // useEffect(() => {
    //     getIconPosition()
    // }, [])

    // useEffect(() => {
    //     window.addEventListener('resize', getIconPosition, false)
    //     return () => {
    //         window.removeEventListener('resize', getIconPosition, false)
    //     }
    // }, [])

    useEffect(() => {
        // 当回答结束后，监听点击回答结果中的“引用”
        if (status === QAStatus.Ending || stop) {
            if (cites.length > 0) {
                setTimeout(() => {
                    const answerNumber: any =
                        answerRef?.current?.querySelectorAll('#qa_answer i')

                    for (let j = 0; j < answerNumber?.length; j += 1) {
                        const index = Number(answerNumber[j]?.innerHTML)
                        const citesData: ICiteItem = cites[index - 1]
                        answerNumber[j].onclick = (e: any) => {
                            setTimeout(() => {
                                setSelectedCite(citesData)
                                setViewDetailOpen(true)
                            }, 0)
                        }
                    }
                }, 0)
            }
        }
    }, [status, stop])

    useEffect(() => {
        // 当回答结束后，监听点击回答结果中的“引用”
        if (status === QAStatus.Ending || stop) {
            if (cites.length > 0) {
                setTimeout(() => {
                    const answerNumber: any =
                        answerRef?.current?.querySelectorAll('#qa_answer i')

                    for (let j = 0; j < answerNumber?.length; j += 1) {
                        const index = Number(answerNumber[j]?.innerHTML)
                        const citesData: ICiteItem = cites[index - 1]
                        answerNumber[j].onclick = (e: any) => {
                            setTimeout(() => {
                                setSelectedCite(citesData)
                                setViewDetailOpen(true)
                            }, 0)
                        }
                    }
                }, 0)
            }
        }
    }, [status, stop])

    const dataSource = useMemo(() => {
        const tmp = data?.entries || undefined
        const initialData = agentData?.config?.data_views || []
        if (tmp) {
            return modifyParamsArr(tmp, initialData, 'isAdd')
        }
        return tmp
    }, [data, agentData?.config?.data_views?.length])
    const [selectedCite, setSelectedCite, getSelectedCite] = useGetState<
        ICiteItem | undefined
    >(undefined)

    // const getIconPosition = () => {
    //     if (!style) {
    //         const iconDom = document.getElementById(selectorId) as HTMLElement
    //         const dialogDom = document.getElementById('aiDialog') as HTMLElement
    //         dialogDom.style.left = `${
    //             iconDom?.getBoundingClientRect()?.left || 0
    //         }px`
    //     }
    // }

    const onClick: MenuProps['onClick'] = ({ key }) => {
        const tempKey = `${key}`
        setSelectedKeys([key])
        const temp = items.find((item: any) => `${item?.key}` === tempKey)
        setSelectedItem(temp)
    }

    // 输入框内容变化
    const handleSearchChange = (e) => {
        const kw = e.target?.value
        setKeyword(kw)
    }
    const handleSearch = () => {
        if (!keyword) return
        setLoading(true)
        updateParams(ParamsType.KeyWord, keyword, selectedItem.key)
        const dialogDom = document.getElementById('aiDialog') as HTMLElement
        currentDndCase.current = new Dnd({
            target: graphCase,
            scaled: false,
            dndContainer: dialogDom || undefined,
            getDragNode: (node) => node.clone({ keepId: true }),
            getDropNode: (node) => node.clone({ keepId: true }),
        })
        // setCommonWord(stopWord)
        // if (!key) {
        //     // 没有关键字则清空分词
        //     setIsFocus(true)
        //     setTags(undefined)
        // }
    }
    const findAnswer = () => {
        if (isLoading) return
        setLoading(true)
    }

    // 显示停止生成
    const getStopIcon = () => {
        // 已停止，则不再显示“停止生成”
        if (stop) {
            return ''
        }
        // 回答状态是“加载中”、“正在匹配相关资源”、“正在调取资源”、“回答中”显示停止生成
        if (
            status === QAStatus.Loading ||
            status === QAStatus.Search ||
            status === QAStatus.Invoke ||
            status === QAStatus.Answer
        ) {
            return (
                <div className={styles.stopAnswer} onClick={onStopAnswer}>
                    <StopQAAnswerColored className={styles.icon} />
                    <span className={styles.stopText}>{local('停止生成')}</span>
                </div>
            )
        }
        return ''
    }

    // 显示回答提示 回答/总结中
    const getAnswerTips = () => {
        // 回答结束或则和停止回答，显示回答：
        return status === QAStatus.Ending || stop ? (
            <Tips
                icon={<MessageOutlined className={styles.qa_icon} />}
                message={__('回答：')}
            />
        ) : (
            <Tips icon={<Spin size="small" />} message={__('总结中')} />
        )
    }

    // 显示回答内容
    const getAnswerContents = () => {
        // 停止回答且回答内容为空时候，显示已停止生成
        if (stop && answerText === '') {
            // return <div>{__('已停止生成回答')}</div>
            return ''
        }

        return (
            <div
                id="qa_answer"
                className={styles.qa_answer}
                dangerouslySetInnerHTML={{
                    __html: answerText,
                }}
                // aria-hidden
            />
        )
    }

    // 显示表格
    const getTable = () => {
        return (
            <div className={styles.qa_markdown}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {table}
                </ReactMarkdown>
            </div>
        )
    }

    // 显示加载骨架屏
    const getLoading = () => {
        // 回答状态是“加载中”、“正在匹配相关资源” status loading search ending
        if (status === QAStatus.Loading || status === QAStatus.Search) {
            // 已停止生成，显示已停止
            if (stop) {
                // return <div>{__('已停止生成回答')}</div>
                return ''
            }
            // 正常加载，显示骨架屏
            return (
                <div className={styles.skeleton}>
                    <div className={styles.skeletonHeader}>
                        <div className={styles.tips}>
                            <Tips
                                icon={<Spin size="small" />}
                                message={getStatusMessage(QAStatus.Search)}
                            />
                        </div>
                        {getStopIcon()}
                    </div>
                    <Skeleton
                        active
                        title={false}
                        paragraph={{ rows: 3, width: '100%' }}
                        loading
                    />
                </div>
            )
        }
        return ''
    }

    // 显示反馈
    const getFeedback = () => {
        if (status === QAStatus.Ending || (stop && answerText !== '')) {
            return (
                <div className={styles.feedback}>
                    <span className={styles.copyFeedback}>
                        <Tooltip title={local('复制')}>
                            <FontIcon
                                name="icon-fuzhi"
                                className={styles.fuzhiIcon}
                                onClick={() => {
                                    copyToClipboard(answerText)
                                    message.success(local('复制成功'))
                                }}
                            />
                        </Tooltip>
                        {feedback?.like === FeedbackAction.Like ? (
                            <LikeColored
                                onClick={() =>
                                    onFeedback({
                                        action: FeedbackAction.CancelLike,
                                    })
                                }
                                className={classnames(
                                    styles.icon,
                                    styles.colored,
                                )}
                            />
                        ) : (
                            <Tooltip title={__('点赞')}>
                                <LikeOutlined
                                    onClick={() =>
                                        onFeedback({
                                            action: FeedbackAction.Like,
                                        })
                                    }
                                    className={styles.icon}
                                />
                            </Tooltip>
                        )}
                        {feedback?.dislike === FeedbackAction.Dislike ? (
                            <DisLikeColored
                                onClick={() =>
                                    onFeedback({
                                        action: FeedbackAction.CancelDislike,
                                    })
                                }
                                className={classnames(
                                    styles.icon,
                                    styles.colored,
                                )}
                            />
                        ) : (
                            <Tooltip title={__('不准确')}>
                                <DisLikeOutlined
                                    onClick={() =>
                                        onFeedback({
                                            action: FeedbackAction.Dislike,
                                        })
                                    }
                                    className={styles.icon}
                                />
                            </Tooltip>
                        )}
                    </span>
                    {dataSource?.length > 0 && (
                        <div
                            className={styles.moreText}
                            onClick={() => setIsMoreShow(true)}
                        >
                            {local('全部搜索结果>>')}
                        </div>
                    )}
                </div>
            )
        }
        return ''
    }

    /**
     * 数据目录项
     */
    const itemRender = (item) => {
        const { type } = item

        return (
            <List.Item
                key={item.id}
                className={classnames(
                    styles['list-item'],
                    current?.id === item.id && styles['is-selected'],
                )}
            >
                <LogicViewItem
                    key={item.id}
                    item={item}
                    onCloseDetail={() => {}}
                    isCongSearch={isCongSearch}
                    isSelected={current?.id === item.id}
                    isUseData={isUseData}
                    currentDndCase={currentDndCase}
                    onStartDrag={onStartDrag}
                    setViewDetailOpen={setViewDetailOpen}
                    setSelectedCite={setSelectedCite}
                />
            </List.Item>
        )
    }

    const mouseHover = (e: any, item: any) => {
        selectedId.current = item.id
    }

    const mouseOut = (e: any, item: any) => {
        selectedId.current = ''
    }
    // eslint-disable-next-line
    const addRedux = (item: any) => {
        if (item.isAdd || item.available_status === '0') return false
        const { id, title = '', technical_name = '', code = '' } = item
        const currItem = {
            id,
            view_name: `${title}（${technical_name}）`,
            view_desc: code,
            view_status: '1',
        }
        const checkItems = agentData?.config?.data_views || []
        const tmp = [...checkItems, currItem]
        const dataViewsNew = tmp.reduce((acc, currentItem: any) => {
            const exists = acc.some((i: any) => i.id === currentItem.id)
            if (!exists) {
                // @ts-ignore
                acc.push(currentItem)
            }
            return acc
        }, [])
        dispatch({
            type: actionType.AGENT_MANAGE_DATA,
            payload: {
                ...agentData,
                config: { ...agentData.config, data_views: dataViewsNew },
                isUpdate: true,
            },
        })
        setTimeout(() => {
            message.info('添加成功')
        }, 1000)
    }

    const clickMore = () => {
        setIsHasMore(false)
        setShowCiteList(cites)
    }

    const getTemplateContent = (item: any, index: number) => {
        return (
            <div
                title={item?.title}
                className={classnames(
                    styles.cite_item,
                    item.available_status === '0' && styles.cite_permission,
                )}
                onClick={() => {
                    setIsDrag(false)
                    setSelectedCite(item)
                    setViewDetailOpen(true)
                }}
                onMouseDown={(e) => {
                    setIsDrag(true)
                    // 300ms 过后认为时长按
                    setTimeout(() => {
                        if (!getIsDrag()) return
                        setIsDrag(true)
                        if (isUseData || item.available_status === '0') return
                        onStartDrag(e, item, currentDndCase.current)
                    }, 300)
                }}
                onMouseEnter={(e) => {
                    mouseHover(e, item)
                }}
                onMouseLeave={(e) => mouseOut(e, item)}
            >
                <div className={styles.sourceItem}>
                    <em title={item?.title}>{index + 1}</em>
                    {item?.type === AssetType.DATACATLG ? (
                        <AppDataContentColored className={styles.qa_icon} />
                    ) : item?.type === AssetType.LOGICVIEW ? (
                        <DatasheetViewColored className={styles.qa_icon} />
                    ) : item?.type === AssetType.INTERFACESVC ? (
                        <AppApiColored className={styles.qa_icon} />
                    ) : undefined}
                    <div className={styles.cite_name}>
                        <span
                            className={
                                !isUseData
                                    ? styles.t_title
                                    : styles.t_title_userData
                            }
                            title={item?.title}
                        >
                            {item?.title}
                        </span>
                    </div>
                </div>
                {isUseData && (
                    <span
                        onClick={() => addRedux(item)}
                        className={classnames(styles.addText)}
                    >
                        {item.available_status === '0'
                            ? ''
                            : item.isAdd
                            ? '已添加'
                            : '添加'}
                    </span>
                )}
                {item.available_status === '0' && (
                    <Tooltip
                        title={local(
                            '读取权限不足，无法直接使用，可联系数据Owner进行授权',
                        )}
                        placement="bottomLeft"
                    >
                        <i className={styles.sceneLock}>
                            <FontIcon
                                name="icon-suoding1"
                                type={IconType.COLOREDICON}
                                className={styles.icon}
                            />
                        </i>
                    </Tooltip>
                )}
            </div>
        )
    }

    const getTemplate = () => {
        return (
            <div className={styles.citeContainer}>
                <div
                    className={classnames(
                        styles.citeCard,
                        isHasMore && styles.moreCard,
                    )}
                >
                    {showCiteList.map((item: any, index: number) => {
                        return isUseData ? (
                            getTemplateContent(item, index)
                        ) : (
                            <Tooltip
                                title={
                                    item?.available_status === '0'
                                        ? ''
                                        : local('可长按拖动至画布')
                                }
                                placement="bottomLeft"
                            >
                                {getTemplateContent(item, index)}
                            </Tooltip>
                        )
                    })}
                </div>
                {isHasMore && (
                    <div className={styles.moreBtn} onClick={() => clickMore()}>
                        更多({cites.length - 4})
                    </div>
                )}
            </div>
        )
    }

    const clickMinus = () => {
        setIsDialogClick(false)
    }
    const clickClose = () => {
        setAiOpen(false)
    }

    return (
        <>
            <AiWrap
                style={style}
                selectorId={selectorId}
                isDialogClick={isDialogClick}
            >
                {isDialogClick && (
                    <div
                        className={classnames(
                            styles.aiDialog,
                            !isDialogClick && styles.aiClose,
                            isDialogClick && styles.aiShow,
                        )}
                        id="aiDialog"
                    >
                        <div className={styles.aiHeader}>
                            <span>
                                <img
                                    src={aiGuide}
                                    alt=""
                                    draggable={false}
                                    className={styles.aiImg}
                                />
                                <span className={styles.title}>
                                    {local('AI找数')}
                                </span>
                            </span>
                            <span className="aiDialogWrap-drag-unabled">
                                {isUseData ? (
                                    <CloseSquareOutlined
                                        className={styles.aiIcon}
                                        onClick={() => clickClose()}
                                    />
                                ) : (
                                    <MinusSquareOutlined
                                        className={styles.aiIcon}
                                        onClick={() => clickMinus()}
                                    />
                                )}
                            </span>
                        </div>
                        <div
                            className={classnames(
                                styles.aiBody,
                                !isMoreShow && styles.show,
                                isMoreShow && styles.hide,
                                'aiDialogWrap-drag-unabled',
                            )}
                            id="aiDialogId"
                        >
                            <div
                                className={classnames(
                                    styles.aiProblem,
                                    isFocus && styles.focusText,
                                )}
                                ref={answerRef}
                            >
                                <TextArea
                                    showCount
                                    maxLength={500}
                                    value={keyword}
                                    onChange={handleSearchChange}
                                    onPressEnter={(e) => {
                                        e.preventDefault()
                                        setIsFocus(false)
                                        const dialogDom =
                                            document.getElementById(
                                                'aiDialog',
                                            ) as HTMLElement
                                        dialogDom?.focus()
                                        handleSearch()
                                    }}
                                    onFocus={() => setIsFocus(true)}
                                    onBlur={() => setIsFocus(false)}
                                    placeholder={local(
                                        '请输入数据关键字或分析意图',
                                    )}
                                    className={styles.aiTextArea}
                                    style={{ height: 80, resize: 'none' }}
                                />
                                <div className={styles.searchFooter}>
                                    <Dropdown
                                        trigger={['click']}
                                        menu={{ items, onClick, selectedKeys }}
                                        className={styles.aiDropdown}
                                        getPopupContainer={() =>
                                            document.getElementById(
                                                'aiDialogId',
                                            ) || document.body
                                        }
                                    >
                                        <Space className={styles.caretArrow}>
                                            {selectedItem.title}
                                            <CaretDownOutlined />
                                        </Space>
                                    </Dropdown>
                                    <FontIcon
                                        name="icon-fasong"
                                        className={classnames(
                                            styles.sendIcon,
                                            !keyword.length &&
                                                styles.sendIsDisabled,
                                        )}
                                        onClick={handleSearch}
                                    />
                                </div>
                            </div>
                            {isLoading && (
                                <div>
                                    <div
                                        className={classnames(
                                            styles.aiAnswer,
                                            stop && styles.hide,
                                        )}
                                        ref={answerRef}
                                    >
                                        {(status === QAStatus.Loading ||
                                            status === QAStatus.Search) &&
                                            getLoading()}
                                        {status === QAStatus.Ending && (
                                            <div>
                                                {getLoading()}
                                                {status === QAStatus.Answer ||
                                                status === QAStatus.Invoke ||
                                                status === QAStatus.Ending ? (
                                                    <div
                                                        className={
                                                            styles.qaTitle
                                                        }
                                                    >
                                                        {cites?.length > 0 && (
                                                            <div>
                                                                <Tips
                                                                    icon={
                                                                        <FileSearchOutlined
                                                                            className={
                                                                                styles.qa_icon
                                                                            }
                                                                        />
                                                                    }
                                                                    message={__(
                                                                        '来源：',
                                                                    )}
                                                                />
                                                                <div
                                                                    className={
                                                                        styles.cite_wrapper
                                                                    }
                                                                >
                                                                    {getTemplate()}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {getAnswerTips()}
                                                        {getAnswerContents()}
                                                    </div>
                                                ) : null}
                                            </div>
                                        )}
                                        {status === QAStatus.Error ? (
                                            <div>
                                                {errorText ? (
                                                    <span>{errorText}</span>
                                                ) : (
                                                    <span>
                                                        {local(
                                                            '抱歉，AI搜索在您有权限的数据中并没有找到此问题的答案，可尝试更改搜索关键词后重新发起搜索。',
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        ) : null}
                                        {getFeedback()}
                                    </div>
                                    {status !== QAStatus.Loading && (
                                        <div className={styles.tipInfo}>
                                            {local(
                                                '回答的内容由 AI 生成，不能保证完全真实准确，请仔细甄别',
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {isMoreShow && (
                            <div
                                className={classnames(
                                    styles.moreList,
                                    'aiDialogWrap-drag-unabled',
                                )}
                            >
                                <div className={styles.moreHeader}>
                                    <span
                                        className={styles.back}
                                        onClick={() => setIsMoreShow(false)}
                                    >
                                        <LeftOutlined />
                                        {local('返回')}
                                    </span>
                                    {!isUseData && (
                                        <span className={styles.text}>
                                            {local(
                                                '长按拖动库表可将其添加至画布',
                                            )}
                                        </span>
                                    )}
                                </div>
                                <div className={styles.moreInfoList}>
                                    <ScrollList
                                        isSearch={searchKey}
                                        loading={loading}
                                        scrollTop={scrollTop}
                                        itemRender={itemRender}
                                        hasMore={
                                            dataSource !== undefined &&
                                            dataSource?.length <
                                                data?.total_count
                                        }
                                        data={dataSource}
                                        onLoad={() => {
                                            onLoadMore()
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </AiWrap>
            {viewDetailOpen && (
                <DataDetail
                    viewDetailOpen={viewDetailOpen}
                    setViewDetailOpen={setViewDetailOpen}
                    selectedResc={selectedCite}
                    isIntroduced
                />
            )}
        </>
    )
}

export default AiDialog
