/* eslint-disable no-param-reassign */
import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react'
import { Form, Modal, TreeSelect, Select, message } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import { trim } from 'lodash'
import styles from './styles.module.less'
import { GlossaryType, optionType } from './const'
import {
    formatError,
    getGlossaryTree,
    getAllTerms,
    addTermsRelation,
    moveCategories,
} from '@/core'
import __ from '../BusinessDomain/locale'
import { GlossaryMgmtIcons } from '../BusinessDomain/GlossaryIcons'

interface IMoveModal {
    ref?: any
    type?: GlossaryType
    optionsType: optionType
    currentData?: any
    relationType?: string
    onOk?: () => void
}
const MoveModal: React.FC<IMoveModal> = forwardRef((props: any, ref) => {
    const { type, currentData = {}, optionsType, onOk, relationType } = props
    const [open, setOpen] = useState<boolean>(false)
    const [modalTitle, setModalTitle] = useState<string>('移动至')
    const [form] = Form.useForm()
    const [treeNode, setTreeNode] = useState<any>()
    const [disabledMoveOkBtn, setDisabledMoveOkBtn] = useState(false)
    const [treeList, setTreeList] = useState<any[]>([])
    const [allTermsList, setAllTermsList] = useState<any[]>([])
    const [treeSelectSearchVal, setTreeSelectSearchVal] = useState<string>('')
    const [searchOwnerValue, setSearchOwnerValue] = useState('')

    useImperativeHandle(ref, () => ({
        setOpen,
    }))

    useEffect(() => {
        if (open) {
            if (optionsType === optionType.Move) {
                getTreeList()
            } else {
                getAllTermsList()
            }
        }
    }, [optionsType, open])

    useEffect(() => {
        if (open) {
            setModalTitle(
                optionsType === optionType.Move
                    ? __('移动至')
                    : __('添加关联术语'),
            )
        } else {
            form.resetFields()
        }
    }, [open])

    const getTreeList = async () => {
        try {
            const res = await getGlossaryTree({
                glossary_id: currentData.glossary_id,
                exclude: 'term',
            })
            setTreeList(generateTreeData(res?.entries))
        } catch (err) {
            formatError(err)
        }
    }

    const generateTreeData = (data: any[]) => {
        data.forEach((item: any) => {
            // 增加图标
            item.title = getTreeNodeName(item)
            // 禁用移动的自身节点
            item.disabled = item.content_id === currentData.content_id
            // 自身节点改为叶子节点，不能展开
            if (item.content_id === currentData.content_id) {
                item.isLeaf = true
            }
            if (item.children) {
                generateTreeData(item.children)
            }
        })
        return data
    }

    const getTreeNodeName = (data: any) => {
        return (
            <div className={styles.treeNodeBox}>
                <div className={styles.treeNodetext}>
                    <span style={{ marginRight: '5px' }}>
                        <GlossaryMgmtIcons type={data.type} showDot={false} />
                    </span>
                    <span title={data.name}>{data.name}</span>
                </div>
            </div>
        )
    }

    const getAllTermsList = async () => {
        try {
            const res = await getAllTerms(currentData.glossary_id)
            setAllTermsList(
                res?.entries?.filter((item) => item.id !== currentData.id),
            )
        } catch (err) {
            formatError(err)
        }
    }

    const onFinish = async (values: any) => {
        try {
            let actions: any
            const obj: any = {
                ...values,
            }
            switch (optionsType) {
                case optionType.Move:
                    actions = moveCategories
                    obj.id = currentData.content_id
                    obj.dest_parent_id = treeNode?.content_id
                    break
                case optionType.AddRelation:
                    actions = addTermsRelation
                    obj.type = relationType
                    obj.term_id = currentData.id
                    break
                default:
                    actions = null
            }
            await actions(obj)
            message.success(
                `${
                    optionsType === optionType.Move
                        ? __('移动成功')
                        : __('添加成功')
                }`,
            )
            setOpen(false)
            onOk()
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <div className={styles.modalWrapper}>
            <Modal
                title={modalTitle}
                open={open}
                onCancel={() => setOpen(false)}
                width={800}
                onOk={() => form.submit()}
                destroyOnClose
                okButtonProps={{ disabled: disabledMoveOkBtn }}
                maskClosable={false}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    {optionsType === optionType.Move && (
                        <Form.Item
                            name="dest_parent_id"
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择需要移动至的位置'),
                                },
                            ]}
                        >
                            <>
                                <div style={{ marginBottom: '10px' }}>
                                    {`${__('您可以将')}"${
                                        currentData?.name
                                    }"${__('移至以下选中的下面')}`}
                                    {!!treeNode?.id}
                                </div>
                                <TreeSelect
                                    showSearch
                                    style={{ width: '100%' }}
                                    dropdownStyle={{
                                        maxHeight: 400,
                                        overflow: 'auto',
                                    }}
                                    fieldNames={{
                                        label: 'title',
                                        value: 'content_id',
                                        children: 'children',
                                    }}
                                    placeholder={`${__('请选择')}`}
                                    allowClear
                                    // treeDefaultExpandAll
                                    onSelect={(key, node) => {
                                        form.setFieldValue(
                                            'dest_parent_id',
                                            key,
                                        )
                                        setTreeNode(node)
                                    }}
                                    onChange={(key) =>
                                        setDisabledMoveOkBtn(!key)
                                    }
                                    treeData={treeList}
                                    treeNodeFilterProp="name"
                                    popupClassName={styles.selectTreeBox}
                                    // treeWrapper
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                    switcherIcon={<DownOutlined />}
                                    // onSearch={setTreeSelectSearchVal}
                                    onSearch={(val) => {
                                        setTreeSelectSearchVal(trim(val))
                                    }}
                                    notFoundContent={
                                        <div
                                            style={{
                                                color: 'rgba(0, 0, 0, 0.85)',
                                                marginLeft: '5px',
                                            }}
                                        >
                                            {treeSelectSearchVal
                                                ? __('未找到匹配的结果')
                                                : __('暂无数据')}
                                        </div>
                                    }
                                />
                            </>
                        </Form.Item>
                    )}
                    {optionsType === optionType.AddRelation && (
                        <Form.Item
                            label={__('术语名称')}
                            validateFirst
                            name="target_id"
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择'),
                                },
                            ]}
                        >
                            <Select
                                options={allTermsList}
                                fieldNames={{
                                    label: 'name',
                                    value: 'id',
                                }}
                                searchValue={searchOwnerValue}
                                onSearch={(value) =>
                                    setSearchOwnerValue(value.substring(0, 128))
                                }
                                optionFilterProp="name"
                                showSearch
                                mode="multiple"
                                allowClear
                                placeholder={__('请选择术语')}
                                getPopupContainer={(node) => node.parentNode}
                                notFoundContent={
                                    <div className={styles.notFoundContent}>
                                        {searchOwnerValue
                                            ? __('未找到匹配的结果')
                                            : __('暂无数据')}
                                    </div>
                                }
                            />
                        </Form.Item>
                    )}
                </Form>
            </Modal>
        </div>
    )
})
export default MoveModal
