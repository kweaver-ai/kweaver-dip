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
import { message } from 'antd'
import {
    formatError,
    changeAnalysisLikeStatus,
    reqSearchResc,
    reqSearchCatlg,
    getAskAnswer,
    getErrorMessage,
    messageError,
    getUserViewMultiDetailsRequest,
} from '@/core'
import {
    AssetType,
    AssetVersion,
    IFilterItem,
    InitData,
    KEYTYPE,
} from './const'
import { cancelRequest } from '@/utils'
import {
    QAStatus,
    ICiteItem,
    initFeedback,
    FeedbackAction,
    mergeArr,
} from './helper'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import local from './locale'
import { useTestLLM } from '@/hooks/useTestLLM'

type ICongSearchContext = {
    updateParams: (
        type: ParamsType,
        value: any,
        available_option: number,
    ) => void
    participle?: any[]
    data?: any
    loading?: boolean
    onLoadMore: () => void
    [key: string]: any
}

interface ResourceItem {
    // id
    id: string

    // 序号
    serial_number: string

    // 资源类型
    type: string

    // 描述
    title: string
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
    const [searchInfo, setSearchInfo] = useState<{
        keyword: string
        available_option: number
    }>({
        keyword: '',
        available_option: 1,
    })
    // 左侧筛选过滤
    const [stopInfo, setStopInfo] =
        useState<Record<KEYTYPE, IFilterItem[]>>(InitData)
    // 右侧顶栏过滤参数
    const [filters, setFilters] = useState<Record<string, any>>({})
    // Tab选项
    const [assetType, setAssetType] = useState<string>(AssetType.LOGICVIEW)
    // 智能搜索停用词
    const [stopKeys, setStopKeys] = useState<any>({})
    // 是否为认知搜索
    const [isCongSearch, setIsCongSearch] = useState<boolean>(false)
    // 是否重新触发QA搜索
    const [isQASearch, setIsQASearch] = useState<boolean>(true)
    // 列表数据
    const [data, setData] = useState<any>()
    // 加载状态
    const [loading, setLoading] = useState<boolean>(false)
    // 问答loading状态
    const [qaLoading, setQALoading] = useState<boolean>(false)
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

    const [status, setStatus] = useState(QAStatus.Loading)
    // 引用
    const [cites, setCites] = useState<ResourceItem[]>([])
    // 回答
    const [answerText, setAnswerText] = useState('')
    // 表格
    const [table, setTable] = useState('')
    // 答案id
    const [answerId, setAnswerId] = useState('')
    const [stop, setStop] = useState(false)
    const [feedback, setFeedback] = useState(initFeedback)

    const [{ using }, updateUsing] = useGeneralConfig()
    const [llm] = useTestLLM()

    const [errorText, setErrorText] = useState('')

    useEffect(() => {
        if (!llm) {
            setStatus(QAStatus.Error)
            setErrorText(local('认知助手服务不可用，无法生成回答'))
        }
    }, [llm])

    useEffect(() => {
        getConfig()
    }, [])

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
        if (searchInfo?.keyword) {
            const cond = {
                size: 20,
                keyword: searchInfo?.keyword || '',
                stop_entity_infos: stopKeys?.[KEYTYPE.DIM],
                asset_type: assetType,
                available_option: searchInfo.available_option,
                ...(filters || {}),
            }
            setConditions(cond)
        }
    }, [searchInfo])

    useEffect(() => {
        const requestParams = { ...conditions, loadType: LoadType.Init }
        getData(requestParams)
    }, [conditions])

    useEffect(() => {
        if (ws?.current) {
            ws.current.close()
        }
        resetQAStatus()
    }, [assetType])

    // 重置数据
    const handleReset = useCallback(() => {
        setStopKeys(InitData)
        setData(undefined)
        nextFlag.current = undefined
        setFilters({})
    }, [])

    // 更新搜索条件参数
    const updateParams = useCallback(
        (type: ParamsType, param: any, available_option: number) => {
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
                        available_option,
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
                    setAssetType(param)
                    break
                default:
                    break
            }
        },
        [searchInfo],
    )

    // 加载页面数据
    const getData = async (requestParams: any) => {
        const { loadType, ...params } = requestParams
        params.stopwords = Array.from(new Set([...(commomWord || [])]))
        if (params.asset_type === undefined) return
        try {
            // 初次加载
            if (!nextFlag.current) {
                setLoading(true)
            }

            if (isReSearch.current || isSwitchTab.current) {
                setStopInfo({
                    [KEYTYPE.OBJ]: [],
                    [KEYTYPE.DIM]: [],
                })
            }
            const reqSearchFunc =
                using === 1 ? reqSearchCatlg : getFunc(params.asset_type)

            if (isCongSearch && isQASearch) {
                resetQAStatus()
                setCites([])
                setAnswerText('')
                getQAAnswer()
            }

            params.search_type = 'analysis_cognitive_search'
            const res = await reqSearchFunc({
                ...params,
            })

            nextFlag.current = res?.next_flag

            // 初始化
            let entriesList: any = res?.entries || []
            if (loadType === LoadType.More) {
                // 加载更多
                entriesList = data?.entries
                    ? [...data.entries, ...(res?.entries || [])]
                    : res?.entries
            }
            const ids = entriesList
                .filter((item) => item?.available_status === '1')
                .map((item) => item.id)
            const viewDetails = await getViewDetailArr(ids)
            const resultArr = mergeArr(entriesList, viewDetails.logic_views)
            setData({
                ...res,
                entries: resultArr,
            })
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
        } catch (error) {
            if (error?.data?.code === 'ERR_CANCELED') {
                return
            }
            setLoading(false)
            messageError(local('认知助手服务无法连接'))
            setStatus(QAStatus.Error)
            setErrorText(local('认知助手服务无法连接'))
        }
    }

    // 重新获取回答前，还原QA问答相关状态
    const resetQAStatus = () => {
        setStatus(QAStatus.Loading)
        setAnswerText('')
        setTable('')
        setCites([])
        setAnswerId('')
        setStop(false)
        setFeedback(initFeedback)
    }

    const getViewDetailArr = async (ids) => {
        const res = await getUserViewMultiDetailsRequest({ ids })
        return res
    }

    /**
     * qa问答
     * @param asset_type asset_type 数据资产类型 数据资源 all，data_view，interface_svc；数据目录all, data_catalog
     * @param data_version 数据版本，数据资源还是数据目录data-resource, data-catalog
     */
    const getQAAnswer = async () => {
        try {
            const result = await getAskAnswer({
                size: conditions.size,
                query: conditions.keyword,
                available_option: conditions.available_option,
            })
            if (result?.res_status !== '1') {
                setCites([])
                setAnswerText(
                    '抱歉，AI搜索在您有权限的数据中并没有找到此问题的答案，可尝试更改搜索关键词后重新发起搜索。',
                )
                setAnswerId('')
                setStatus(QAStatus.Ending)
            } else {
                const ids = result?.res?.entities?.map((item) => item.id)
                // const viewDetails = await getViewDetailArr(ids)
                // const resultArr = mergeArr(
                //     result?.res?.entities,
                //     viewDetails.logic_views,
                // )
                setCites(result?.res?.entities)
                // setCites(temp)
                setAnswerText(
                    result?.res?.explanation_formview ||
                        local(
                            '抱歉，AI搜索在您有权限的数据中并没有找到此问题的答案，可尝试更改搜索关键词后重新发起搜索。',
                        ),
                )
                setAnswerId(result?.res?.qa_id || '')
                setStatus(QAStatus.Ending)
            }
        } catch (error) {
            messageError(local('认知助手服务无法连接'))
            setStatus(QAStatus.Error)
            setErrorText(local('认知助手服务无法连接'))
        }
    }

    // const getQAAnswer = (asset_type, data_version) => {
    //     if (ws?.current) {
    //         cancelRequest('/api/af-sailor-service/v1/assistant/qa', 'get')
    //         ws.current.close()
    //     }
    //     if (ws) {
    //         const query = encodeURIComponent(searchKey)
    //         const qaAssetType = using === 1 ? 'all' : assetType
    //         const dataVersion = using === 1 ? 'data-catalog' : 'data-resource'
    //         ws.current = new EventSourcePolyfill(
    //             `/api/af-sailor-service/v1/assistant/qa?query=${query}&asset_type=${qaAssetType}&data_version=${dataVersion}`,
    //             {
    //                 headers: {
    //                     Authorization: `Bearer ${Cookies.get(
    //                         'af.oauth2_token',
    //                     )}`,
    //                     'Content-Type': 'text/event-stream',
    //                 },
    //                 heartbeatTimeout: 60000,
    //             },
    //         )
    //
    //         ws.current.onopen = () => {
    //             setStatus(QAStatus.Loading)
    //         }
    //
    //         ws.current.onmessage = (e: any) => {
    //             const { result } = JSON.parse(e?.data)
    //             setStatus(result?.status)
    //             if (result?.status === QAStatus.Answer) {
    //                 if (result?.res?.cites) {
    //                     setCites(result?.res?.cites)
    //                 }
    //
    //                 if (result?.res?.text) {
    //                     setAnswerText(result?.res?.text)
    //                 }
    //
    //                 if (result?.res?.table) {
    //                     setTable(result?.res?.table)
    //                 }
    //             }
    //
    //             if (result?.answer_id) {
    //                 setAnswerId(result?.answer_id)
    //             }
    //
    //             if (result?.status === QAStatus.Ending) {
    //                 ws.current.close()
    //             }
    //         }
    //
    //         ws.current.onerror = () => {
    //             ws.current.close()
    //             setStatus(QAStatus.Error)
    //         }
    //     }
    // }

    // 加载更多
    const onLoadMore = () => {
        const requestParams = {
            ...conditions,
            next_flag: nextFlag.current,
            loadType: LoadType.More,
        }
        getData(requestParams)
    }

    const searchKey = useMemo(() => searchInfo.keyword, [searchInfo])

    // 停止生成
    const onStopAnswer = () => {
        // cancelRequest('/api/af-sailor-service/v1/assistant/qa', 'get')
        // if (ws?.current) {
        //     ws.current.close()
        // }
        setStop(true)
    }

    // 反馈
    const onFeedback = async ({ action }: { action: FeedbackAction }) => {
        switch (action) {
            case FeedbackAction.Like:
                setFeedback({
                    like: FeedbackAction.Like,
                    dislike: FeedbackAction.CancelDislike,
                })
                break
            case FeedbackAction.CancelLike:
                setFeedback({
                    like: FeedbackAction.CancelLike,
                    dislike: FeedbackAction.CancelDislike,
                })
                break
            case FeedbackAction.Dislike:
                setFeedback({
                    like: FeedbackAction.CancelLike,
                    dislike: FeedbackAction.Dislike,
                })
                break
            case FeedbackAction.CancelDislike:
                setFeedback({
                    like: FeedbackAction.CancelLike,
                    dislike: FeedbackAction.CancelDislike,
                })
                break

            default:
                break
        }
        let answer_like = ''
        if (action.includes('cancel')) {
            answer_like = 'cancel'
        } else if (action === 'dislike') {
            answer_like = 'unlike'
        } else if (action === 'like') {
            answer_like = 'like'
        }
        if (answerId) {
            try {
                await changeAnalysisLikeStatus({
                    answer_id: answerId,
                    answer_like,
                })
            } catch (error) {
                formatError(error)
            }
        }
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
            onFeedback,
            filters,
            errorText,
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
            onFeedback,
            filters,
            errorText,
        ],
    )
    return (
        <CongSearchContext.Provider value={values}>
            {children}
        </CongSearchContext.Provider>
    )
}
