import classnames from 'classnames'
import { Form, Input, Row, Col } from 'antd'
import { MinusCircleOutlined, MenuOutlined } from '@ant-design/icons'
import { Draggable } from 'react-beautiful-dnd'
import { entendNameEnReg } from '@/utils'
import styles from './styles.module.less'
import __ from './locale'

const DictionaryItem = ({
    field,
    remove,
    index,
}: {
    field: any
    remove: (name: number) => void
    index: number
}) => (
    <Draggable draggableId={field.key.toString()} index={index}>
        {(provided, snapshot) => (
            <Row
                ref={provided.innerRef}
                {...provided.draggableProps}
                gutter={24}
                className={`${styles.dictionaryItemWrapper} ${
                    snapshot.isDragging ? styles.dragging : ''
                }`}
            >
                <Col
                    className={classnames(
                        styles.itemCol,
                        styles.itemDragHandle,
                    )}
                >
                    <MenuOutlined
                        {...provided.dragHandleProps}
                        title={__('拖拽排序')}
                        style={{ cursor: 'move', color: '#999' }}
                    />
                </Col>
                <Col flex="1">
                    <Form.Item
                        name={[field.name, 'dict_key']}
                        rules={[
                            {
                                required: true,
                                message: __('输入不能为空'),
                            },
                            // {
                            //     pattern: entendNameEnReg,
                            //     message: __(
                            //         '仅支持英文、数字、下划线、中划线，且不能以下划线和中划线开头',
                            //     ),
                            // },
                        ]}
                    >
                        <Input maxLength={64} placeholder={__('请输入值')} />
                    </Form.Item>
                </Col>
                <Col className={styles.itemCol}>-</Col>
                <Col flex="1">
                    <Form.Item
                        name={[field.name, 'dict_value']}
                        rules={[
                            {
                                required: true,
                                message: __('输入不能为空'),
                            },
                        ]}
                    >
                        <Input maxLength={64} placeholder={__('请输入名称')} />
                    </Form.Item>
                </Col>
                <Col className={styles.itemCol}>-</Col>
                <Col flex="2">
                    <Form.Item name={[field.name, 'description']}>
                        <Input maxLength={300} placeholder={__('请输入描述')} />
                    </Form.Item>
                </Col>
                <Col
                    className={classnames(styles.itemCol, styles.itemDeleteCol)}
                >
                    <MinusCircleOutlined
                        onClick={() => remove(field?.name)}
                        className={styles.itemDeleteIcon}
                        title={__('删除')}
                    />
                </Col>
            </Row>
        )}
    </Draggable>
)

export default DictionaryItem
