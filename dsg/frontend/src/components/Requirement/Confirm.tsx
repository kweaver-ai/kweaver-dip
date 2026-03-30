import {
    Button,
    Divider,
    Form,
    Input,
    message,
    Modal,
    Space,
    Switch,
} from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'
import { trim } from 'lodash'
import {
    ErrorInfo,
    getActualUrl,
    keyboardCharactersReg,
    OperateType,
    useQuery,
} from '@/utils'
import styles from './styles.module.less'
import RequirementDetails from '../RequirementAnalysis/RequirementDetails'
import AnalysisTable from '../RequirementAnalysis/AnalysisTable'
import {
    formatError,
    getDemandAnalyseInfo,
    IDemandItemConfig,
    IUpdateDemandConfirm,
    updateDemandConfirm,
} from '@/core'
import { AuditResult, PageType, ResourceSource } from './const'
import __ from './locale'
import ApplicationMaterials from './ApplicationMaterials'
import ResourceDetails from './ResourceDetails'
import GlobalMenu from '../GlobalMenu'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'

const Confirm = () => {
    const navigate = useNavigate()
    const [form] = Form.useForm()
    // 分析项所有数据包括被修改过的数据
    const [analyseItems, setAnalyseItems] = useState<IDemandItemConfig[]>([])
    // 原始数据
    const [originalItems, setOriginalItems] = useState<IDemandItemConfig[]>([])

    const [expandedShopKeys, setExpandedShopKeys] = useState<string[]>([])
    const [expandedBlankKeys, setExpandedBlankKeys] = useState<string[]>([])

    const [isChanged, setIsChanged] = useState(false)
    const [viewInitDataChecked, setViewInitDataChecked] = useState(false)
    const [open, setOpen] = useState(false)
    const [auditResult, setAuditResult] = useState<AuditResult>(AuditResult.Yes)
    const [materials, setMaterials] = useState<any[]>([])
    const [isShowError, setIsShowError] = useState(false)

    const query = useQuery()
    // 编辑时获取的需求id
    const id = query.get('id') || ''
    // 模式： 详情模式
    const mode = query.get('mode')

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
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (id) {
            getAnalyse(id)
        }
    }, [id])

    const handleReturn = () => {
        navigate(`/dataService/requirement/list`)
    }

    const returnToDemandList = () => {
        if (materials?.length > 0) {
            ReturnConfirmModal({
                content: __('离开后上传的文件将不被保存。'),
                onCancel: () => {
                    handleReturn()
                },
            })
        } else {
            handleReturn()
        }
    }

    const getTitle = (title: string, isShowViewInitData = false) => {
        return (
            <div className={styles.titleWrapper}>
                <div className={styles.leftContent}>
                    <div className={styles.titleLine} />
                    <div className={styles.title}>{title}</div>
                </div>
                {isShowViewInitData && (
                    <div className={styles.viewInitWrapper}>
                        <span className={styles.viewInitText}>
                            {__('查看初始需求资源')}
                        </span>
                        <Switch
                            checked={viewInitDataChecked}
                            onChange={(e) => setViewInitDataChecked(e)}
                            size="small"
                        />
                    </div>
                )}
            </div>
        )
    }

    const getMaterials = (files) => {
        setMaterials(files)
    }

    const handleAgree = () => {
        // 缺少申请材料时，提示上传文件
        let isSetError = false
        const owners: string[] = []
        materials.forEach((m) => {
            if (!m.file.id) {
                isSetError = true
                owners.push(m.data_owner_name)
            }
        })
        if (isSetError) {
            setIsShowError(true)
            message.error(
                __('申请材料中未找到${owners}需要的文件，请先上传文件', {
                    owners: owners.join('、'),
                }),
            )
            return
        }
        setAuditResult(AuditResult.Yes)
        setOpen(true)
    }

    const onFinish = async (values) => {
        const params = {
            apply_file_items: materials.map((m) => {
                return {
                    code: m.data_owner_code,
                    reference_files: m.file.id ? [m.file] : [],
                }
            }),
            audit_result: auditResult,
            audit_result_desc: values.audit_result_desc,
            demand_id: id,
        }
        try {
            await updateDemandConfirm(params)
            message.success(__('需求已确认，已提交至下一环节'))
            handleReturn()
        } catch (error) {
            formatError(error)
        }
    }
    return (
        <div className={styles.confirmWrapper}>
            <div className={styles.header}>
                <GlobalMenu />
                <div onClick={returnToDemandList} className={styles.returnInfo}>
                    <LeftOutlined className={styles.returnArrow} />
                    <span className={styles.returnText}>{__('返回')}</span>
                </div>
                <Divider className={styles.divider} type="vertical" />
                <div className={styles.createTitle}>{__('需求确认')}</div>
            </div>
            <div
                className={classNames({
                    [styles.bodyWrapper]: true,
                })}
            >
                <div className={styles.body}>
                    <RequirementDetails />
                    <div className={styles.right}>
                        {getTitle(
                            viewInitDataChecked
                                ? __('初始资源配置')
                                : __('资源分析结果'),
                            true,
                        )}
                        {viewInitDataChecked ? (
                            <ResourceDetails id={id} />
                        ) : (
                            <AnalysisTable
                                data={analyseItems}
                                setData={() => {}}
                                originalItems={originalItems}
                                initExpandedShopKeys={expandedShopKeys}
                                initExpandedBlankKeys={expandedBlankKeys}
                                pageType={PageType.APPLY}
                                operateWidth={190}
                            />
                        )}
                        {getTitle(__('申请材料'))}
                        <ApplicationMaterials
                            demandId={id}
                            getMaterials={getMaterials}
                            showError={isShowError}
                        />
                    </div>
                </div>
                <div className={styles.footer}>
                    <Space size={12}>
                        <Button onClick={returnToDemandList}>
                            {__('关闭')}
                        </Button>
                        <Button
                            onClick={() => {
                                setAuditResult(AuditResult.No)
                                setOpen(true)
                            }}
                        >
                            {__('驳回')}
                        </Button>
                        <Button type="primary" onClick={handleAgree}>
                            {__('同意')}
                        </Button>
                    </Space>
                </div>
            </div>
            <Modal
                title={
                    auditResult === AuditResult.Yes
                        ? __('同意说明')
                        : __('驳回说明')
                }
                open={open}
                onOk={() => form.submit()}
                onCancel={() => {
                    form.setFieldsValue({ audit_result_desc: '' })
                    setOpen(false)
                }}
                width={592}
            >
                <Form form={form} onFinish={onFinish} layout="vertical">
                    <Form.Item
                        label={__('说明内容')}
                        name="audit_result_desc"
                        required
                        rules={[
                            {
                                required: true,
                                transform: (val) => trim(val),
                                message: ErrorInfo.NOTNULL,
                            },
                            {
                                pattern: keyboardCharactersReg,
                                message: ErrorInfo.EXCEPTEMOJI,
                            },
                        ]}
                    >
                        <Input.TextArea
                            placeholder={__('请输入说明内容')}
                            style={{ height: 130, resize: 'none' }}
                            maxLength={800}
                            showCount
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default Confirm
