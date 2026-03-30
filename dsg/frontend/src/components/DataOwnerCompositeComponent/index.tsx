import { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { FormInstance } from 'antd/es/form'
import { Col, Form, Input, Row, Tooltip } from 'antd'
import { useSize } from 'ahooks'
import { InfoCircleOutlined } from '@ant-design/icons'
import SelectThemeDomain from '../SelectThemeDomain'
import DepartmentAndOrgSelect from '../DepartmentAndOrgSelect'
import SelectDataOwner from '../SelectDataOwner'
import { formatError, getCategoriesDetails } from '@/core'
import { CombinedComponentType } from './const'
import __ from './locale'
import { GlossaryIcon } from '../BusinessDomain/GlossaryIcons'
import styles from './styles.module.less'
import { BusinessDomainType, LevelType } from '../BusinessDomain/const'
import TreeSelectThemeDomain from '../TreeSelectThemeDomain'
import SystemSelect from '../SystemSelect'
import ApplicationSelect from '../ApplicationSelect'

type componentConfig = {
    name: string
    type: CombinedComponentType
    label?: string | ReactNode
    defaultDisplay?: any
    disabled?: boolean
    disableDisplay?: boolean
    disableText?: string
    mode?: 'multiple' | 'tags' | undefined
    perm?: string // 所属
    required?: boolean
    allowClear?: boolean
}
interface IDataOwnerCompositeComponent {
    form?: FormInstance
    componentsConfig: Array<componentConfig>
    numberPerLine?: number | Array<number>
    gutter?: number

    // 默认回显的数据需要传入，目前的只有主题域
    defaultDomainId?: string
    // 默认的数据owner 逻辑实体层级需要
    defaultOwnerId?: string
    // 是否需要清除数据
    onClearData?: (key: string, error?: string) => void
}

const DataOwnerCompositeComponent: FC<IDataOwnerCompositeComponent> = ({
    form,
    componentsConfig,
    numberPerLine = 2,
    gutter = 40,
    defaultDomainId,
    defaultOwnerId,
    onClearData,
}) => {
    const [selectDomainDetail, setDomainDetail] = useState<any>(null)
    const [selectedDominOwner, setSelectedDominOwner] = useState<string>('')
    const [defaultSubjectDetail, setDefaultSubjectDetail] = useState<any>()
    const subjectRef = useRef<HTMLDivElement | null>(null)
    const subjectSize = useSize(subjectRef)

    useEffect(() => {
        if (defaultDomainId) {
            getDomainDetails(defaultDomainId)
        }
    }, [defaultDomainId])

    const getDomainDetails = async (id) => {
        try {
            const res = await getCategoriesDetails(id)
            setSelectedDominOwner(
                res.type === BusinessDomainType.logic_entity
                    ? defaultOwnerId
                    : res?.owners?.user_id || '',
            )
            setDefaultSubjectDetail(res)
            const themeDomainConfig = componentsConfig.find(
                (item) => item.type === CombinedComponentType.THEMEDOMAIN,
            )
            if (themeDomainConfig?.name && form) {
                form.setFieldValue(
                    themeDomainConfig.name,
                    res?.path_id?.split('/') || [],
                )
            }
        } catch (err) {
            formatError(err)
        }
    }

    const showSubjectTip = useMemo(() => {
        let res = false
        if (subjectRef.current) {
            const el: any = subjectRef.current.children[0]
            const inputWidth = el.clientWidth
            const text = el.textContent
            const newLi = document.createElement('span')
            newLi.innerText = text || ''
            document.querySelector('body')?.appendChild(newLi)
            const textWidth = newLi.getBoundingClientRect().width
            if (textWidth > inputWidth) {
                res = true
            } else {
                res = false
            }
            newLi?.remove()
        }
        return res
    }, [subjectSize])

    const getItemComponent = (config: componentConfig, index) => {
        switch (config.type) {
            case CombinedComponentType.THEMEDOMAIN:
                return (
                    <Form.Item
                        label={config?.label || __('所属业务对象')}
                        name={config.name}
                        validateFirst
                        rules={[
                            {
                                required: config?.required || false,
                                message: __('请选择'),
                            },
                        ]}
                    >
                        {config.disabled && config.disableDisplay ? (
                            <div
                                ref={subjectRef}
                                className={styles['subject-disable']}
                            >
                                <div
                                    className={
                                        styles['subject-disable-content']
                                    }
                                    title={
                                        showSubjectTip
                                            ? `${
                                                  LevelType[
                                                      defaultSubjectDetail?.type
                                                  ]
                                              }：${
                                                  defaultSubjectDetail?.path_name
                                              }`
                                            : config.disableText || ''
                                    }
                                >
                                    <GlossaryIcon
                                        width="20px"
                                        type={defaultSubjectDetail?.type}
                                        fontSize="20px"
                                        styles={{ opacity: 0.25 }}
                                    />
                                    <span
                                        className={
                                            styles[
                                                'subject-disable-content-name'
                                            ]
                                        }
                                    >
                                        {defaultSubjectDetail?.name}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <SelectThemeDomain
                                onChange={(info) => {
                                    if (info?.[1]) {
                                        getDomainDetails(info[1])
                                    } else {
                                        setDomainDetail(null)
                                        setSelectedDominOwner('')
                                    }
                                }}
                                defaultDisplay={config.defaultDisplay || ''}
                                allowClear
                            />
                        )}
                    </Form.Item>
                )
            case CombinedComponentType.DEPARTMENT:
                return (
                    <Form.Item
                        label={config?.label || __('所属部门')}
                        name={config.name}
                        validateFirst
                        rules={[
                            {
                                required: config?.required || false,
                                message: __('请选择'),
                            },
                        ]}
                    >
                        <DepartmentAndOrgSelect
                            defaultValue={config.defaultDisplay || ''}
                            allowClear={config.allowClear !== false}
                            getInitValueError={(errorMessage) => {
                                form?.setFields([
                                    {
                                        name: config.name,
                                        errors: [errorMessage],
                                        value: null,
                                    },
                                ])
                                onClearData?.(config.name, errorMessage)
                            }}
                        />
                    </Form.Item>
                )
            case CombinedComponentType.DATAOWNER:
                return (
                    <Form.Item
                        label={config?.label || __('数据Owner')}
                        name={config.name}
                        // required
                        validateFirst
                        // rules={[
                        //     {
                        //         required: true,
                        //         message: __('请选择数据Owner'),
                        //     },
                        // ]}
                    >
                        <SelectDataOwner
                            associateOwnerId={selectedDominOwner}
                            mode={config.mode}
                            onInitDataError={(ex) => {
                                form?.setFields([
                                    {
                                        name: config.name,
                                        errors: [ex?.message],
                                        value: null,
                                    },
                                ])
                                onClearData?.(config.name, ex?.message)
                            }}
                            allowClear
                            perm={config.perm}
                        />
                    </Form.Item>
                )
            case CombinedComponentType.THEME_DOMAIN_TREE:
                return (
                    <Form.Item
                        label={config?.label || __('所属业务对象')}
                        name={config.name}
                        validateFirst
                        rules={[{ required: config?.required || false }]}
                    >
                        {config.disabled && config.disableDisplay ? (
                            <div
                                ref={subjectRef}
                                className={styles['subject-disable']}
                            >
                                <div
                                    className={
                                        styles['subject-disable-content']
                                    }
                                    title={
                                        showSubjectTip
                                            ? `${
                                                  LevelType[
                                                      defaultSubjectDetail?.type
                                                  ]
                                              }：${
                                                  defaultSubjectDetail?.path_name
                                              }`
                                            : config.disableText || ''
                                    }
                                >
                                    <GlossaryIcon
                                        width="20px"
                                        type={defaultSubjectDetail?.type}
                                        fontSize="20px"
                                        styles={{ opacity: 0.25 }}
                                    />
                                    <span
                                        className={
                                            styles[
                                                'subject-disable-content-name'
                                            ]
                                        }
                                    >
                                        {defaultSubjectDetail?.name}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <TreeSelectThemeDomain
                                onChange={(info) => {
                                    if (info) {
                                        getDomainDetails(info)
                                    } else {
                                        setDomainDetail(null)
                                        setSelectedDominOwner('')
                                    }
                                }}
                                defaultValue={config.defaultDisplay || ''}
                                allowClear
                                placeholder={__('请选择所属业务对象')}
                            />
                        )}
                    </Form.Item>
                )
            case CombinedComponentType.INFO_SYSTEM:
                return (
                    <Form.Item
                        label={config?.label || __('所属系统')}
                        name={config.name}
                        validateFirst
                        rules={[
                            {
                                required: config?.required || false,
                                message: __('请选择'),
                            },
                        ]}
                    >
                        <SystemSelect
                            placeholder={__('请选择所属系统')}
                            onInitDataError={(ex) => {
                                form?.setFields([
                                    {
                                        name: config.name,
                                        errors: [ex?.message],
                                        value: null,
                                    },
                                ])
                            }}
                        />
                    </Form.Item>
                )
            case CombinedComponentType.APPLICATION:
                return (
                    <Form.Item
                        shouldUpdate={(prevValues, currentValues) => {
                            const infoSystemId = componentsConfig.find(
                                (item) =>
                                    item.type ===
                                    CombinedComponentType.INFO_SYSTEM,
                            )?.name
                            if (
                                infoSystemId &&
                                prevValues[infoSystemId] !==
                                    currentValues[infoSystemId]
                            ) {
                                return true
                            }
                            return false
                        }}
                    >
                        {(getFieldValue) => {
                            const infoSystemId =
                                form?.getFieldValue('info_system_id') || ''
                            return (
                                <Form.Item
                                    label={
                                        <div>
                                            {config?.label || __('所属应用')}
                                            <Tooltip
                                                title={__(
                                                    '请选择所属系统中已注册的网关应用',
                                                )}
                                            >
                                                <InfoCircleOutlined
                                                    style={{ marginLeft: 4 }}
                                                />
                                            </Tooltip>
                                        </div>
                                    }
                                    name={config.name}
                                    validateFirst
                                    rules={[
                                        {
                                            required: config?.required || false,
                                            message: __('请选择'),
                                        },
                                    ]}
                                >
                                    <ApplicationSelect
                                        placeholder={__('请选择所属应用')}
                                        infoSystemId={infoSystemId}
                                        onInitDataError={(ex) => {
                                            form?.setFields([
                                                {
                                                    name: config.name,
                                                    errors: [ex?.message],
                                                    value: null,
                                                },
                                            ])
                                        }}
                                    />
                                </Form.Item>
                            )
                        }}
                    </Form.Item>
                )
            default:
                return null
        }
    }

    // 根据需要显示的组件设计布局
    const getLayoutComponets = () => {
        // 根据UI 进行分组

        return (
            <Row gutter={gutter}>
                {componentsConfig.map((config, index) => {
                    const size =
                        numberPerLine instanceof Array
                            ? numberPerLine[index]
                            : 24 / numberPerLine
                    return (
                        <Col span={size}>{getItemComponent(config, index)}</Col>
                    )
                })}{' '}
            </Row>
        )
    }

    return <div>{getLayoutComponets()}</div>
}

export default DataOwnerCompositeComponent
