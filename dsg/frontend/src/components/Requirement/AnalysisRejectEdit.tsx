import { Button, Divider, Form, message, Space, Tooltip } from 'antd'

import {
    InfoCircleFilled,
    LeftOutlined,
    ShrinkOutlined,
} from '@ant-design/icons'
import classnames from 'classnames'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    editDemand,
    formatError,
    getDemandAnalyseInfo,
    getDemandItems,
    IAnalysesConclusion,
    IDemandItemConfig,
} from '@/core'
import { AdoptOutlined, AnalysisOutlined, CloseOutlined } from '@/icons'
import { useQuery } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import GlobalMenu from '../GlobalMenu'
import AnalysisConclusion from '../RequirementAnalysis/AnalysisConclusion'
import AnalysisTable from '../RequirementAnalysis/AnalysisTable'
import { PageType, ResourceSource, SaveOrSubmit } from './const'
import CreateResourceConfig from './CreateResourceConfig'
import __ from './locale'
import styles from './styles.module.less'

const AnalysisRejectEdit = () => {
    const query = useQuery()
    // 编辑时获取的需求id
    const id = query.get('id')
    const navigate = useNavigate()
    const [form] = Form.useForm()
    // 分析项所有数据包括被修改过的数据
    const [analyseItems, setAnalyseItems] = useState<IDemandItemConfig[]>([])
    // 原始数据
    const [originalItems, setOriginalItems] = useState<IDemandItemConfig[]>([])

    const [expandedShopKeys, setExpandedShopKeys] = useState<string[]>([])
    const [expandedBlankKeys, setExpandedBlankKeys] = useState<string[]>([])

    const [conclusionInfo, setConclusionInfo] = useState<IAnalysesConclusion>()
    const [isShrink, setIsShrink] = useState(false)
    const [tipShow, setTipShow] = useState(true)
    const [items, setItems] = useState<IDemandItemConfig[]>([])
    const [saveOrSubmit, setSaveOrSubmit] = useState<SaveOrSubmit>(
        SaveOrSubmit.SAVE,
    )
    const [isContentChanged, setIsContentChanged] = useState(false)
    const [isHiddenResourceInfo, setIsHiddenResourceInfo] = useState(false)

    const getAnalyse = async (demandId: string) => {
        try {
            const { analyse_items, original_items, ...rest } =
                await getDemandAnalyseInfo(demandId)
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
        } catch (err) {
            formatError(err)
        }
    }

    // 编辑时查资源信息
    const getItems = async () => {
        try {
            if (id) {
                const res = await getDemandItems(id)
                setItems(res.entries)
            }
        } catch (err) {
            formatError(err)
        }
    }

    useEffect(() => {
        if (id) {
            getAnalyse(id)
            getItems()
        }
    }, [id])

    const handleReturn = () => {
        navigate(`/dataService/requirement/list`)
    }

    const returnToDemandList = () => {
        if (isContentChanged) {
            confirm({
                title: __('内容有变更'),
                // icon: <ExclamationCircleFilled style={{ color: '#f5222d' }} />,
                content: __('内容发生变更，是否保存后再离开？'),
                onOk() {},
                onCancel() {
                    handleReturn()
                },
                okText: __('保存并离开'),
                cancelText: __('仅离开'),
            })
        } else {
            handleReturn()
        }
    }

    const getTitle = (
        title: string,
        isNeedAdopt = false,
        isNeedBack = false,
    ) => {
        return (
            <div
                className={classnames(
                    styles.titleWrapper,
                    isNeedBack && styles.titleWrapperWithBack,
                )}
            >
                <div className={styles.leftContent}>
                    <div className={styles.titleLine} />
                    <div className={styles.title}>{title}</div>
                </div>
                {isNeedAdopt && (
                    <div
                        className={styles.adopt}
                        onClick={() => {
                            setItems(
                                analyseItems
                                    .filter(
                                        (item) =>
                                            item.has_resource !== 1 &&
                                            item.apply_status !== 1,
                                    )
                                    .map((item) => {
                                        return { ...item, id: '' }
                                    }),
                            )
                            message.success(__('采纳成功'))
                        }}
                    >
                        <AdoptOutlined className={styles.adoptIcon} />
                        {__('一键采纳')}
                    </div>
                )}
            </div>
        )
    }

    const handleSave = () => {
        setSaveOrSubmit(SaveOrSubmit.SAVE)
        form.submit()
    }

    const handleSubmit = () => {
        setSaveOrSubmit(SaveOrSubmit.SUBMIT)
        form.submit()
    }

    const onFinish = async (values) => {
        if (!id) return
        const params = {
            items: [...(values.assetsRes || []), ...(values.blankRes || [])],
            save_op_type: saveOrSubmit,
        }
        try {
            await editDemand(id, { ...params })
            message.success(
                saveOrSubmit === SaveOrSubmit.SAVE
                    ? __('保存成功')
                    : __('提交成功'),
            )
            navigate(`/dataService/requirement/list`)
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <div className={classnames(styles.analysisRejectEditWrapper)}>
            <div className={styles.header}>
                <GlobalMenu />
                <div onClick={returnToDemandList} className={styles.returnInfo}>
                    <LeftOutlined className={styles.returnArrow} />
                    <span className={styles.returnText}>{__('返回')}</span>
                </div>
                <Divider className={styles.divider} type="vertical" />
                <div className={styles.createTitle}>{__('编辑需求')}</div>
            </div>
            <div className={styles.bodyWrapper}>
                <div className={styles.body}>
                    {isShrink ? (
                        <Tooltip title={__('需求分析结果')} placement="bottom">
                            <div
                                onClick={() => setIsShrink(!isShrink)}
                                className={styles.shrinkDetails}
                            >
                                <AnalysisOutlined
                                    className={styles.detailsIcon}
                                />
                                <span className={styles.detailTitle}>
                                    {__('分析')}
                                </span>
                            </div>
                        </Tooltip>
                    ) : (
                        <div className={styles.left}>
                            <div className={styles.shrinkIconWrapper}>
                                <ShrinkOutlined
                                    onClick={() => setIsShrink(!isShrink)}
                                />
                            </div>
                            {getTitle(__('资源分析'), true)}
                            <AnalysisTable
                                data={analyseItems}
                                setData={() => {}}
                                originalItems={originalItems}
                                initExpandedShopKeys={expandedShopKeys}
                                initExpandedBlankKeys={expandedBlankKeys}
                                pageType={PageType.APPLY}
                                isShowPreviewResource={false}
                                operateWidth={80}
                            />
                            {getTitle(__('分析结论'), false)}
                            <AnalysisConclusion
                                form={form}
                                conclusionInfo={conclusionInfo}
                                setIsChanged={setIsContentChanged}
                                pageType={PageType.APPLY}
                            />
                        </div>
                    )}
                    <div className={styles.right}>
                        {getTitle(__('资源配置'), false, true)}
                        <div className={styles.tips} hidden={!tipShow}>
                            <div className={styles.infoWrapper}>
                                <InfoCircleFilled className={styles.tipIcon} />
                                <div>
                                    {__(
                                        '您可以通过左侧资源分析结果中「一键采纳」接受分析员的资源配置建议，也可以在此基础上做调整后再提交申请',
                                    )}
                                </div>
                            </div>
                            <CloseOutlined
                                className={styles.closeIcon}
                                onClick={() => setTipShow(false)}
                            />
                        </div>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            autoComplete="off"
                            // onValuesChange={onValuesChange}
                            className={styles.formContent}
                            scrollToFirstError
                        >
                            <CreateResourceConfig
                                form={form}
                                setIsRequiredInfoFilledOver={() => {}}
                                itemsInfo={items}
                                setIsContentChanged={setIsContentChanged}
                                isShowTitle={false}
                                isHidden={isHiddenResourceInfo}
                                setIsHidden={setIsHiddenResourceInfo}
                            />
                        </Form>
                    </div>
                </div>
                <div className={styles.footer}>
                    <Space>
                        <Button onClick={returnToDemandList}>
                            {__('取消')}
                        </Button>
                        <Button onClick={handleSave}>{__('保存')}</Button>
                        <Button type="primary" onClick={handleSubmit}>
                            {__('提交')}
                        </Button>
                    </Space>
                </div>
            </div>
        </div>
    )
}

export default AnalysisRejectEdit
