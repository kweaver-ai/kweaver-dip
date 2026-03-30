import { Col, Form, FormInstance, Input, Row, Select } from 'antd'
import React, { useEffect, useState } from 'react'
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons'
import { getObjects, IObject, formatError } from '@/core'
import styles from './styles.module.less'
import UploadApplicationLetter from './UploadApplicationLetter'
import { Architecture } from '../BusinessArchitecture/const'
import {
    emailReg,
    ErrorInfo,
    keyboardCharactersReg,
    nameReg,
    phoneNumberReg,
    uniformCreditCodeReg,
    useQuery,
} from '@/utils'
import __ from './locale'

interface ICreateUnitInfo {
    form: FormInstance<any>
}
const CreateUnitInfo: React.FC<ICreateUnitInfo> = ({ form }) => {
    const [depts, setDepts] = useState<IObject[]>([])
    const [isHidden, setIsHidden] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    const query = useQuery()
    // 编辑时获取的需求id
    const id = query.get('id')
    const project = localStorage.getItem('project')

    // 获取申请部门
    const getDepts = async () => {
        try {
            const res = await getObjects({
                limit: 0,
                id: '',
                is_all: true,
                type: Architecture.DEPARTMENT,
            })
            setDepts(res.entries)
            // 创建时 部门默认选择列表第一个
            if (!id) {
                form.setFieldsValue({ dept_id: res.entries?.[0]?.id })
            }
        } catch (err) {
            formatError(err)
        }
    }

    useEffect(() => {
        getDepts()
    }, [])

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
                <div className={styles.title}>{__('部门信息')}</div>
            </div>
            <div hidden={isHidden} className={styles.contentWrapper}>
                <Row gutter={44}>
                    <Col span={12}>
                        <Form.Item
                            label={__('申请部门')}
                            name="dept_id"
                            required
                        >
                            <Select
                                placeholder={__('请选择申请部门')}
                                getPopupContainer={(node) => node.parentNode}
                                showSearch
                                searchValue={searchValue}
                                onSearch={(val) => setSearchValue(val)}
                                optionFilterProp="name"
                                notFoundContent={
                                    searchValue
                                        ? __('未找到匹配的结果')
                                        : __('暂无数据')
                                }
                                options={depts}
                                fieldNames={{ label: 'name', value: 'id' }}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={44}>
                    <Col span={12}>
                        <Form.Item
                            label={__('技术对接人姓名')}
                            name="tech_user_name"
                            required
                            rules={[
                                {
                                    pattern: keyboardCharactersReg,
                                    message: ErrorInfo.EXCEPTEMOJI,
                                },
                            ]}
                        >
                            <Input
                                placeholder={__('请输入技术对接人姓名')}
                                maxLength={128}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={__('技术对接人联系方式')}
                            name="tech_user_phone"
                            // required
                            rules={[
                                {
                                    pattern: phoneNumberReg,
                                    message: ErrorInfo.PHONENUMBER,
                                },
                            ]}
                        >
                            <Input
                                placeholder={__('请输入技术对接人联系方式')}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={__('分管领导姓名')}
                            name="dept_leader_name"
                            rules={[
                                {
                                    pattern: keyboardCharactersReg,
                                    message: ErrorInfo.EXCEPTEMOJI,
                                },
                            ]}
                        >
                            <Input
                                placeholder={__('请输入分管领导姓名')}
                                maxLength={128}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={__('领导职务')}
                            name="dept_leader_pos"
                            rules={[
                                {
                                    pattern: nameReg,
                                    message: ErrorInfo.ONLYSUP,
                                },
                            ]}
                        >
                            <Input
                                placeholder={__('请输入领导职务')}
                                maxLength={128}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={__('领导联系方式')}
                            name="dept_leader_phone"
                            rules={[
                                {
                                    pattern: phoneNumberReg,
                                    message: ErrorInfo.PHONENUMBER,
                                },
                            ]}
                        >
                            <Input placeholder={__('请输入领导联系方式')} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={__('领导电子邮箱')}
                            name="dept_leader_email"
                            rules={[
                                {
                                    pattern: emailReg,
                                    message: ErrorInfo.EMAIL,
                                },
                            ]}
                        >
                            <Input
                                placeholder={__('请输入领导电子邮箱')}
                                maxLength={128}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={__('部门联系人姓名')}
                            name="BD_user_name"
                            rules={[
                                {
                                    pattern: keyboardCharactersReg,
                                    message: ErrorInfo.EXCEPTEMOJI,
                                },
                            ]}
                        >
                            <Input
                                placeholder={__('请输入部门联系人姓名')}
                                maxLength={128}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={__('部门联系方式')}
                            name="BD_user_phone"
                            rules={[
                                {
                                    pattern: phoneNumberReg,
                                    message: ErrorInfo.PHONENUMBER,
                                },
                            ]}
                        >
                            <Input placeholder={__('请输入部门联系方式')} />
                        </Form.Item>
                    </Col>
                    {project !== 'tc' && (
                        <>
                            <Col span={12}>
                                <Form.Item
                                    label={__('承建商名称')}
                                    name="developer_name"
                                    rules={[
                                        {
                                            pattern: keyboardCharactersReg,
                                            message: ErrorInfo.EXCEPTEMOJI,
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder={__('请输入承建商名称')}
                                        maxLength={128}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label={__('统一社会信用代码')}
                                    name="developer_code"
                                    rules={[
                                        {
                                            pattern: uniformCreditCodeReg,
                                            message:
                                                ErrorInfo.UNIFORMCREDITCODE,
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder={__(
                                            '请输入统一社会信用代码',
                                        )}
                                        maxLength={128}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label={__('申请函件')}
                                    name="application_letter"
                                >
                                    <UploadApplicationLetter />
                                </Form.Item>
                            </Col>
                        </>
                    )}
                </Row>
            </div>
        </div>
    )
}

export default CreateUnitInfo
