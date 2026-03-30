import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Input, Button, message, Dropdown, Tooltip } from 'antd'
import {
    ArrowRightOutlined,
    ProductOutlined,
    CloseOutlined,
    CloseCircleFilled,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
    getAssistantList,
    getSearchAgentInfo,
    getAgentVersionV0,
} from '@/core/apis/afSailorService'
import { Loader } from '@/ui'
import styles from './styles.module.less'
import __ from './locale'
import AgentAvatar from '../Assistant/AgentAvatar'
import { useMicroAppProps } from '@/context'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

interface IAgentInfo {
    adp_agent_key: string
    adp_business_domain_id: string
}

interface ISceneAgent {
    id: string
    key: string
    name: string
    business_domain_id?: string
    avatar?: string
}

interface ISceneMoreDropdownProps {
    agents: ISceneAgent[]
    selectedKey?: string
    onSelect: (agent: ISceneAgent) => void
    onViewMore: () => void
}

const SceneMoreDropdown: React.FC<ISceneMoreDropdownProps> = ({
    agents,
    selectedKey,
    onSelect,
    onViewMore,
}) => {
    return (
        <div className={styles.sceneMoreDropdownWrapper}>
            <div className={styles.sceneMoreDropdown}>
                {agents.map((agent) => {
                    const isActive = selectedKey === agent.key
                    const tagClassName = isActive
                        ? `${styles.dropdownTag} ${styles.dropdownTagActive}`
                        : styles.dropdownTag

                    return (
                        <div
                            className={tagClassName}
                            onClick={() => onSelect(agent)}
                            title={agent.name}
                            key={agent.key}
                        >
                            <div className={styles.dropdownTagIcon}>
                                <AgentAvatar
                                    size={22}
                                    name={agent.name}
                                    avatar={agent.avatar}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        background: 'transparent',
                                    }}
                                />
                            </div>
                            <div className={styles.dropdownTagName}>
                                {agent.name}
                            </div>
                        </div>
                    )
                })}
                <div className={styles.dropdownMoreBtn} onClick={onViewMore}>
                    <div
                        style={{
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <FontIcon
                            name="icon-quanbuzhushou"
                            type={IconType.COLOREDICON}
                            style={{ fontSize: 16 }}
                        />
                    </div>
                    <div className={styles.dropdownTagName}>
                        {__('更多场景')}
                    </div>
                </div>
            </div>
        </div>
    )
}

const createSceneMoreDropdownRender =
    ({ agents, selectedKey, onSelect, onViewMore }: ISceneMoreDropdownProps) =>
    () =>
        (
            <SceneMoreDropdown
                agents={agents}
                selectedKey={selectedKey}
                onSelect={onSelect}
                onViewMore={onViewMore}
            />
        )

interface ISceneTagsRowProps {
    visibleSceneAgents: ISceneAgent[]
    overflowSceneAgents: ISceneAgent[]
    selectedSceneAgentKey?: string
    onSceneTagClick: (agent: ISceneAgent) => void
    onViewMore: () => void
    moreOpen: boolean
    setMoreOpen: (open: boolean) => void
}

const SceneTagsRow: React.FC<ISceneTagsRowProps> = ({
    visibleSceneAgents,
    overflowSceneAgents,
    selectedSceneAgentKey,
    onSceneTagClick,
    onViewMore,
    moreOpen,
    setMoreOpen,
}) => (
    <div className={styles.sceneTagsRow}>
        {visibleSceneAgents.map((agent) => {
            const isActive = selectedSceneAgentKey === agent.key
            const tagClassName = isActive
                ? `${styles.sceneTag} ${styles.sceneTagActive}`
                : styles.sceneTag

            return (
                <div
                    className={tagClassName}
                    onClick={() => onSceneTagClick(agent)}
                    title={agent.name}
                    key={agent.key}
                >
                    <div className={styles.sceneTagIcon}>
                        <AgentAvatar
                            size={22}
                            name={agent.name}
                            avatar={agent.avatar}
                            style={{
                                width: '100%',
                                height: '100%',
                                background: 'transparent',
                            }}
                        />
                    </div>
                    <div className={styles.name}>{agent.name}</div>
                </div>
            )
        })}
        {overflowSceneAgents.length > 0 ? (
            <Dropdown
                trigger={['click']}
                dropdownRender={createSceneMoreDropdownRender({
                    agents: overflowSceneAgents,
                    selectedKey: selectedSceneAgentKey,
                    onSelect: (agent) => {
                        onSceneTagClick(agent)
                        setMoreOpen(false)
                    },
                    onViewMore,
                })}
                destroyPopupOnHide
                onOpenChange={(flag) => setMoreOpen(flag)}
                open={moreOpen}
            >
                <div className={styles.sceneMoreBtn}>
                    <FontIcon
                        name="icon-quanbuzhushou"
                        type={IconType.COLOREDICON}
                        style={{ fontSize: 16 }}
                    />
                    {__('更多')}
                </div>
            </Dropdown>
        ) : (
            <Button
                type="link"
                className={styles.viewMoreLink}
                onClick={onViewMore}
            >
                <ProductOutlined style={{ fontSize: 16 }} />
                {__('更多场景')}
            </Button>
        )}
    </div>
)

const { TextArea } = Input

const SmartDataQuery: React.FC = () => {
    const [question, setQuestion] = useState('')
    const [agentInfo, setAgentInfo] = useState<IAgentInfo | null>(null)
    const [loadingAgent, setLoadingAgent] = useState(false)
    const [agentError, setAgentError] = useState<string | null>(null)
    const [sceneAgents, setSceneAgents] = useState<ISceneAgent[]>([])
    const [selectedSceneAgent, setSelectedSceneAgent] =
        useState<ISceneAgent | null>(null)
    const [moreOpen, setMoreOpen] = useState(false)
    const [presetQuestions, setPresetQuestions] = useState<
        Array<{ question: string }>
    >([])
    const { microAppProps } = useMicroAppProps()
    const [profile, setProfile] = useState<string>('')

    const navigate = useNavigate()

    useEffect(() => {
        const fetchDefaultAgent = async () => {
            setLoadingAgent(true)
            try {
                const res = await getSearchAgentInfo()
                if (res?.res?.adp_agent_key) {
                    setAgentInfo(res.res)
                    setAgentError(null)
                } else {
                    setAgentError(__('无法获取默认助手，暂时无法进行智能问数'))
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('获取搜索 Agent 信息失败:', error)
                setAgentError(__('获取智能问数配置失败，请稍后重试'))
            } finally {
                setLoadingAgent(false)
            }
        }

        const fetchSceneAgents = async () => {
            try {
                const res = await getAssistantList({
                    list_flag: 1,
                    size: 20,
                })
                setSceneAgents(res?.entries || [])
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('获取场景 Agent 列表失败:', error)
            }
        }

        fetchDefaultAgent()
        fetchSceneAgents()
    }, [])

    const currentAgent = useMemo(() => {
        if (selectedSceneAgent) {
            return {
                name: selectedSceneAgent.name,
                key: selectedSceneAgent.key,
                business_domain_id: selectedSceneAgent.business_domain_id || '',
            }
        }

        if (agentInfo) {
            return {
                name: __('智能问数'),
                key: agentInfo.adp_agent_key,
                business_domain_id: agentInfo.adp_business_domain_id,
            }
        }

        return null
    }, [agentInfo, selectedSceneAgent])

    const handleSubmit = useCallback(
        (overrideQuestion?: string) => {
            const value = (overrideQuestion ?? question).trim()

            if (!value) {
                message.warning(__('请输入提问内容'))
                return
            }

            if (!currentAgent) {
                message.error(
                    agentError || __('无法获取默认助手，暂时无法进行智能问数'),
                )
                return
            }

            const params = new URLSearchParams({
                agentName: currentAgent.name,
                agentKey: currentAgent.key,
                businessDomain: currentAgent.business_domain_id || '',
            })

            const newUrl = `/chatkit/${currentAgent.key}?${params.toString()}`

            navigate(newUrl, {
                state: {
                    question: value,
                },
            })
        },
        [question, currentAgent, agentError, navigate],
    )

    const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleSceneTagClick = useCallback(
        async (agent: ISceneAgent) => {
            if (selectedSceneAgent && selectedSceneAgent.key === agent.key) {
                setSelectedSceneAgent(null)
                setPresetQuestions([])
                return
            }
            setSelectedSceneAgent(agent)
            setPresetQuestions([])
            try {
                const res = await getAgentVersionV0(
                    agent.key,
                    agent.business_domain_id || '',
                )
                const list = res?.config?.preset_questions ?? []
                setPresetQuestions(Array.isArray(list) ? list : [])
                setProfile(res?.profile ?? '')
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('获取 preset_questions 失败:', error)
                setPresetQuestions([])
            }
        },
        [selectedSceneAgent],
    )

    const handleRemoveSelectedAgent = useCallback(() => {
        setSelectedSceneAgent(null)
        setPresetQuestions([])
        setProfile('')
        setMoreOpen(false)
    }, [])

    const handleViewMoreScene = () => {
        navigate('/Assistant')
    }

    const MAX_VISIBLE_TAGS = 5
    const visibleSceneAgents: ISceneAgent[] = sceneAgents.slice(
        0,
        MAX_VISIBLE_TAGS,
    )
    const overflowSceneAgents: ISceneAgent[] =
        sceneAgents.slice(MAX_VISIBLE_TAGS)
    const selectedSceneAgentKey = selectedSceneAgent?.key

    return (
        <div className={styles.smartDataQueryPage}>
            <div className={styles.rightPane}>
                <div className={styles.rightContent}>
                    <div className={styles.title}>
                        {__('Hi! ${name}， 你好', {
                            name: microAppProps.props.user.vision_name,
                        })}
                    </div>
                    {loadingAgent ? (
                        <div className={styles.loaderWrapper}>
                            <Loader tip={__('正在加载智能问数配置...')} />
                        </div>
                    ) : (
                        <>
                            {agentError && (
                                <div className={styles.errorTip}>
                                    {agentError}
                                </div>
                            )}
                            {selectedSceneAgent && (
                                <div className={styles.selectedAgentTagRow}>
                                    <div
                                        className={styles.selectedAgentTag}
                                        title={selectedSceneAgent.name}
                                    >
                                        <div
                                            className={
                                                styles.selectedAgentTagIcon
                                            }
                                        >
                                            <AgentAvatar
                                                size={24}
                                                name={selectedSceneAgent.name}
                                                avatar={
                                                    selectedSceneAgent.avatar
                                                }
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    background: 'transparent',
                                                }}
                                            />
                                        </div>
                                        <span
                                            className={
                                                styles.selectedAgentTagName
                                            }
                                        >
                                            {`${selectedSceneAgent.name}：`}
                                        </span>
                                        <span
                                            className={
                                                styles.selectedAgentTagClose
                                            }
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleRemoveSelectedAgent()
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === 'Enter' ||
                                                    e.key === ' '
                                                ) {
                                                    e.preventDefault()
                                                    handleRemoveSelectedAgent()
                                                }
                                            }}
                                            aria-label={__('移除已选场景')}
                                        >
                                            <CloseCircleFilled />
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div className={styles.queryBox}>
                                <TextArea
                                    className={styles.questionInput}
                                    value={question}
                                    onChange={(e) =>
                                        setQuestion(e.target.value)
                                    }
                                    placeholder={
                                        profile ||
                                        __(
                                            '我是你的数据分析数字员工，我可以帮你查找和分析数据，请告诉我你要做的事情。',
                                        )
                                    }
                                    onPressEnter={handlePressEnter}
                                    disabled={!!agentError}
                                    style={{
                                        height: '100%',
                                        resize: 'none',
                                        borderRadius: '12px',
                                    }}
                                />
                                <div className={styles.actions}>
                                    <Button
                                        type="primary"
                                        className={styles.askButton}
                                        onClick={() => handleSubmit()}
                                        disabled={
                                            !!agentError || !question.trim()
                                        }
                                    >
                                        <ArrowRightOutlined />
                                    </Button>
                                </div>
                            </div>
                            {presetQuestions.length > 0 && (
                                <div className={styles.presetQuestionsRow}>
                                    {presetQuestions.map((item, index) => (
                                        <div
                                            key={`${item.question}-${index}`}
                                            className={styles.presetQuestionTag}
                                            onClick={() =>
                                                handleSubmit(item.question)
                                            }
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === 'Enter' ||
                                                    e.key === ' '
                                                ) {
                                                    e.preventDefault()
                                                    handleSubmit(item.question)
                                                }
                                            }}
                                        >
                                            {item.question}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {!selectedSceneAgent && sceneAgents.length > 0 && (
                                <SceneTagsRow
                                    visibleSceneAgents={visibleSceneAgents}
                                    overflowSceneAgents={overflowSceneAgents}
                                    selectedSceneAgentKey={
                                        selectedSceneAgentKey
                                    }
                                    onSceneTagClick={handleSceneTagClick}
                                    onViewMore={handleViewMoreScene}
                                    moreOpen={moreOpen}
                                    setMoreOpen={setMoreOpen}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default SmartDataQuery
