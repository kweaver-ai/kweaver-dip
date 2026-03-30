import { Col, Form, FormInstance, Input, Row, Select } from 'antd'
import React, { useEffect, useState } from 'react'
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons'
import {
    getObjects,
    IObject,
    ISystemItem,
    reqInfoSystemList,
    formatError,
} from '@/core'
import { Architecture } from '../BusinessArchitecture/const'
import { appDirections, relateScenes } from './const'
import styles from './styles.module.less'
import RelateBusinessMatters from './RelateBusinessMatters'
import { ErrorInfo, keyboardReg, nameReg } from '@/utils'
import __ from './locale'

interface ICreateRequirementScene {
    form: FormInstance<any>
    demandId: string
    selMatsIds?: string[]
}
const CreateRequirementScene: React.FC<ICreateRequirementScene> = ({
    form,
    demandId,
    selMatsIds,
}) => {
    const [systems, setSystems] = useState<ISystemItem[]>([])
    const [relateMattersOpen, setRelateMattersOpen] = useState(false)
    const [selectedMattersIds, setSelectedMattersIds] = useState<string[]>([])
    const [isHidden, setIsHidden] = useState(false)

    // 搜索全部的信息系统
    const getAllSystems = async () => {
        try {
            const res = await reqInfoSystemList({
                limit: 2000,
                offset: 1,
            })
            setSystems(res.entries)
        } catch (err) {
            formatError(err)
        }
    }

    useEffect(() => {
        getAllSystems()
    }, [])

    useEffect(() => {
        if (selMatsIds) {
            setSelectedMattersIds(selMatsIds)
        }
    }, [selMatsIds])

    const getSelectedMattersIds = (ids: string[]) => {
        setSelectedMattersIds(ids)
        form.setFieldsValue({
            rela_matter_ids: ids,
        })
    }

    return (
        <div className={styles.createInfo}>
            <div className={styles.titleWrapper}>
                {isHidden ? (
                    <CaretRightOutlined
                        className={styles.arrowIcon}
                        onClick={() => setIsHidden(!isHidden)}
                    />
                ) : (
                    <CaretDownOutlined
                        className={styles.arrowIcon}
                        onClick={() => setIsHidden(!isHidden)}
                    />
                )}
                <div className={styles.title}>{__('需求场景')}</div>
            </div>
            <Row
                gutter={44}
                hidden={isHidden}
                className={styles.contentWrapper}
            >
                <Col span={12}>
                    <Form.Item
                        label={__('应用方向分类')}
                        name="app_direction_id"
                    >
                        <Select
                            placeholder={__('请选择应用方向分类')}
                            getPopupContainer={(node) => node.parentNode}
                        >
                            {appDirections.map((t) => (
                                <Select.Option value={t.value} key={t.value}>
                                    {t.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label={__('业务应用场景')} name="rela_scene_ids">
                        <Select
                            placeholder={__('请选择业务应用场景')}
                            mode="tags"
                            searchValue=""
                            getPopupContainer={(node) => node.parentNode}
                        >
                            {relateScenes.map((t) => (
                                <Select.Option
                                    value={t.value.toString()}
                                    key={t.value}
                                >
                                    {t.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        label={__('关联信息系统')}
                        name="rela_business_system_id"
                    >
                        <Select
                            placeholder={__('请选择关联信息系统')}
                            getPopupContainer={(node) => node.parentNode}
                            showSearch
                            options={systems}
                            optionFilterProp="name"
                            fieldNames={{ label: 'name', value: 'id' }}
                            notFoundContent={
                                systems.length === 0
                                    ? __('暂无数据')
                                    : __('未找到匹配的结果')
                            }
                        />
                    </Form.Item>
                </Col>
                {/* <Col span={12}>
                    <Form.Item
                        label={__('业务应用领域')}
                        name="rela_domain_ids"
                    >
                        <Select
                            mode="tags"
                            placeholder={__('请选择业务应用领域')}
                            notFoundContent={__('暂无数据')}
                            searchValue=""
                            getPopupContainer={(node) => node.parentNode}
                        />
                    </Form.Item>
                </Col> */}
                <Col span={24}>
                    <Form.Item
                        label={__('预期产生应用价值')}
                        name="app_value"
                        rules={[
                            {
                                pattern: keyboardReg,
                                message: ErrorInfo.EXCEPTEMOJI,
                            },
                        ]}
                    >
                        <Input.TextArea
                            placeholder={__('请输入预期产生应用价值')}
                            maxLength={255}
                            className={styles.textArea}
                        />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        label={__('预期应用成效')}
                        name="app_effect"
                        rules={[
                            {
                                pattern: keyboardReg,
                                message: ErrorInfo.EXCEPTEMOJI,
                            },
                        ]}
                    >
                        <Input.TextArea
                            placeholder={__('请输入预期应用成效')}
                            maxLength={255}
                            className={styles.textArea}
                        />
                    </Form.Item>
                </Col>
            </Row>
            <RelateBusinessMatters
                open={relateMattersOpen}
                onClose={() => setRelateMattersOpen(false)}
                getSelectedMattersIds={getSelectedMattersIds}
                selectedMattersIds={selectedMattersIds}
            />
        </div>
    )
}

export default CreateRequirementScene
