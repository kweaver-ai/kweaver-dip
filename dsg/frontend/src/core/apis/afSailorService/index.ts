import requests from '@/utils/request'
import {
    IChatFavoriteItem,
    IChatHistoryItem,
    IQaDetails,
    ICogSearchQuery,
    ICogSearchResult,
    IChatDetails,
    IGetAssistantListParams,
    IAgentList,
    IPutOnAssistantParams,
    IPutOnAssistantResult,
    IPullOffAssistantParams,
    IPullOffAssistantResult,
    IAgentAppConversationList,
    IWsCategoryListData,
    IWsCategoryItem,
} from './index.d'
import { ICommonRes } from '../common'

const { get, post, put, delete: del } = requests

// 获取图谱信息
export const getGraphInfo = (params) => {
    return get(
        `/api/af-sailor-service/v1/tools/knowledge-network/graph/iframe`,
        params,
    )
}

/**
 * 获取数据理解维度的ai理解
 * @catalog_id 目录的ID
 * @catalogID 维度配置信息
 */
export const getDataComprehensionAi = (
    catalog_id: string,
    dimension: string = '字段注释',
): Promise<any> => {
    return get(`/api/af-sailor/v1/comprehension`, {
        catalog_id,
        dimension,
    })
}

/**
 * 测试是否安装大模型
 */
export const getTestLLM = () => {
    return get(`/api/af-sailor-service/v1/assistant/test-llm`)
}

/**
 * 获取搜素历史记录
 * @search_word 搜素关键字，当搜素关键字为空时，搜素全部历史记录
 */
export const getHistory = (search_word: string): Promise<any> => {
    return get(`/api/af-sailor-service/v1/assistant/query/history`, {
        search_word,
    })
}

/**
 * 删除历史记录
 * @param {string} qid 历史记录id
 * @returns
 */
export const deleteHistory = (qid: string) => {
    return requests.delete(
        `/api/af-sailor-service/v1/assistant/query/history/${qid}`,
    )
}

/**
 * 点赞、取消点赞
 * @param answer_id 回答id
 * @param answer_like 回答状态
 * @returns
 */
export const changeLikeStatus = ({ answer_id, answer_like }) => {
    return requests.post(`/api/af-sailor-service/v1/assistant/answer-like`, {
        answer_id,
        answer_like,
    })
}

/**
 * 点赞、取消点赞
 * @param answer_id 回答id
 * @param answer_like 回答状态
 * @returns
 */
export const changeAnalysisLikeStatus = ({ answer_id, answer_like }) => {
    return requests.put(
        `/api/af-sailor-service/v1/cognitive/search/qa/${answer_id}/like`,
        {
            action: answer_like,
        },
    )
}

/*
 * 获取ai回答
 * @param query 问题
 * @param size 大小
 * @param available_option 0匹配数据超市，1代表匹配可用资源
 * @returns
 */
export const getAskAnswer = (params: {
    query: string
    size?: number
    available_option: number
}): Promise<{
    res: any
    res_status: string
}> => {
    return post(
        `/api/af-sailor-service/v1/cognitive/resource/formview_analysis_search`,
        params,
    )
}

// 基于逻辑实体推荐元数据库表
export const postRecommendLogicView = (params: {
    logical_entity_id: string
}): Promise<{
    res: { id: string; business_name: string; technical_name: string }[]
}> => {
    return post(
        `/api/af-sailor-service/v1/logical-view/recommend/metadata-view`,
        params,
    )
}

/**
 * 认知搜索-数据资产认知搜索前端数据资源
 * @param params ICogSearchQuery 认知搜索参数
 * @returns
 */
export const reqSearchResc = (
    params: Partial<ICogSearchQuery>,
): Promise<Partial<ICogSearchResult>> => {
    return post(`/api/af-sailor-service/v1/cognitive/resource/search`, params)
}

/**
 * 认知搜索-目录查询
 * @param params ICogSearchQuery 认知搜索参数
 * @returns
 */
export const reqSearchCatlg = (
    params: Partial<ICogSearchQuery>,
): Promise<Partial<ICogSearchResult>> => {
    return post(
        `/api/af-sailor-service/v1/cognitive/datacatalog/search`,
        params,
    )
}

/**
 * 多轮问答获取session_id
 */
export const getChatSessionId = (
    signal?: AbortSignal,
): Promise<{
    res: { session_id: string }
}> => {
    return get(
        `/api/af-sailor-service/v1/assistant/chat/session_id`,
        undefined,
        {
            signal,
        },
    )
}

/**
 * 多轮问答获取历史记录列表
 */
export const getChatHistory = (): Promise<{ res: IChatHistoryItem[] }> => {
    return get(`/api/af-sailor-service/v1/assistant/chat/history`)
}

/**
 * 删除多轮问答历史记录
 * @session_id 多轮问答id
 */
export const deleteChatHistory = (session_id: string) => {
    return del(`/api/af-sailor-service/v1/assistant/chat/history/${session_id}`)
}

/**
 * 多轮问答获取历史详情
 * @session_id 多轮问答id
 */
export const getChatHistoryDetails = (
    session_id: string,
): Promise<IChatDetails> => {
    return get(`/api/af-sailor-service/v1/assistant/chat/history/${session_id}`)
}

/**
 * 获取多轮问答收藏记录列表
 */
export const getChatFavorite = (): Promise<{ res: IChatFavoriteItem[] }> => {
    return get(`/api/af-sailor-service/v1/assistant/chat/favorite`)
}

/**
 * 多轮问答收藏问答
 * @session_id 多轮问答id
 */
export const postChatFavorite = (
    session_id: string,
): Promise<{ res: { status: 'success' | 'failure'; favorite_id: string } }> => {
    return post(
        `/api/af-sailor-service/v1/assistant/chat/${session_id}/favorite`,
    )
}

/**
 * 多轮问答删除收藏记录
 * @favorite_id 收藏id
 */
export const deleteChatFavorite = (
    favorite_id: string,
): Promise<{ res: { status: 'success' | 'failure' } }> => {
    return del(
        `/api/af-sailor-service/v1/assistant/chat/favorite/${favorite_id}`,
    )
}

/**
 * 多轮问答更新收藏问答
 * @session_id 多轮问答id
 */
export const putChatFavorite = (
    session_id: string,
): Promise<{ res: { status: 'success' | 'failure' } }> => {
    return put(
        `/api/af-sailor-service/v1/assistant/chat/${session_id}/favorite`,
    )
}

/**
 * 多轮问答获取收藏详情
 * @favorite_id 收藏id
 */
export const getChatFavoriteDetails = (
    favorite_id: string,
): Promise<IChatDetails> => {
    return get(
        `/api/af-sailor-service/v1/assistant/chat/favorite/${favorite_id}`,
    )
}

/**
 * 多轮问答点赞/取消点赞/点踩/取消点踩
 * @option 点赞/点踩 'like' | 'cancel-like' | 'dislike' | 'cancel-dislike'
 * @session_id 多轮问答id
 * @qa_id qa问答id
 */
export const putChatLike = (
    qa_id: string,
    params: {
        action: string
        session_id: string
    },
): Promise<{ res: { status: 'success' | 'failure' } }> => {
    return put(
        `/api/af-sailor-service/v1/assistant/chat/qa/${qa_id}/like`,
        params,
    )
}

/**
 * 反馈多轮问答不满意的原因
 * @option 备选答案 'inaccurate'不准确 | 'irrelevant'不相关 | 'error'错误 | 'other'其他
 * @remark 其他建议
 * @files 截图二进制
 */
export const postChatFeedback = (params: {
    session_id: string
    qa_id: string
    option: string[]
    remark: string
    files: string
}): Promise<{ res: { status: string } }> => {
    return post(
        `/api/af-sailor-service/v1/assistant/chat/qa/${params.qa_id}/feedback`,
        params,
    )
}

/**
 * 多轮对话单轮问答继续追问转多轮
 */
export const putChatTochat = (
    session_id: string,
): Promise<{ res: { status: string } }> => {
    return put(`/api/af-sailor-service/v1/assistant/chat/tochat`, {
        session_id,
    })
}

/** 获取知识网络列表 */
export const getKnowledgeNetworkList = (): Promise<
    ICommonRes<{ id: string; knw_name: string }>
> => {
    return get(`/api/af-sailor-service/v1/tools/knowledge-network/list`)
}

/** 获取知识图谱列表 */
export const getKnowledgeGraphList = (params: {
    // 知识网络id
    knw_id: string
    // default, 使用默认知识网络  specify 使用指定网络
    type: string
}): Promise<ICommonRes<{ id: string; graph_name_name: string }>> => {
    return get(
        `/api/af-sailor-service/v1/tools/knowledge-network/graph/list`,
        params,
    )
}

/** 获取词库列表 */
export const getKnowledgeLexiconList = (params: {
    // 知识网络id
    knw_id: string
    // default, 使用默认知识网络  specify 使用指定网络
    type: string
}): Promise<ICommonRes<{ id: string; lexicon_name: string }>> => {
    return get(
        `/api/af-sailor-service/v1/tools/knowledge-network/lexicon/list`,
        params,
    )
}

/**
 * 推荐模型列表
 */
export const recommendModelList = (params: {
    query: string
}): Promise<{
    data: any[]
}> => {
    return post(`/api/af-sailor-service/v1/recommend/subject_model`, params)
}

/** 获取助手列表 */
export const getAssistantList = (
    params: IGetAssistantListParams,
): Promise<IAgentList> => {
    return post(`/api/af-sailor-agent/assistant/agent/list`, params)
}

/** 上架智能体 */
export const putOnAssistant = (
    params: IPutOnAssistantParams,
): Promise<IPutOnAssistantResult> => {
    return put(`/api/af-sailor-agent/assistant/agent/put-on`, params)
}

/** 下架智能体 */
export const pullOffAssistant = (
    params: IPullOffAssistantParams,
): Promise<IPullOffAssistantResult> => {
    return put(`/api/af-sailor-agent/assistant/agent/pull-off`, params)
}

/** 获取助手分类详情 */
export const getAssistantCategoryDetail = (
    category_id: string,
): Promise<ICommonRes<IWsCategoryItem>> => {
    return get(
        `/api/af-sailor-agent/assistant/agent/category/detail/${category_id}`,
    )
}

/**
 * Agent App 会话列表
 * @param app_key agent app key（通用 agent 传 agent id/agent key，超级助手固定传 super_assistant）
 * @param params 分页参数
 */
export const getAgentAppConversations = (
    app_key: string,
    params?: { page?: number; size?: number },
): Promise<IAgentAppConversationList> => {
    return get(`/api/agent-app/v1/app/${app_key}/conversation`, params)
}

/**
 * 删除 Agent App 会话
 * @param app_key agent app key（通用 agent 传 agent id/agent key，超级助手固定传 super_assistant）
 * @param id 会话 ID
 */
export const deleteAgentAppConversation = (
    app_key: string,
    id: string,
): Promise<any> => {
    return del(`/api/agent-app/v1/app/${app_key}/conversation/${id}`)
}

/**
 * 获取搜索 Agent 信息
 */
export const getSearchAgentInfo = (): Promise<{
    res: {
        adp_agent_key: string
        adp_business_domain_id: string
    }
}> => {
    return get(`/api/af-sailor-agent/v1/assistant/search/info`)
}

/**
 * 获取 Agent 市场指定 Agent 的 v0 版本信息（含 preset_questions 等配置）
 * @param key agent key
 */
export const getAgentVersionV0 = (
    key: string,
    business_domain_id: string,
): Promise<any> => {
    return get(
        `/api/agent-factory/v3/agent-market/agent/${key}/version/v0`,
        undefined,
        {
            headers: {
                'x-business-domain': business_domain_id,
            },
        },
    )
}

/** 获取分类列表 */
export const getWsCategoryList = (): Promise<{ data: IWsCategoryListData }> => {
    return get(`/api/af-sailor-agent/system/config/ws-category-list`)
}

/** 关联分类 */
export const updateAssistantCategory = (
    agent_id: string,
    params: {
        category_ids: string[]
    },
): Promise<any> => {
    return put(
        `/api/af-sailor-agent/assistant/agent/update-category/${agent_id}`,
        params,
    )
}
