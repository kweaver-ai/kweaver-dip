import React, { FC, useState, useEffect, useRef, useMemo } from 'react'
import {
    Button,
    Drawer,
    Form,
    Space,
    Input,
    message,
    Modal,
    Select,
    Row,
    Col,
    Radio,
    Anchor,
    TreeSelect,
    Spin,
} from 'antd'
import { noop, set, trim } from 'lodash'
import { Rule } from 'antd/es/form'
import { LeftOutlined } from '@ant-design/icons'
import { RowSelectionType } from 'antd/lib/table/interface'
import { useUpdateEffect } from 'ahooks'
import styles from './styles.module.less'
import __ from './locale'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import { commReg, ErrorInfo, OperateType, validateEmpty } from '@/utils'
import {
    CatalogType,
    createCodeRule,
    updateCodeRule,
    IDirItem,
    IDirQueryType,
    formatError,
    ICRuleItem,
    getCodeRuleDetails,
    checkCodeRuleName,
    getDirDataByTypeOrId,
    IDataItem,
    getCodeRuleReletionFilesInfo,
    getCodeTableByIds,
    CatalogOption,
} from '@/core'
import EditDirModal from '../Directory/EditDirModal'
import { RuleCustomType, RuleMethod, StandardSort } from './const'
import CustomRuleComponet from './CustomRuleComponet'
import SelDataByTypeModal from '../SelDataByTypeModal'
import FileDetails from '../File/Details'
import DepartmentAndOrgSelect from '../DepartmentAndOrgSelect'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface TitleBarType {
    title: string
}
const TitleBar = ({ title }: TitleBarType) => {
    return (
        <div className={styles.titleBar}>
            <div className={styles.tilte}>{title}</div>
        </div>
    )
}

interface EditCodeRuleType {
    visible: boolean
    onClose: () => void
    showShadow?: boolean
    contentWrapperStyle?: React.CSSProperties
    operateType?: OperateType
    editData?: ICRuleItem
    updateCodeRuleList?: (ruleInfo: any, newDir?: any) => void
    selectTreeNode?: any
}
const EditCodeRule: FC<EditCodeRuleType> = ({
    visible,
    onClose,
    showShadow = true,
    contentWrapperStyle = {
        width: '100%',
        boxShadow: 'none',
    },
    operateType = OperateType.CREATE,
    editData,
    updateCodeRuleList = noop,
    selectTreeNode,
}) => {
    const [form] = Form.useForm()
    const [info] = useCurrentUser()
    const dirRef: any = useRef(null)
    const [hasChange, setHasChange] = useState<boolean>(false)
    // 编辑目录对话框
    const [editDirVisible, setEditDirVisible] = useState(false)
    const [ruleMethod, setRuleMethod] = useState<RuleMethod>(RuleMethod.Regular)
    const [treeDataLoading, setTreeDataLoading] = useState<boolean>(true)
    const [selectTreeData, setSelectTreeData] = useState<Array<any>>([])
    // 文件详情
    const [fileDetailVisible, setFileDetailVisible] = useState<boolean>(false)
    // 文件id
    const [detailId, setDetailId] = useState<string>('')

    const container = useRef<any>(null)
    // 编辑选择数据对话框（用于码表/编码规则/标准文件的选择对话框）
    const [selDataByTypeVisible, setSelDataByTypeVisible] = useState(false)
    const { Link } = Anchor
    const ruleRef: any = useRef(null)
    const [selDataItems, setSelDataItems] = useState<IDataItem[]>([])

    // 选择数据对话框ref
    const selDataRef = useRef({
        reloadData: () => {},
    })

    useEffect(() => {
        setHasChange(false)
        getDirTreeData()
    }, [visible])

    const useFirstDepartmentId = useMemo(() => {
        const firstDepartmentId = info?.ParentDeps?.[0]?.path_id.split('/')
        return firstDepartmentId[firstDepartmentId.length - 1]
    }, [info])

    useEffect(() => {
        if (operateType === OperateType.CREATE) {
            if (selectTreeNode) {
                if (selectTreeNode.treeType !== CatalogOption.DEPARTMENT) {
                    if (
                        selectTreeNode.treeType === CatalogOption.AUTOCATLG &&
                        selectTreeNode.level > 1
                    ) {
                        form.setFieldValue('catalog_id', selectTreeNode.id)
                    }
                    if (
                        selectTreeNode.treeType ===
                            CatalogOption.STDFILECATLG &&
                        selectTreeNode.stdFileCatlgType === 'file'
                    ) {
                        form.setFieldValue('std_files', [
                            {
                                key: selectTreeNode.id,
                                label: selectTreeNode.catalog_name,
                                value: selectTreeNode.catalog_name,
                            },
                        ])
                    }
                } else {
                    form.setFieldValue('catalog_id', '33')
                    form.setFieldValue(
                        'department_ids',
                        selectTreeNode.id || useFirstDepartmentId,
                    )
                }
            } else {
                form.setFieldValue('catalog_id', '33')
                form.setFieldValue(
                    'department_ids',
                    useFirstDepartmentId || undefined,
                )
            }

            form.setFieldsValue({
                department_ids:
                    selectTreeNode?.treeType === CatalogOption.DEPARTMENT
                        ? selectTreeNode?.id || useFirstDepartmentId
                        : useFirstDepartmentId,
            })
        }
    }, [selectTreeNode, operateType, useFirstDepartmentId])

    useEffect(() => {
        let selFiles
        if (selDataByTypeVisible) {
            selFiles = form.getFieldValue('std_files')
            setSelDataItems(selFiles || [])
        }
    }, [selDataByTypeVisible])

    useUpdateEffect(() => {
        form.setFieldValue('std_files', selDataItems)
    }, [selDataItems])

    useEffect(() => {
        if (editData) {
            setEditDataInForm(editData.id)
        }
    }, [editData])

    const setEditDataInForm = async (id) => {
        try {
            const detail = await getCodeRuleDetails(id)
            const { custom, std_files, rule_type, ...rest } = detail.data
            setRuleMethod(rule_type as RuleMethod)
            if (rule_type === RuleMethod.Regular) {
                const stdFilesData = await getCodeRuleReletionFilesInfo(id, {
                    limit: 999,
                    offset: 1,
                })
                form.setFieldsValue({
                    ...rest,
                    std_files:
                        stdFilesData?.data?.map((currentData) => ({
                            key: currentData.id,
                            label: currentData.name,
                            value: currentData.name,
                        })) || [],
                })
            } else {
                const codeTableIds: Array<string> =
                    custom?.reduce((preData: Array<string>, currentData) => {
                        if (currentData.type === RuleCustomType.CodeTable) {
                            return [...preData, currentData.value]
                        }
                        return preData
                    }, []) || []

                const [stdFilesData, codeTableInfos] = await Promise.all([
                    getCodeRuleReletionFilesInfo(id, {
                        limit: 999,
                        offset: 1,
                    }),
                    codeTableIds.length
                        ? getCodeTableByIds(codeTableIds)
                        : Promise.resolve([]),
                ])
                const newCustom =
                    custom?.map((currentData) => {
                        if (currentData.type === RuleCustomType.CodeTable) {
                            const currentTableInfo = codeTableInfos?.data?.find(
                                (codeTableinfo) =>
                                    codeTableinfo.id === currentData.value,
                            )
                            return {
                                ...currentData,
                                value: [
                                    {
                                        key: currentData.value,
                                        label: currentTableInfo?.ch_name,
                                        value: currentTableInfo?.ch_name,
                                    },
                                ],
                            }
                        }
                        return currentData
                    }) || []
                form.setFieldsValue({
                    ...rest,
                    std_files:
                        stdFilesData?.data?.map((currentData) => ({
                            key: currentData.id,
                            label: currentData.name,
                            value: currentData.name,
                        })) || [],
                    custom: newCustom,
                    department_ids: editData?.department_id,
                })
            }
        } catch (ex) {
            formatError(ex)
        }
    }

    const getDirTreeData = async () => {
        try {
            setTreeDataLoading(true)
            const { data } = await getDirDataByTypeOrId(3)
            // if (data[0] && data[0]?.children?.length) {
            //     const optionsData = data[0]?.children
            //         ? combTreeData(data[0].children)
            //         : []
            //     setSelectTreeData(optionsData)
            // }
            setSelectTreeData(data?.length ? combTreeData(data) : [])
        } catch (ex) {
            formatError(ex)
        } finally {
            setTreeDataLoading(false)
        }
    }

    const combTreeData = (treeNodes) => {
        return treeNodes.map((currentNode) => {
            if (currentNode?.children) {
                return {
                    value: currentNode.id,
                    title: currentNode.catalog_name,
                    children: combTreeData(currentNode.children),
                }
            }
            return {
                value: currentNode.id,
                title: currentNode.catalog_name,
            }
        })
    }

    const handleValueChange = (changedValue, values) => {
        setHasChange(true)
    }

    const getRules = (
        required: boolean,
        regExp: RegExp,
        regExpMessage: string = ErrorInfo.EXTENDCNNAME,
    ) => {
        const rules: Rule[] = []
        if (required) {
            rules.push({
                required: true,
                transform: (value: string) => trim(value),
                message: ErrorInfo.NOTNULL,
            })
        }
        // if (regExp) {
        //     rules.push({
        //         pattern: regExp,
        //         message: regExpMessage,
        //         transform: (value: string) => trim(value),
        //     })
        // }

        return rules
    }

    /**
     * 展示详情页面（如编码规则/码表详情）
     * @param dataType 查看数据类型
     * @param dataId 查看的数据id
     */
    const handleShowDataDetail = (dataType: CatalogType, dataId?: string) => {
        const myDetailIds: any[] = []
        let firstId: string

        if (dataId) {
            //  处理单个/多个文件详情
            // if (dataId) {
            //     // 选择对话框中选择列表中码表查看详情
            //     myDetailIds = [{ key: dataId }]
            // } else {
            //     // form表单中查看详情
            //     myDetailIds = form.getFieldValue('file')
            // }
            // firstId = myDetailIds.length > 0 ? myDetailIds[0] : ''
            // if (myDetailIds.length && firstId !== '') {
            //     // setDetailIds(myDetailIds)
            //     setFileDetailVisible(true)
            // }
            setFileDetailVisible(true)
            setDetailId(dataId)
        }
    }

    // 名称重复校验
    const validateNameRepeat = async (value: string): Promise<void> => {
        const trimValue = trim(value)
        try {
            const res = await checkCodeRuleName(
                trimValue,
                operateType === OperateType.EDIT ? editData?.id : '',
            )
            return res.data
                ? Promise.reject(new Error(__('名称已存在，请重新输入')))
                : Promise.resolve()
        } catch (error) {
            return formatError({ error })
        }
    }

    const handleFinish = async (values) => {
        try {
            const { std_files, custom, ...rest } = values
            const ruglarConfig =
                ruleMethod === RuleMethod.Regular
                    ? {}
                    : {
                          custom: custom.map((currentData) => ({
                              ...currentData,
                              name: currentData.name || '',
                              value:
                                  currentData.type === RuleCustomType.CodeTable
                                      ? currentData.value.map(
                                            (codeTableInfo) =>
                                                codeTableInfo.key,
                                        )[0]
                                      : currentData.value || '',
                          })),
                      }
            let res
            if (OperateType.CREATE === operateType) {
                res = await createCodeRule({
                    ...rest,
                    std_files:
                        std_files?.map((currentData) => currentData.key) || [],
                    rule_type: ruleMethod,
                    ...ruglarConfig,
                })
                message.success(__('新建成功'))
            } else {
                res = await updateCodeRule(editData?.id || '', {
                    ...rest,
                    std_files:
                        std_files?.map((currentData) => currentData.key) || [],
                    rule_type: ruleMethod,
                    ...ruglarConfig,
                })
                message.success(__('编辑成功'))
            }
            updateCodeRuleList(res?.data, {
                id: rest.catalog_id,
            })
            onClose()
            form.resetFields()
        } catch (ex) {
            formatError(ex)
        }
    }

    return (
        <Drawer
            open={visible}
            onClose={() => {
                form.resetFields()
                onClose()
            }}
            push={{ distance: 0 }}
            contentWrapperStyle={
                contentWrapperStyle || {
                    width: '100%',
                    height: 'calc(100vh - 56px )',
                    boxShadow: 'none',
                    transform: 'none',
                    marginTop: '4px',
                }
            }
            headerStyle={{ display: 'none' }}
            bodyStyle={{
                padding: '16px 0 0',
                display: 'flex',
                flexDirection: 'column',
            }}
            style={{ position: 'absolute' }}
            destroyOnClose
            maskClosable={false}
            mask={false}
            getContainer={false}
        >
            <div className={styles.CreateIndicatorWrap}>
                {showShadow && <div className={styles.bodyShadow} />}
                <div className={styles.titleWrap}>
                    <div
                        className={styles.return}
                        onClick={() => {
                            if (hasChange) {
                                ReturnConfirmModal({
                                    onCancel: () => {
                                        form.resetFields()
                                        setHasChange(false)
                                        onClose()
                                    },
                                })
                            } else {
                                form.resetFields()
                                onClose()
                            }
                        }}
                    >
                        <LeftOutlined style={{ fontSize: 16 }} />
                        <span className={styles.returnText}>{__('返回')}</span>
                    </div>
                    <div className={styles.drawerTitle}>
                        {operateType === OperateType.CREATE
                            ? __('新建编码规则')
                            : __('编辑编码规则')}
                    </div>
                </div>
                <div className={styles.content} ref={container}>
                    <div className={styles.formContent}>
                        <Form
                            form={form}
                            onValuesChange={handleValueChange}
                            layout="vertical"
                            autoComplete="off"
                            onFinish={handleFinish}
                        >
                            <div id="component-rule-basic">
                                <TitleBar title={__('基本属性')} />
                            </div>
                            <Row gutter={48}>
                                <Col span={12}>
                                    <Form.Item
                                        label={__('编码规则名称')}
                                        name="name"
                                        validateTrigger={['onChange', 'onBlur']}
                                        validateFirst
                                        rules={[
                                            ...getRules(true, commReg),
                                            {
                                                validateTrigger: ['onBlur'],
                                                validator: (e, value) =>
                                                    validateNameRepeat(value),
                                            },
                                        ]}
                                    >
                                        <Input
                                            placeholder={__(
                                                '请输入编码规则名称',
                                            )}
                                            maxLength={128}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label={__('所属自定义目录')}
                                        name="catalog_id"
                                        required
                                        rules={[
                                            {
                                                validator:
                                                    validateEmpty(
                                                        '输入不能为空',
                                                    ),
                                            },
                                        ]}
                                    >
                                        <TreeSelect
                                            style={{ width: '100%' }}
                                            dropdownStyle={{
                                                maxHeight: 400,
                                                overflow: 'auto',
                                            }}
                                            getPopupContainer={(node) =>
                                                node.parentNode || node
                                            }
                                            placeholder={__(
                                                '请选择所属自定义目录',
                                            )}
                                            filterTreeNode
                                            allowClear
                                            showSearch
                                            treeNodeFilterProp="title"
                                            notFoundContent={
                                                treeDataLoading ? (
                                                    <Spin />
                                                ) : (
                                                    __('暂无数据')
                                                )
                                            }
                                            treeData={selectTreeData}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={48}>
                                <Col span={12}>
                                    <Form.Item
                                        label={__('所属组织结构')}
                                        name="department_ids"
                                        validateTrigger={['onChange', 'onBlur']}
                                        validateFirst
                                        required
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    __('请选择所属组织结构'),
                                            },
                                        ]}
                                    >
                                        <DepartmentAndOrgSelect
                                            placeholder={__(
                                                '请选择所属组织结构',
                                            )}
                                            defaultValue={
                                                editData?.department_id ||
                                                (selectTreeNode?.treeType ===
                                                CatalogOption.DEPARTMENT
                                                    ? selectTreeNode?.id ||
                                                      useFirstDepartmentId
                                                    : useFirstDepartmentId)
                                            }
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        label={__('关联标准文件')}
                                        name="std_files"
                                        validateTrigger={['onChange', 'onBlur']}
                                        validateFirst
                                    >
                                        <Select
                                            ref={ruleRef}
                                            labelInValue
                                            mode="tags"
                                            placeholder={__(
                                                '请选择关联标准文件',
                                            )}
                                            open={false}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSelDataByTypeVisible(true)
                                                ruleRef?.current?.blur()
                                            }}
                                            maxTagTextLength={10}
                                            maxTagCount={3}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={48}>
                                <Col span={12}>
                                    <Form.Item
                                        label={__('标准分类')}
                                        name="org_type"
                                        required
                                        rules={[
                                            {
                                                required: true,
                                                message: __('请选择标准分类'),
                                            },
                                        ]}
                                    >
                                        <Select
                                            placeholder={__('请选择标准分类')}
                                            options={StandardSort}
                                            getPopupContainer={(node) =>
                                                node.parentNode || node
                                            }
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item label={__('说明')} name="description">
                                <Input.TextArea
                                    placeholder={__('请输入说明')}
                                    className={styles.codeRuleDetail}
                                    showCount
                                    maxLength={300}
                                />
                            </Form.Item>

                            <div id="component-rule-code-rules">
                                <TitleBar title={__('编码规则')} />
                            </div>
                            <Radio.Group
                                onChange={(e) => {
                                    setRuleMethod(e.target.value)
                                }}
                                value={ruleMethod}
                                className={styles.codeRuleRadio}
                            >
                                <Radio value={RuleMethod.Regular}>
                                    {__('正则表达式')}
                                </Radio>
                                <Radio value={RuleMethod.Customer}>
                                    {__('自定义配置')}
                                </Radio>
                            </Radio.Group>
                            {ruleMethod === RuleMethod.Regular ? (
                                <Form.Item
                                    name="regex"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请输入正则表达式'),
                                        },
                                    ]}
                                >
                                    <Input.TextArea
                                        placeholder={__('请输入正则表达式')}
                                        className={styles.regxRuleDetail}
                                        showCount
                                        maxLength={800}
                                    />
                                </Form.Item>
                            ) : (
                                <CustomRuleComponet form={form} />
                            )}
                        </Form>
                    </div>
                    <div className={styles.archerContent}>
                        <Anchor
                            targetOffset={160}
                            getContainer={() =>
                                (container.current as HTMLElement) || window
                            }
                            onClick={(e: any) => e.preventDefault()}
                            className={styles.anchorWrapper}
                        >
                            <Link
                                href="#component-rule-basic"
                                title={__('基本属性')}
                            />
                            <Link
                                href="#component-rule-code-rules"
                                title={__('编码规则')}
                            />
                        </Anchor>
                    </div>
                </div>
                <div className={styles.footer}>
                    <Space>
                        <Button
                            className={styles.btn}
                            onClick={() => {
                                onClose()
                                form.resetFields()
                            }}
                        >
                            {__('取消')}
                        </Button>

                        <Button
                            type="primary"
                            className={styles.btn}
                            onClick={() => {
                                form.submit()
                            }}
                        >
                            {__('确定')}
                        </Button>
                    </Space>
                </div>

                {/* 选择码表/编码规则 */}
                <SelDataByTypeModal
                    visible={selDataByTypeVisible}
                    ref={selDataRef}
                    onClose={() => {
                        setSelDataByTypeVisible(false)
                    }}
                    onOk={() => {
                        form.validateFields(['std_files'])
                    }}
                    dataType={CatalogType.FILE}
                    rowSelectionType="checkbox"
                    oprItems={selDataItems}
                    setOprItems={setSelDataItems}
                    handleShowDataDetail={handleShowDataDetail}
                />
            </div>

            {/* 文件详情 */}
            {fileDetailVisible && !!detailId && (
                <FileDetails
                    visible={fileDetailVisible && !!detailId}
                    fileId={detailId}
                    onClose={() => setFileDetailVisible(false)}
                    getContainer={document.getElementById('root')}
                />
            )}
        </Drawer>
    )
}
export default EditCodeRule
