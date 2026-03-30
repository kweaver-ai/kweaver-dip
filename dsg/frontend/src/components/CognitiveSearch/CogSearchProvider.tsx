import {
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { EventSourcePolyfill } from 'event-source-polyfill'
import Cookies from 'js-cookie'
import { useLocation } from 'react-router-dom'
import { useGetState } from 'ahooks'
import {
    formatError,
    reqSearchResc,
    reqSearchCatlg,
    ICiteItem,
    IQaDetails,
    IChatDetails,
    getChatSessionId,
    putChatLike,
    messageSuccess,
    getCatlgScoreSummary,
    ICatlgScoreSummaryItem,
    HasAccess,
} from '@/core'
import { AssetType, IFilterItem, InitData, KEYTYPE } from './const'
import { cancelRequest, getActualUrl, refreshOauth2Token } from '@/utils'
import { QAStatus, FeedbackAction } from './helper'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import __ from './locale'
import { useTestLLM } from '@/hooks/useTestLLM'
import { dataAssetsIndicatorPath } from '@/components/DataAssetsIndicator/const'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { checkAuditPolicyPermis } from '../DataAssetsCatlg/helper'

type ICongSearchContext = {
    updateParams: (type: ParamsType, value: any) => void
    participle?: any[]
    data?: any
    loading?: boolean
    onLoadMore: () => void
    [key: string]: any
}

const CongSearchContext = createContext<ICongSearchContext>({
    updateParams: () => {},
    participle: [],
    data: {},
    loading: false,
    onLoadMore: () => {},
})

export const useCongSearchContext = () =>
    useContext<ICongSearchContext>(CongSearchContext)

export enum LoadType {
    Init,
    More,
}

export enum ParamsType {
    KeyWord, // 搜索关键字
    StopKey, // 左侧过滤条件
    Filter, // 右侧顶部筛选项
    Tab, // 选项卡
    Query, // 多轮问答语句
}

const getFunc = (type: string) => {
    switch (type) {
        // case AssetType.DATACATLG:
        //     return reqSearchCatlg
        case AssetType.INTERFACESVC:
        case AssetType.LOGICVIEW:
        default:
            return reqSearchResc
    }
}

export const CongSearchProvider = ({ children }: { children: ReactNode }) => {
    // 搜索关键词
    const [searchInfo, setSearchInfo] = useState<{ keyword: string }>({
        keyword: '',
    })
    const { pathname } = useLocation()
    // 左侧筛选过滤
    const [stopInfo, setStopInfo] =
        useState<Record<KEYTYPE, IFilterItem[]>>(InitData)
    // 右侧顶栏过滤参数
    const [filters, setFilters] = useState<Record<string, any>>({})
    // Tab选项
    const [assetType, setAssetType] = useState<string>()
    // 智能搜索停用词
    const [stopKeys, setStopKeys] = useState<any>({})
    // 是否为认知搜索
    const [isCongSearch, setIsCongSearch] = useState<boolean>(false)
    // 是否重新触发QA搜索
    const [isQASearch, setIsQASearch, getIsQASearch] =
        useGetState<boolean>(true)
    // 列表数据
    const [data, setData] = useState<any>()
    // 加载状态
    const [loading, setLoading] = useState<boolean>(false)
    // 分页参数
    const nextFlag = useRef<any>()
    // 是否重新搜索
    const isReSearch = useRef<boolean>(false)
    // 是否选项切换
    const isSwitchTab = useRef<boolean>(false)
    // 分词结果
    const [participle, setParticiple] = useState<any[]>()

    const [conditions, setConditions] = useState<any>()
    // 停用词 搜索-对象公用
    const [commomWord, setCommonWord] = useState<string[]>([])

    const lastSearchKey = useRef<string>('')

    const matchKeys = useMemo(() => {
        const keys = stopInfo?.[KEYTYPE.OBJ]?.map((o) => o.name)
        return keys?.filter((o) => !commomWord?.includes(o))
    }, [stopInfo?.[KEYTYPE.OBJ], commomWord])

    const ws: any = useRef(null)

    const [status, setStatus] = useState(QAStatus.Block)
    // 引用
    const [cites, setCites] = useState<ICiteItem[]>([])
    // 回答
    const [answerText, setAnswerText] = useState<string[]>([])
    // 表格
    const [table, setTable] = useState<string[]>([])
    // 答案id
    const [answerId, setAnswerId] = useState('')
    // 是否停止生成
    const [stop, setStop] = useState(false)
    // 多轮问答获取详情 load
    const [chatDetailsLoading, setChatDetailsLoading] = useState(false)
    // 当前显示的多轮问答详情
    const [chat, setChat] = useState<IChatDetails>()
    // 当前显示的多轮问答中 qa 列表
    const [qaList, setQaList] = useState<IQaDetails[]>([])
    // 多轮问答的问答语句
    const [chatQuery, setChatQuery] = useState<string>('')
    // 反馈弹窗
    const [feedback, setFeedback] = useState<any>()

    const [{ using }, updateUsing] = useGeneralConfig()
    const [llm, getLLMData] = useTestLLM()
    const [userRoles, setUserRoles] = useState<any[]>([])
    const { checkPermissions } = useUserPermCtx()
    // 是否拥有数据运营、开发工程师
    const hasDataOperRole = useMemo(
        () => checkPermissions(HasAccess.isGovernOrOperation) ?? false,
        [checkPermissions],
    )

    useEffect(() => {
        // getLlmData()
        getConfig()
    }, [])

    const bigHeader = useMemo(
        () => pathname === `/cognitive-search` && using === 2,
        [pathname, using],
    )

    const getConfig = async () => {
        try {
            // const res = await getConfig()
            // const res = false
            const res = localStorage.getItem('asset_type') === 'data_catalog'
            if (!res) {
                localStorage.setItem('asset_type', 'resc')
            }
        } catch (e) {
            formatError(e)
        }
    }

    // 整合查询条件
    useEffect(() => {
        const cond = {
            size: 20,
            keyword: searchInfo?.keyword || '',
            stop_entity_infos: stopKeys?.[KEYTYPE.DIM],
            asset_type: assetType,
            ...(filters || {}),
        }
        setConditions(cond)
    }, [stopKeys, assetType, filters, searchInfo])

    useEffect(() => {
        if (using === -1) return
        const requestParams = { ...conditions, loadType: LoadType.Init }
        getData(requestParams)
    }, [conditions, using])

    // 重置数据
    const handleReset = useCallback(() => {
        setStopKeys(InitData)
        setData(undefined)
        nextFlag.current = undefined
        setFilters({})
    }, [])

    // 更新搜索条件参数
    const updateParams = useCallback(
        (type: ParamsType, param: any) => {
            isSwitchTab.current = false
            switch (type) {
                case ParamsType.KeyWord:
                    setIsCongSearch(!!param)
                    // 比对与上次查询关键字(逻辑上 同关键字 分词结果一致)
                    isReSearch.current = param !== lastSearchKey.current
                    if (isReSearch.current) {
                        handleReset()
                    }
                    setSearchInfo({
                        keyword: param,
                    })
                    // 点击“搜索”按钮就清空过滤条件并收起filter
                    setFilters({})
                    setIsQASearch(true)
                    lastSearchKey.current = param
                    break
                case ParamsType.Filter:
                    isReSearch.current = false
                    nextFlag.current = undefined
                    setFilters(param)
                    setIsQASearch(false)
                    break
                case ParamsType.StopKey:
                    isReSearch.current = false
                    nextFlag.current = undefined
                    setStopKeys(param)
                    setIsQASearch(true)
                    break
                case ParamsType.Tab:
                    isReSearch.current = true
                    isSwitchTab.current = true
                    // 右侧筛选重置
                    setFilters({})
                    handleReset()
                    setIsQASearch(true)
                    // 问答清理
                    resetChatData()
                    setAssetType(param)
                    break
                case ParamsType.Query:
                    resetQAStatus()
                    setChatQuery(param)
                    break
                default:
                    break
            }
        },
        [searchInfo],
    )

    // 多轮问答相关条件
    useEffect(() => {
        if (chatQuery) {
            getChatAnswer()
        }
    }, [chatQuery])

    // 加载页面数据
    const getData = async (requestParams: any) => {
        const { loadType, ...params } = requestParams
        params.stopwords = Array.from(new Set([...(commomWord || [])]))
        if (params.asset_type === undefined || !params.keyword) return
        try {
            // 初次加载
            // if (!nextFlag.current) {
            setLoading(true)
            // }

            if (isReSearch.current || isSwitchTab.current) {
                setStopInfo({
                    [KEYTYPE.OBJ]: [],
                    [KEYTYPE.DIM]: [],
                })
            }

            cancelRequest(
                '/api/data-catalog/frontend/v1/data-catalog/search/cog',
                'post',
            )
            // 是否存在关键字查询
            // const reqSearchFunc = isCongSearch
            //     ? reqCognitiveSearch
            //     : getFunc(params.asset_type)
            const reqSearchFunc =
                using === 1 ? reqSearchCatlg : getFunc(params.asset_type)

            if (isCongSearch && getIsQASearch()) {
                resetChatData()
                setTimeout(() => {
                    setChatQuery(searchInfo.keyword)
                }, 0)
            }

            let res = await reqSearchFunc({
                ...params,
                available_option: 1,
            })
            let scoreList: ICatlgScoreSummaryItem[] = []
            if (using === 1) {
                scoreList =
                    (await getCatlgScoreSummary(
                        res.entries?.map((item) => item.id) || [],
                    )) || []
                res = {
                    ...res,
                    entries: res.entries?.map((item) => ({
                        ...item,
                        score: scoreList.find(
                            (s) => s.catalog_id === item.id,
                        ) || {
                            catalog_id: item.id,
                            average_score: 0,
                            total_count: 0,
                        },
                    })),
                }
            }

            nextFlag.current = res?.next_flag

            // 检查审核策略-设置列表项
            // item.hasAuditPolicy为true：资源设置了启用策略，可申请权限申请
            const newListDataTemp = await checkAuditPolicyPermis(
                res?.entries || [],
            )
            if (loadType === LoadType.More) {
                const list = data?.entries
                    ? [...data.entries, ...(newListDataTemp || [])]
                    : res?.entries
                // 加载更多
                setData({
                    ...res,
                    entries: list,
                })
            } else {
                // 初始化
                setData(res)
            }
            // 重新搜索
            if (isReSearch.current) {
                setParticiple(res?.query_cuts)
                // 重置停用词
                setCommonWord([])
            }

            if (isReSearch.current || isSwitchTab.current) {
                const { entities, objects } = res?.filter ?? {}
                setStopInfo({
                    [KEYTYPE.OBJ]: objects ?? [],
                    [KEYTYPE.DIM]: entities ?? [],
                })
            }
            setLoading(false)
        } catch (err) {
            if (err?.data?.code === 'ERR_CANCELED') {
                return
            }
            formatError(err)
            setLoading(false)
        }
    }

    // 加载更多
    const onLoadMore = () => {
        setIsQASearch(false)
        const requestParams = {
            ...conditions,
            next_flag: nextFlag.current,
            loadType: LoadType.More,
        }
        getData(requestParams)
    }

    const searchKey = useMemo(() => searchInfo.keyword, [searchInfo])

    // 重新获取回答前，还原QA问答相关状态
    const resetQAStatus = () => {
        setStatus(QAStatus.Block)
        setAnswerText([])
        setTable([])
        setCites([])
        setAnswerId('')
        setStop(false)
    }

    /**
     * qa问答
     * @param asset_type asset_type 数据资产类型 数据资源 all，data_view，interface_svc；数据目录all, data_catalog
     * @param data_version 数据版本，数据资源还是数据目录data-resource, data-catalog
     */
    const getQAAnswer = (asset_type, data_version) => {
        if (ws?.current) {
            cancelRequest('/api/af-sailor-service/v1/assistant/qa', 'get')
            ws.current.close()
        }
        if (ws) {
            const query = encodeURIComponent(searchKey)
            const qaAssetType = using === 1 ? 'all' : assetType
            const dataVersion = using === 1 ? 'data-catalog' : 'data-resource'
            ws.current = new EventSourcePolyfill(
                `/api/af-sailor-service/v1/assistant/qa?query=${query}&asset_type=${qaAssetType}&data_version=${dataVersion}`,
                {
                    headers: {
                        Authorization: `Bearer ${Cookies.get(
                            'af.oauth2_token',
                        )}`,
                        'Content-Type': 'text/event-stream',
                    },
                    heartbeatTimeout: 60000,
                },
            )

            ws.current.onopen = () => {
                setStatus(QAStatus.Loading)
            }

            ws.current.onmessage = (e: any) => {
                const { result } = JSON.parse(e?.data)
                setStatus(result?.status)
                if (result?.status === QAStatus.Answer) {
                    if (result?.res?.cites) {
                        setCites(result?.res?.cites)
                    }

                    if (result?.res?.text) {
                        setAnswerText(result?.res?.text)
                    }

                    if (result?.res?.table) {
                        setTable(result?.res?.table)
                    }
                }

                if (result?.answer_id) {
                    setAnswerId(result?.answer_id)
                }

                if (result?.status === QAStatus.Ending) {
                    ws.current.close()
                }
            }

            ws.current.onerror = () => {
                ws.current.close()
                setStatus(QAStatus.Error)
            }
        }
    }

    // 重置多轮问答数据
    const resetChatData = useCallback(() => {
        resetQAStatus()
        setChat(undefined)
        setChatQuery('')
        setQaList([])
        cancelRequest(
            '/api/af-sailor-service/v1/assistant/chat/session_id',
            'get',
        )
        if (ws?.current) {
            ws.current.close()
        }
    }, [])

    // 获取多轮问答 sessionId
    const getSessionIdData = async (): Promise<any> => {
        try {
            const { res } = await getChatSessionId()
            if (res?.session_id) {
                setChat({ session_id: res.session_id })
                return Promise.resolve(res.session_id)
            }
            return Promise.resolve('')
        } catch (error) {
            formatError(error)
            resetChatData()
            return Promise.resolve('')
        }
    }

    /**
     * 多轮问答
     * @param asset_type asset_type 数据资产类型 数据资源 all，data_view，interface_svc；数据目录all, data_catalog
     * @param data_version 数据版本，数据资源还是数据目录data-resource, data-catalog
     */
    const getChatAnswer = async () => {
        if (!llm) {
            // const exist = await getLLMData()
            // if (!exist) {
            setQaList([
                ...qaList.filter((item) => item?.qa_id),
                {
                    query: chatQuery,
                    answer: {},
                    like: 'neutrality',
                    qa_status: QAStatus.Error,
                    resource: [],
                    error_tip: __('认知助手服务不可用，无法生成回答'),
                },
            ])
            return
            // }
        }

        if (ws?.current) {
            ws.current.close()
        }
        if (ws) {
            setQaList([
                ...qaList.filter((item) => item?.qa_id),
                {
                    query: chatQuery,
                    answer: {},
                    like: 'neutrality',
                    qa_status: QAStatus.Loading,
                    resource: [],
                },
            ])
            setStatus(QAStatus.Loading)
            let session_id = chat?.session_id
            if (!session_id) {
                session_id = await getSessionIdData()
            }
            if (!session_id) return

            const query = encodeURIComponent(chatQuery)
            const qaAssetType = using === 1 ? 'all' : assetType
            const dataVersion = using === 1 ? 'data-catalog' : 'data-resource'
            ws.current = new EventSourcePolyfill(
                `/api/af-sailor-service/v1/assistant/chat?session_id=${session_id}&query=${query}&asset_type=${qaAssetType}&data_version=${dataVersion}&chat_type=data_market_qa`,
                {
                    headers: {
                        Authorization: `Bearer ${Cookies.get(
                            'af.oauth2_token',
                        )}`,
                        'Content-Type': 'text/event-stream',
                    },
                    heartbeatTimeout: 60000 * 5,
                },
            )

            const tempChat: IQaDetails = {
                answer: {},
                query: chatQuery,
                like: 'neutrality',
                resource: [],
            }

            ws.current.onopen = () => {
                setStatus(QAStatus.Loading)
                tempChat.qa_status = QAStatus.Loading
            }

            ws.current.onmessage = (e: any) => {
                const { result } = JSON.parse(e?.data)
                setStatus(result?.status)
                tempChat.qa_status = result?.status
                if (result?.status === QAStatus.Answer) {
                    if (result?.res?.cites) {
                        tempChat.answer!.cites = result.res.cites
                    }

                    if (result?.res?.text) {
                        tempChat.answer!.text = result.res.text
                    }

                    if (result?.res?.table) {
                        tempChat.answer!.table = result.res.table
                    }

                    if (result?.res?.explain) {
                        tempChat.answer!.explain = result.res.explain
                    }

                    if (result?.res?.chart) {
                        tempChat.answer!.chart = result.res.chart
                    }

                    if (result?.logs) {
                        tempChat.logs = result.logs
                    }
                }

                if (result?.qa_id) {
                    setAnswerId(result?.qa_id)
                    tempChat.qa_id = result.qa_id
                }

                if (result?.status === QAStatus.Ending) {
                    ws.current.close()
                    setChatQuery('')
                }
                setQaList([
                    ...qaList.filter(
                        (item) =>
                            item?.qa_id && item?.qa_id !== tempChat?.qa_id,
                    ),
                    tempChat,
                ])
            }

            const refresh = async () => {
                try {
                    await refreshOauth2Token()
                    const token = Cookies.get('af.oauth2_token') || ''
                    if (token) {
                        getChatAnswer()
                    }
                } catch (e) {
                    window.location.href = getActualUrl('/')
                }
            }

            ws.current.onerror = (err) => {
                ws.current.close()
                if (err?.status === 401) {
                    refresh()
                    return
                }
                setChatQuery('')
                if (!err?.error) {
                    setStatus(QAStatus.Ending)
                    tempChat.qa_status = QAStatus.Ending
                } else {
                    setStatus(QAStatus.Error)
                    tempChat.qa_status = QAStatus.Error
                }
                setQaList([
                    ...qaList.filter(
                        (item) =>
                            item?.qa_id && item?.qa_id !== tempChat?.qa_id,
                    ),
                    tempChat,
                ])
                if (err?.status === 401) {
                    window.location.href = getActualUrl('/')
                }
            }
        }
    }

    // 停止生成
    const onStopAnswer = () => {
        cancelRequest(
            '/api/af-sailor-service/v1/assistant/chat/session_id',
            'get',
        )
        if (ws?.current) {
            ws.current.close()
        }
        setChatQuery('')
        setStop(true)
        setQaList(qaList.map((info) => ({ ...info, qa_stop: true })))
    }

    // 多轮问答赞/踩
    const onChatFeedback = async (
        action: FeedbackAction,
        qid?: string,
    ): Promise<boolean> => {
        if (qid && chat?.session_id) {
            try {
                const { res } = await putChatLike(qid, {
                    action,
                    session_id: chat.session_id,
                })
                if (res?.status === 'success') {
                    setQaList(
                        qaList.map((info) => {
                            if (info.qa_id === qid) {
                                return {
                                    ...info,
                                    like:
                                        action === FeedbackAction.Like
                                            ? 'like'
                                            : action === FeedbackAction.Dislike
                                            ? 'dislike'
                                            : 'neutrality',
                                }
                            }
                            return info
                        }),
                    )
                    if (action === FeedbackAction.Dislike) {
                        setFeedback({ qa_id: qid })
                    }
                    if (
                        [FeedbackAction.Dislike, FeedbackAction.Like].includes(
                            action,
                        )
                    ) {
                        messageSuccess(__('感谢您的反馈'))
                    }
                    return Promise.resolve(true)
                }
                return Promise.resolve(false)
            } catch (error) {
                formatError(error)
                return Promise.resolve(false)
            }
        }
        return Promise.resolve(false)
    }

    const values = useMemo(
        () => ({
            updateParams,
            participle,
            data,
            loading,
            llm,
            onLoadMore,
            stopInfo,
            conditions,
            isCongSearch,
            searchKey,
            searchInfo,
            commomWord,
            setCommonWord,
            assetType,
            matchKeys,
            status,
            cites,
            answerText,
            table,
            stop,
            onStopAnswer,
            feedback,
            setFeedback,
            filters,
            answerId,
            chat,
            setChat,
            qaList,
            resetChatData,
            onChatFeedback,
            chatDetailsLoading,
            bigHeader,
            hasDataOperRole,
        }),
        [
            updateParams,
            participle,
            data,
            loading,
            llm,
            onLoadMore,
            stopInfo,
            conditions,
            isCongSearch,
            searchKey,
            searchInfo,
            commomWord,
            setCommonWord,
            assetType,
            matchKeys,
            status,
            cites,
            answerText,
            table,
            stop,
            onStopAnswer,
            feedback,
            setFeedback,
            filters,
            answerId,
            chat,
            setChat,
            qaList,
            resetChatData,
            onChatFeedback,
            chatDetailsLoading,
            bigHeader,
            hasDataOperRole,
        ],
    )
    return (
        <CongSearchContext.Provider value={values}>
            {children}
        </CongSearchContext.Provider>
    )
}
