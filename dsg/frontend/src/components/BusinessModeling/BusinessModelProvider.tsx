import React, {
    FC,
    useMemo,
    useState,
    useEffect,
    createContext,
    useContext,
} from 'react'
import {
    BizModelType,
    IModalVersion,
    getModalVersions,
    formatError,
    BusinessAuditStatus,
    getQueryBooleanValue,
    getVersionId,
} from '@/core'
import { useQuery } from '@/utils'

// 定义 Context 接口
interface IBusinessModelContext {
    businessModelType: BizModelType
    setBusinessModelType: (type: BizModelType) => void
    isDraft?: boolean | undefined
    refreshDraft: (draft: boolean) => void
    versionList?: IModalVersion[]
    selectedVersion?: string | undefined
    refreshSelectedVersion?: (id: string) => void
    isAuditMode?: boolean
    coreBusinessDetails?: any
    refreshCoreBusinessDetails?: (details: any) => void
    isButtonDisabled?: boolean
    // 拖拽数据存储
    dragDataMap?: Map<string, any>
    refreshDragData?: (data: any) => void
    getDragData?: (dataId: string) => any
    clearDragData?: () => void
}

// 创建 Context
export const BusinessModelContext = createContext<IBusinessModelContext>({
    businessModelType: BizModelType.BUSINESS,
    setBusinessModelType: () => {},
    isDraft: false,
    refreshDraft: () => {},
    versionList: [],
    selectedVersion: '',
    refreshSelectedVersion: () => {},
    isAuditMode: false,
    coreBusinessDetails: {},
    refreshCoreBusinessDetails: () => {},
    isButtonDisabled: false,
    // 新增：拖拽数据存储的默认值
    dragDataMap: new Map(),
    refreshDragData: () => {},
    getDragData: () => undefined,
    clearDragData: () => {},
})

// 导出 Context Hook
export const useBusinessModelContext = () =>
    useContext<IBusinessModelContext>(BusinessModelContext)

interface BusinessModelProviderProps {
    businessModelType?: BizModelType
    id?: string
    // initDraft?: boolean
    // initButtonDisabled?: boolean
    // initSelectedVersion?: string
    children?: React.ReactNode
}

const BusinessModelProvider: FC<BusinessModelProviderProps> = ({
    businessModelType,
    id,
    // initDraft,
    // initSelectedVersion,
    // initButtonDisabled,
    children,
}) => {
    const query = useQuery()
    const auditMode = query.get('auditMode')
    const initButtonDisabled = getQueryBooleanValue(
        query.get('isButtonDisabled'),
    )
    const initIsDraft = getQueryBooleanValue(query.get('isDraft'))
    const initVersionId = getVersionId(query.get('versionId'))

    // 是否是草稿
    const [isDraft, setIsDraft] = useState<boolean | undefined>(initIsDraft)
    // 选中的版本
    const [selectedVersion, setSelectedVersion] = useState<string | undefined>(
        initVersionId,
    )
    // 版本列表
    const [versionList, setVersionList] = useState<IModalVersion[]>([])
    // 是否是审核模式
    const [isAuditMode, setIsAuditMode] = useState<boolean>(false)
    // 详情
    const [coreBusinessDetails, setCoreBusinessDetails] = useState<any>({})
    // 新增：拖拽数据存储
    const [dragDataMap, setDragDataMap] = useState<Map<string, any>>(new Map())
    // 业务模型类型
    const [busModelType, setBusinessModelType] = useState<BizModelType>(
        businessModelType || BizModelType.BUSINESS,
    )

    useEffect(() => {
        setIsAuditMode(!!(auditMode === 'true'))
    }, [auditMode])

    // 刷新草稿
    const refreshDraft = (draft: boolean) => {
        if (draft === isDraft) return
        setIsDraft(draft)
    }

    // 刷新选中的版本
    const refreshSelectedVersion = async (version_id: string) => {
        setSelectedVersion(version_id)
    }

    // 刷新详情
    const refreshCoreBusinessDetails = (details: any) => {
        setCoreBusinessDetails(details)
    }

    // 设置拖拽数据
    const refreshDragData = (data: any) => {
        if (!data || !data.id) {
            return
        }
        setDragDataMap((prev) => {
            const newMap = new Map(prev)
            newMap.set(data.id, data)
            return newMap
        })
    }

    // 获取拖拽数据
    const getDragData = (dataId: string) => {
        return dragDataMap.get(dataId)
    }

    // 清除拖拽数据
    const clearDragData = () => {
        setDragDataMap(new Map())
    }

    // 获取模型版本列表
    const getVersionList = async () => {
        // 非审核模式，不获取版本列表
        if (!id) return
        try {
            const res = await getModalVersions(id)
            setVersionList(res || [])
            setSelectedVersion(initVersionId || res[0]?.version_id || '')
        } catch (error) {
            formatError(error)
        }
    }

    // 审核模式和审核中禁用
    const isButtonDisabled = useMemo(() => {
        const auditStatus = coreBusinessDetails?.audit_status
        return (
            initButtonDisabled ||
            isAuditMode ||
            auditStatus === BusinessAuditStatus.PubAuditing ||
            auditStatus === BusinessAuditStatus.ChangeAuditing ||
            auditStatus === BusinessAuditStatus.DeleteAuditing
        )
    }, [coreBusinessDetails?.audit_status, isAuditMode, initButtonDisabled])

    useEffect(() => {
        getVersionList()
    }, [id, isAuditMode])

    const contextValue = useMemo(
        () => ({
            businessModelType: busModelType,
            setBusinessModelType,
            isDraft,
            refreshDraft,
            versionList,
            selectedVersion,
            refreshSelectedVersion,
            isAuditMode,
            coreBusinessDetails,
            refreshCoreBusinessDetails,
            isButtonDisabled,
            dragDataMap,
            refreshDragData,
            getDragData,
            clearDragData,
        }),
        [
            busModelType,
            setBusinessModelType,
            isDraft,
            refreshDraft,
            versionList,
            selectedVersion,
            refreshSelectedVersion,
            isAuditMode,
            coreBusinessDetails,
            refreshCoreBusinessDetails,
            isButtonDisabled,
            dragDataMap,
            refreshDragData,
            getDragData,
            clearDragData,
        ],
    )

    return (
        <BusinessModelContext.Provider value={contextValue}>
            {children}
        </BusinessModelContext.Provider>
    )
}

export default BusinessModelProvider
