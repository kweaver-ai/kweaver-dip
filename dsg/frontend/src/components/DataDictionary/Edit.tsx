import { useState, useEffect, useRef } from 'react'
import { Drawer, Form, Input, Row, Col, Button, message, Radio } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { DragDropContext, Droppable } from 'react-beautiful-dnd'
import { Loader, ReturnConfirmModal } from '@/ui'
import {
    formatError,
    updateDataDict,
    getDataDictDetail,
    createDataDict,
} from '@/core'
import DictionaryItem from './DictionaryItem'
import {
    DetailGroupTitle,
    DrawerTitle,
    DrawerFooter,
    renderEmpty,
    DataDictionaryOperate,
    renderAnchor,
    getConfirmModal,
} from './helper'
import styles from './styles.module.less'
import __ from './locale'

interface IEdit {
    // 是否打开
    open: boolean
    // 数据
    item: any
    // 关闭
    onEditClose: () => void
    // 编辑成功
    onEditSuccess: () => void
}

const Edit = ({ open, item, onEditClose, onEditSuccess }: IEdit) => {
    const [form] = Form.useForm()
    const [details, setDetails] = useState<any>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const container = useRef<HTMLDivElement>(null)

    const initialValuesRef = useRef<any>(null)

    // 每次 open 或 item 变化时重新获取数据
    useEffect(() => {
        if (open && item) {
            getData()
        } else {
            // 当抽屉关闭时，重置表单和状态
            form.resetFields()
            setDetails(null)
        }
    }, [open, item])

    const getData = async () => {
        setLoading(true)
        try {
            const itemRes = await getDataDictDetail(item?.id)
            const { dict_resp, dict_item_resp } = itemRes
            const { name, description, sszd_flag, dict_type } = dict_resp

            // 保存初始值
            initialValuesRef.current = {
                name,
                description,
                items: dict_item_resp,
                sszd_flag,
                dict_type,
            }

            // 初始化表单
            form.setFieldsValue({
                name,
                description,
                items: dict_item_resp,
                sszd_flag,
                dict_type,
            })
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 提交
    const onFinish = async (values) => {
        if (
            JSON.stringify(values) === JSON.stringify(initialValuesRef.current)
        ) {
            // 如果没有变更，直接返回
            onEditSuccess()
            return
        }
        const { name, description, items, sszd_flag, dict_type } = values
        try {
            if (item?.id) {
                await updateDataDict({
                    dict_res: {
                        id: item?.id,
                        name,
                        dict_type,
                        description,
                        sszd_flag,
                    },
                    dict_item_res: items,
                })
                message.success(__('编辑成功'))
            } else {
                await createDataDict({
                    dict_res: {
                        name,
                        dict_type,
                        description,
                        sszd_flag,
                    },
                    dict_item_res: items,
                })
                message.success(__('新建成功'))
            }

            onEditSuccess()
        } catch (error) {
            const firstError = form
                .getFieldsError()
                .find(({ errors }) => errors.length)
            if (firstError?.name) {
                form.scrollToField(firstError.name)
            }
            formatError(error)
        }
    }

    // 返回
    const handleReturn = async () => {
        const currentValues = form.getFieldsValue()
        if (
            JSON.stringify(currentValues) ===
            JSON.stringify(initialValuesRef.current)
        ) {
            // 如果没有变更，直接返回
            onEditClose()
            return
        }

        ReturnConfirmModal({ onCancel: onEditClose })
    }

    // 点击提交按钮
    const handleClickSubmit = async () => {
        try {
            await form.validateFields()
            // 验证通过后的提交逻辑
            onFinish(form.getFieldsValue())
        } catch (error) {
            // 获取所有错误字段
            const errorFields = form.getFieldsError()
            // 找到第一个包含错误的字段
            const firstError = errorFields.find(({ errors }) => errors.length)

            if (firstError?.name) {
                // 如果错误字段在 Form.List 中，需要构造完整的字段路径
                // 比如 ['items', 0, 'dict_key']
                const fieldPath = Array.isArray(firstError.name)
                    ? firstError.name
                    : ['items', ...firstError.name]

                // 滚动到对应字段
                form.scrollToField(fieldPath, {
                    block: 'center', // 滚动到库表中间
                    behavior: 'smooth', // 平滑滚动
                })
            }
        }
    }

    const onDragEnd = (result) => {
        // 即使拖拽到区域外，也要确保释放
        document.body.style.cursor = 'default'

        const { destination, source } = result
        if (!destination) return

        const items = form.getFieldValue('items')
        const [removed] = items.splice(source.index, 1)
        items.splice(destination.index, 0, removed)

        form.setFieldsValue({ items })
    }

    const onDragStart = () => {
        // 开始拖拽时设置鼠标样式
        document.body.style.cursor = 'grabbing'
    }

    // 删除字典项
    const handleRemove = (remove: Function, index: number) => {
        const items = form.getFieldValue('items')
        // 如果只有一个字典项，则需要弹窗确认
        if (items.length === 1) {
            getConfirmModal({
                title: __('确认要删除吗？'),
                content: __(
                    '此字典如果关联必填项，删除后将导致相关功能无法正常使用，请谨慎操作。',
                ),
                onOk: () => remove(index),
            })
        } else {
            remove(index)
        }
    }

    const renderEmptyTip = () => {
        return renderEmpty({
            desc: (
                <div className={styles.emptyWrapper}>
                    <div>{__('暂无数据')}</div>
                    <div>{__('可点击下方按钮添加字典项')}</div>
                </div>
            ),
        })
    }

    return (
        <Drawer
            open={open}
            closable={false}
            width="100%"
            maskClosable={false}
            drawerStyle={{
                backgroundColor: '#e9e9ed',
                paddingBottom: '24px',
            }}
            headerStyle={{
                backgroundColor: '#fff',
            }}
            footerStyle={{
                backgroundColor: '#fff',
                margin: '0 24px',
                display: 'flex',
                justifyContent: 'end',
            }}
            bodyStyle={{
                backgroundColor: '#e9e9ed',
                padding: 0,
            }}
            title={
                <DrawerTitle
                    name={item ? __('编辑数据字典') : __('新建数据字典')}
                    onClose={handleReturn}
                />
            }
            footer={
                <DrawerFooter
                    onClose={handleReturn}
                    onSubmit={handleClickSubmit}
                />
            }
            destroyOnClose
        >
            <div className={styles.editFormWrapper} ref={container}>
                {loading ? (
                    <Loader />
                ) : (
                    <Form
                        name="edit"
                        form={form}
                        layout="vertical"
                        wrapperCol={{ span: 24 }}
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        autoComplete="off"
                        className={styles.editForm}
                    >
                        <div id="editBasic" className={styles.contentWrapper}>
                            <DetailGroupTitle title={__('基本属性')} />
                            <Row gutter={48}>
                                <Col span={24}>
                                    <Form.Item
                                        label={__('数据字典名称')}
                                        name="name"
                                        rules={[
                                            {
                                                required: true,
                                                message: __('输入不能为空'),
                                            },
                                            // {
                                            //     pattern: extendNameCnReg,
                                            //     message: __(
                                            //         '仅支持中英文、数字、下划线、中划线，且不能以下划线和中划线开头',
                                            //     ),
                                            // },
                                        ]}
                                    >
                                        <Input
                                            maxLength={128}
                                            placeholder={__('请输入')}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        label={__('字典类型')}
                                        name="dict_type"
                                        rules={[
                                            {
                                                required: true,
                                                message: __('输入不能为空'),
                                            },
                                            {
                                                pattern: /^[A-Za-z][A-Za-z-]*$/,
                                                message: __(
                                                    '仅支持字母和中划线，且不能以中划线开头',
                                                ),
                                            },
                                        ]}
                                    >
                                        <Input
                                            disabled={!!item?.id}
                                            maxLength={100}
                                            placeholder={__('请输入')}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        label={__('描述')}
                                        name="description"
                                    >
                                        <Input.TextArea
                                            style={{
                                                height: 100,
                                                resize: 'none',
                                            }}
                                            placeholder={__('请输入')}
                                            maxLength={512}
                                        />
                                    </Form.Item>
                                </Col>
                                {/* <Col span={24}>
                                    <Form.Item
                                        label={__('是否省市直达')}
                                        name="sszd_flag"
                                        initialValue={0}
                                    >
                                        <Radio.Group>
                                            <Radio value={1}>{__('是')}</Radio>
                                            <Radio value={0}>{__('否')}</Radio>
                                        </Radio.Group>
                                    </Form.Item>
                                </Col> */}
                            </Row>
                        </div>
                        <div id="editItems" className={styles.contentWrapper}>
                            <DetailGroupTitle title={__('字典项')} />
                            {form.getFieldValue('items')?.length > 0 && (
                                <Row gutter={24} style={{ marginBottom: 8 }}>
                                    <Col className={styles.tipCol} />
                                    <Col flex="1">
                                        <span className={styles.labelTitle}>
                                            <span className={styles.required}>
                                                *
                                            </span>
                                            {__('值')}
                                        </span>
                                    </Col>
                                    <Col className={styles.tipCol} />
                                    <Col flex="1">
                                        <span className={styles.labelTitle}>
                                            <span className={styles.required}>
                                                *
                                            </span>
                                            {__('名称')}
                                        </span>
                                    </Col>
                                    <Col className={styles.tipCol} />
                                    <Col flex="2">
                                        <span className={styles.labelTitle}>
                                            {__('描述')}
                                        </span>
                                    </Col>
                                    <Col className={styles.tipCol} />
                                </Row>
                            )}
                            <Form.List name="items">
                                {(fields, { add, remove }) => (
                                    <DragDropContext
                                        onDragEnd={onDragEnd}
                                        onDragStart={onDragStart}
                                    >
                                        <Droppable droppableId="dictionary-items">
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    style={{
                                                        minHeight: '100px', // 确保有足够的放置区域
                                                        padding: '8px 0', // 添加内边距
                                                    }}
                                                >
                                                    {fields.length > 0
                                                        ? fields.map(
                                                              (
                                                                  field,
                                                                  index,
                                                              ) => (
                                                                  <DictionaryItem
                                                                      key={
                                                                          field.key
                                                                      }
                                                                      field={
                                                                          field
                                                                      }
                                                                      remove={() =>
                                                                          handleRemove(
                                                                              remove,
                                                                              field.name,
                                                                          )
                                                                      }
                                                                      index={
                                                                          index
                                                                      }
                                                                  />
                                                              ),
                                                          )
                                                        : renderEmptyTip()}
                                                    {provided.placeholder}
                                                    <Form.Item>
                                                        <Button
                                                            type="dashed"
                                                            onClick={() =>
                                                                add()
                                                            }
                                                            block
                                                            icon={
                                                                <PlusOutlined />
                                                            }
                                                        >
                                                            {__('添加')}
                                                        </Button>
                                                    </Form.Item>
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                )}
                            </Form.List>
                        </div>
                    </Form>
                )}

                {renderAnchor({
                    container,
                    top: 120,
                    operate: DataDictionaryOperate.Edit,
                })}
            </div>
        </Drawer>
    )
}

export default Edit
