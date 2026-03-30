import { Button, Divider, Form, message, Modal, Space } from 'antd'
import { InfoCircleFilled, LeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useContext, useEffect, useState } from 'react'
import classNames from 'classnames'
import {
    getActualUrl,
    keyboardCharactersReg,
    OperateType,
    useQuery,
} from '@/utils'
import styles from './styles.module.less'
import RequirementDetails from './RequirementDetails'
import AnalysisTable from './AnalysisTable'
import {
    formatError,
    getDemandAnalyseInfo,
    IAnalysesConclusion,
    IDemandItemConfig,
    saveDemandAnalyseInfo,
} from '@/core'
import AnalysisConclusion from './AnalysisConclusion'
import { ResourceSource, SaveOrSubmit } from '../Requirement/const'
import __ from './locale'
import { TextAreaView } from '../AutoFormView/baseViewComponents'
import { htmlDecodeByRegExp } from '../ResourcesDir/const'
import GlobalMenu from '../GlobalMenu'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'

const Analysis = () => {
    const navigate = useNavigate()
    const [form] = Form.useForm()
    // 分析项所有数据包括被修改过的数据
    const [analyseItems, setAnalyseItems] = useState<IDemandItemConfig[]>([])
    // 原始数据
    const [originalItems, setOriginalItems] = useState<IDemandItemConfig[]>([])

    const [expandedShopKeys, setExpandedShopKeys] = useState<string[]>([])
    const [expandedBlankKeys, setExpandedBlankKeys] = useState<string[]>([])

    const [conclusionInfo, setConclusionInfo] = useState<IAnalysesConclusion>()
    const [auditRejectDesc, setAuditRejectDesc] = useState('')

    const [isChanged, setIsChanged] = useState(false)

    const query = useQuery()
    // 编辑时获取的需求id
    const id = query.get('id')
    // 模式： 详情模式
    const mode = query.get('mode')

    const getAnalyse = async (demandId: string) => {
        try {
            const {
                analyse_items,
                original_items,
                audit_reject_desc,
                ...rest
            } = await getDemandAnalyseInfo(demandId)
            setAnalyseItems(analyse_items)
            setOriginalItems(original_items)
            const shopKeys: string[] = []
            const blankKeys: string[] = []

            analyse_items.forEach((item) => {
                if (item.original_id === '0') {
                    return
                }
                if (item.res_source === ResourceSource.SERVICESHOP) {
                    shopKeys.push(item.res_id)
                } else {
                    blankKeys.push(item.res_id)
                }
            })
            setExpandedShopKeys(shopKeys)
            setExpandedBlankKeys(blankKeys)
            form.setFieldsValue({ ...rest })
            setConclusionInfo(rest)
            setAuditRejectDesc(audit_reject_desc || '')
        } catch (err) {
            formatError(err)
        }
    }

    useEffect(() => {
        if (id) {
            getAnalyse(id)
        }
    }, [id])

    const handleReturn = () => {
        navigate(`/dataService/requirementAnalysisList`)
    }

    const returnToDemandList = () => {
        if (isChanged) {
            ReturnConfirmModal({
                onCancel: handleReturn,
            })
        } else {
            handleReturn()
        }
    }

    const updateData = (values: IDemandItemConfig[]) => {
        setAnalyseItems(values)
        setIsChanged(true)
    }

    const getTitle = (title: string) => {
        return (
            <div className={styles.titleWrapper}>
                <div className={styles.titleLine} />
                <div className={styles.title}>{title}</div>
            </div>
        )
    }

    const updateAnalysisData = async (saveType: SaveOrSubmit) => {
        if (!id) return
        form.validateFields().then(async () => {
            let isValidate = false
            analyseItems.forEach((item) => {
                if (
                    (item.apply_desc &&
                        !keyboardCharactersReg.test(item.apply_desc)) ||
                    (item.has_resource_desc &&
                        !keyboardCharactersReg.test(item.has_resource_desc))
                ) {
                    isValidate = true
                }
            })
            if (isValidate) return

            try {
                await saveDemandAnalyseInfo(id, {
                    analyse_items: analyseItems || [],
                    ...form.getFieldsValue(),
                    save_op_type: saveType,
                })
                message.success(
                    saveType === SaveOrSubmit.SAVE
                        ? __('保存成功')
                        : __('分析完成，已提交至下一环节'),
                )
                handleReturn()
            } catch (error) {
                formatError(error)
            }
        })
    }
    return (
        <div className={styles.analysisWrapper}>
            <div className={styles.header}>
                <GlobalMenu />
                <div onClick={returnToDemandList} className={styles.returnInfo}>
                    <LeftOutlined className={styles.returnArrow} />
                    <span className={styles.returnText}>返回</span>
                </div>
                <Divider className={styles.divider} type="vertical" />
                <div className={styles.createTitle}>
                    {mode === OperateType.DETAIL ? ' 需求分析详情' : '需求分析'}
                </div>
            </div>
            <div
                className={classNames({
                    [styles.bodyWrapper]: true,
                    [styles.bodyWrapperDetails]: mode === OperateType.DETAIL,
                })}
            >
                <div className={styles.body}>
                    <RequirementDetails />
                    <div className={styles.right}>
                        {auditRejectDesc && (
                            <div className={styles.rejectTips}>
                                <div className={styles.rejectTitle}>
                                    <InfoCircleFilled
                                        className={styles.tipIcon}
                                    />
                                    {__('驳回')}
                                </div>
                                <div className={styles.rejectText}>
                                    <TextAreaView
                                        initValue={htmlDecodeByRegExp(
                                            auditRejectDesc,
                                        )}
                                        rows={1}
                                        placement="end"
                                    />
                                </div>
                            </div>
                        )}

                        {getTitle('资源分析')}
                        <AnalysisTable
                            data={analyseItems}
                            setData={updateData}
                            originalItems={originalItems}
                            initExpandedShopKeys={expandedShopKeys}
                            initExpandedBlankKeys={expandedBlankKeys}
                        />
                        {getTitle('分析结论')}
                        <AnalysisConclusion
                            form={form}
                            conclusionInfo={conclusionInfo}
                            setIsChanged={setIsChanged}
                        />
                    </div>
                </div>
            </div>
            {mode === OperateType.DETAIL ? null : (
                <div className={styles.footer}>
                    <Space size={12}>
                        <Button onClick={returnToDemandList}>取消</Button>
                        <Button
                            onClick={() =>
                                updateAnalysisData(SaveOrSubmit.SAVE)
                            }
                        >
                            保存
                        </Button>
                        <Button
                            type="primary"
                            onClick={() =>
                                updateAnalysisData(SaveOrSubmit.SUBMIT)
                            }
                        >
                            提交
                        </Button>
                    </Space>
                </div>
            )}
        </div>
    )
}

export default Analysis
