import {
    FC,
    useEffect,
    useState,
    useImperativeHandle,
    forwardRef,
    useRef,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Form,
    Input,
    Row,
    Col,
    Space,
    Select,
    Radio,
    DatePicker,
    Button,
    Collapse,
} from 'antd'
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons'
import { noop } from 'lodash'
import classNames from 'classnames'
import styles from './styles.module.less'
import __ from '../locale'
import { DetailsLabel } from '@/ui'
import { useQuery } from '@/utils'
import { LabelTitle, TipsLabel } from '../BaseInfo'
import {
    catalogMoreInfo,
    resourceMoreInfo,
    apiResourceMoreInfo,
} from '../helper'
import {
    ResTypeEnum,
    UseScene,
    UseSceneList,
    DataDomainList,
    DataLevelList,
    DataProvideChannelList,
    DepartmentCodeList,
    DataProcessingList,
    CatalogTagList,
    ScheduleTypeList,
    YesOrNoList,
    RequestContentTypeList,
    requestJson,
    updateCycle,
    updateCycleOptions,
    DivisionCodeList,
} from '../const'
import Header from '@/components/BusinessDiagnosis/components/Header'
import InfoItemEditTable from './InfoItemEditTable'
import ApiEditTable from './ApiEditTable'
import JsonPreView from './JsonPreView'
import ResourcesAnchor from './ResourcesAnchor'

const { RangePicker } = DatePicker
const { Panel } = Collapse

interface IResourcesReport {
    ref?: any
    form?: any
    defaultForm?: any
    onDataChanged?: () => void
    onFinish?: (values) => void
    isOnlyReport?: boolean
    resType?: ResTypeEnum
}

const ResourcesReport: FC<IResourcesReport> = forwardRef((props: any, ref) => {
    const {
        form,
        defaultForm,
        onDataChanged = noop,
        onFinish = noop,
        isOnlyReport = true,
        resType,
    } = props

    const forms = form || Form.useForm()[0]
    const navigator = useNavigate()
    const query = useQuery()
    // 列表目录id--不能为空
    const rowId = query.get('id')
    const resourceType: ResTypeEnum = query.get('resType')
        ? Number(query.get('resType'))
        : resType
    const contentRef = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [reportFlag, setReportFlag] = useState<number>(1)
    const [useTypeType, setUseTypeType] = useState<UseScene>()
    const [updateCycleType, setUpdateCycleType] = useState<updateCycle>()
    const [dataDomain, setDataDomain] = useState<string>()
    const [infoItemMore, setInfoItemMore] = useState<boolean>(false)
    const [infoItemTableData, setInfoItemTableData] = useState<any[]>([
        {
            business_name: '业务名称',
            technical_name: 'technical_name',
            data_type: 'char',
            info_business_name: '信息项业务名称',
            info_technical_name: 'technical_name',
            info_data_type: 'number',
            data_length: '20',
            shared_type: 1,
            open_type: 1,
            ranges: '值域',
            id: '1',
        },
        {
            business_name: '业务名称',
            technical_name: 'technical_name',
            data_type: 'char',
            info_business_name: '信息项业务名称',
            info_technical_name: 'technical_name',
            info_data_type: 'number',
            data_length: '20',
            shared_type: 3,
            open_type: 1,
            ranges: '值域',
            id: '2',
        },
        {
            business_name: '业务名称',
            technical_name: 'technical_name',
            data_type: 'char',
            info_business_name: '信息项业务名称',
            info_technical_name: 'technical_name',
            info_data_type: 'number',
            data_length: '20',
            shared_type: 2,
            open_type: 2,
            ranges: '值域',
            id: '3',
        },
    ])
    const [apiTableData, setApiTableData] = useState<any[]>([
        {
            name: 'technical_nametechnical_name',
            data_type: 'char',
            lxgs: 'integer',
            sfsz: 1,
            sfbc: 1,
            description:
                '信息项业务名称信息项业务名称信息项业务名称信息项业务名称',
            id: '1',
        },
        {
            name: 'technical_nametechnical_name',
            data_type: 'char',
            lxgs: 'number',
            sfsz: 0,
            sfbc: 0,
            description:
                '信息项业务名称信息项业务名称信息项业务名称信息项业务名称',
            id: '2',
        },
        {
            name: 'technical_nametechnical_name',
            data_type: 'char',
            lxgs: 'string',
            sfsz: 1,
            sfbc: 1,
            description:
                '信息项业务名称信息项业务名称信息项业务名称信息项业务名称',
            id: '3',
        },
    ])
    const [catalogMoreInfoData, setCatalogMoreInfoData] =
        useState<any[]>(catalogMoreInfo)
    const [resourceMoreInfoData, setResourceMoreInfoData] =
        useState<any[]>(resourceMoreInfo)
    const [apiResourceMoreInfoData, setApiResourceMoreInfoData] =
        useState<any[]>(apiResourceMoreInfo)
    const [requestBodyMore, setRequestBodyMore] = useState<boolean>(false)
    const [responseBodyMore, setResponseBodyMore] = useState<boolean>(false)

    useEffect(() => {
        if (catalogMoreInfo?.length) {
            const data = {
                '1': '数据资源目录名称',
                '2': 'cdcdcd',
                '3': 1,
                '4': 1,
                '5': 1,
                '6': 1,
                '7': 2,
                '8': 1,
                '9': '迷哦奥数书描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述描述',
                '10': 'post',
                '11': 'http',
                '12': '127.0.0.1',
                '13': 'data/service/created',
            }
            setCatalogMoreInfoData(
                catalogMoreInfoData?.map((item) => ({
                    ...item,
                    value: data[item.key],
                })),
            )
            setResourceMoreInfoData(
                resourceMoreInfoData?.map((item) => ({
                    ...item,
                    value: data[item.key],
                })),
            )
            setApiResourceMoreInfoData(
                apiResourceMoreInfoData?.map((item) => ({
                    ...item,
                    value: data[item.key],
                })),
            )
        }
    }, [catalogMoreInfo])

    useImperativeHandle(ref, () => ({
        onSubmit,
        reportFlag,
    }))

    const back = () => {
        navigator(-1)
    }

    const onSubmit = () => {
        form.submit()
    }

    return (
        <div
            className={classNames(
                styles.resourcesReportWrapper,
                !isOnlyReport && styles.isOnlyReport,
            )}
        >
            {isOnlyReport && (
                <Header
                    showGlobalMenu={false}
                    back={back}
                    leftContent={__('上报资源目录')}
                />
            )}
            <div className={styles.contentBox}>
                <div ref={contentRef} className={styles.formWrapper}>
                    <Form
                        autoComplete="off"
                        form={forms}
                        layout="vertical"
                        onValuesChange={() => {
                            onDataChanged()
                        }}
                        onFinish={onFinish}
                    >
                        {!isOnlyReport && (
                            <div className={styles.tipsBox} id="catalog">
                                <div className={styles.name}>上报目录</div>
                                <div>
                                    {__(
                                        '完善上报信息后，目录通过发布审核后，将自动进入上报流程。',
                                    )}
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    {__('是否立即完善上报信息？')}
                                </div>
                                <Radio.Group
                                    onChange={(e) =>
                                        setReportFlag(e.target.value)
                                    }
                                    value={reportFlag}
                                >
                                    <Radio value={1}>{__('立即完善')}</Radio>
                                    <Radio value={2}>{__('跳过')}</Radio>
                                </Radio.Group>
                            </div>
                        )}
                        {reportFlag === 1 && (
                            <div>
                                <Row id="catalog">
                                    <LabelTitle label={__('上报目录信息')} />
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('数据所属领域')}
                                            name="data_domain"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: `${__(
                                                        '请选择',
                                                    )}${__('数据所属领域')}`,
                                                },
                                            ]}
                                        >
                                            <Select
                                                allowClear
                                                options={DataDomainList}
                                                placeholder={`${__(
                                                    '请选择',
                                                )}${__('数据所属领域')}`}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    {dataDomain === '27' && (
                                        <Col span={12}>
                                            <Form.Item
                                                label={`${__('其他')}${__(
                                                    '数据所属领域',
                                                )}`}
                                                name="yycjflqt"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: `${__(
                                                            '请输入',
                                                        )}${__('其他')}${__(
                                                            '数据所属领域',
                                                        )}`,
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    placeholder={`${__(
                                                        '请输入',
                                                    )}${__('其他')}${__(
                                                        '数据所属领域',
                                                    )}`}
                                                    maxLength={128}
                                                />
                                            </Form.Item>
                                        </Col>
                                    )}
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('数据所在层级')}
                                            name="data_level"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: `${__(
                                                        '请选择',
                                                    )}${__('数据所在层级')}`,
                                                },
                                            ]}
                                        >
                                            <Select
                                                allowClear
                                                options={DataLevelList}
                                                placeholder={`${__(
                                                    '请选择',
                                                )}${__('数据所在层级')}`}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('数据时间范围')}
                                            name="time_range"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: `${__(
                                                        '请选择',
                                                    )}${__('数据时间范围')}`,
                                                },
                                            ]}
                                        >
                                            <RangePicker
                                                style={{ width: '100%' }}
                                                format="YYYY-MM-DD"
                                                placeholder={[
                                                    __('开始日期'),
                                                    __('结束日期'),
                                                ]}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('供应渠道')}
                                            name="provider_channel"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: `${__(
                                                        '请选择',
                                                    )}${__('供应渠道')}`,
                                                },
                                            ]}
                                        >
                                            <Select
                                                allowClear
                                                options={DataProvideChannelList}
                                                placeholder={`${__(
                                                    '请选择',
                                                )}${__('供应渠道')}`}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('数据资源来源部门')}
                                            name="sjtgf"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: `${__(
                                                        '请选择',
                                                    )}${__(
                                                        '数据资源来源部门',
                                                    )}`,
                                                },
                                            ]}
                                        >
                                            <Select
                                                allowClear
                                                options={DataProvideChannelList}
                                                placeholder={`${__(
                                                    '请选择',
                                                )}${__('数据资源来源部门')}`}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('行政区划代码')}
                                            name="administrative_code"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: `${__(
                                                        '请选择',
                                                    )}${__('行政区划代码')}`,
                                                },
                                            ]}
                                        >
                                            <Select
                                                allowClear
                                                options={DivisionCodeList}
                                                placeholder={`${__(
                                                    '请选择',
                                                )}${__('行政区划代码')}`}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('中央业务指导部门代码')}
                                            name="central_department_code"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: `${__(
                                                        '请选择',
                                                    )}${__(
                                                        '中央业务指导部门代码',
                                                    )}`,
                                                },
                                            ]}
                                        >
                                            <Select
                                                allowClear
                                                options={DepartmentCodeList}
                                                placeholder={`${__(
                                                    '请选择',
                                                )}${__(
                                                    '中央业务指导部门代码',
                                                )}`}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={
                                                <TipsLabel
                                                    label={__(
                                                        '数据来源业务事项',
                                                    )}
                                                    tips={__(
                                                        '如果无对应事项，填写“*”；如有多个事项，以“|”隔开',
                                                    )}
                                                />
                                            }
                                            name="sjlyywsx"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: `${__(
                                                        '请输入',
                                                    )}${__(
                                                        '数据来源业务事项',
                                                    )}`,
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder={`${__(
                                                    '请输入',
                                                )}${__('数据来源业务事项')}`}
                                                maxLength={128}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('应用场景分类')}
                                            name="yycjfl"
                                        >
                                            <Select
                                                allowClear
                                                options={UseSceneList}
                                                placeholder={__('请选择')}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                                disabled
                                            />
                                        </Form.Item>
                                    </Col>
                                    {useTypeType === UseScene.Other && (
                                        <Col span={12}>
                                            <Form.Item
                                                label={`${__('其他')}${__(
                                                    '应用场景分类',
                                                )}`}
                                                name="yycjflqt"
                                            >
                                                <Input
                                                    placeholder={`${__(
                                                        '请输入',
                                                    )}${__('其他')}${__(
                                                        '应用场景分类',
                                                    )}`}
                                                    maxLength={128}
                                                />
                                            </Form.Item>
                                        </Col>
                                    )}
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('更新周期')}
                                            name="update_cycle"
                                        >
                                            <Select
                                                allowClear
                                                options={updateCycleOptions}
                                                placeholder={`${__(
                                                    '请选择',
                                                )}${__('更新周期')}`}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                                disabled
                                            />
                                        </Form.Item>
                                    </Col>
                                    {updateCycleType === updateCycle.other && (
                                        <Col span={12}>
                                            <Form.Item
                                                label={`${__('其他')}${__(
                                                    '更新周期',
                                                )}`}
                                                name="gxzqqt"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: `${__(
                                                            '请输入',
                                                        )}${__('其他')}${__(
                                                            '更新周期',
                                                        )}`,
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    placeholder={`${__(
                                                        '请输入',
                                                    )}${__('其他')}${__(
                                                        '更新周期',
                                                    )}`}
                                                    maxLength={128}
                                                />
                                            </Form.Item>
                                        </Col>
                                    )}
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('数据加工程度')}
                                            name="processing_level"
                                        >
                                            <Select
                                                allowClear
                                                options={DataProcessingList}
                                                placeholder={`${__(
                                                    '请选择',
                                                )}${__('数据加工程度')}`}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('目录标签')}
                                            name="catalog_tag"
                                        >
                                            <Select
                                                allowClear
                                                options={CatalogTagList}
                                                placeholder={`${__(
                                                    '请选择',
                                                )}${__('目录标签')}`}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('是否电子证照编码')}
                                            name="is_electronic_proof"
                                        >
                                            <Radio.Group>
                                                {YesOrNoList.map((item) => {
                                                    return (
                                                        <Radio
                                                            key={item.value}
                                                            value={item.value}
                                                        >
                                                            {item.label}
                                                        </Radio>
                                                    )
                                                })}
                                            </Radio.Group>
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Collapse ghost>
                                            <Panel
                                                header={__('查看更多上报信息')}
                                                key="1"
                                            >
                                                <DetailsLabel
                                                    wordBreak
                                                    labelWidth="140px"
                                                    detailsList={
                                                        catalogMoreInfoData
                                                    }
                                                />
                                            </Panel>
                                        </Collapse>
                                    </Col>
                                </Row>
                                {resourceType === ResTypeEnum.TABLE && (
                                    <Row id="resource">
                                        <LabelTitle
                                            label={__('上报资源信息')}
                                        />
                                        {/* <Col span={12}>
                                        <Form.Item
                                            label={__('数据库名称')}
                                            name="sjkmc"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: `${__(
                                                        '请选择',
                                                    )}${__('数据库名称')}`,
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder={`${__(
                                                    '请输入',
                                                )}${__('数据库名称')}`}
                                                maxLength={128}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('传输模式')}
                                            name="csms"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: `${__(
                                                        '请选择',
                                                    )}${__('传输模式')}`,
                                                },
                                            ]}
                                        >
                                            <Select
                                                allowClear
                                                options={TransmitModeList}
                                                placeholder={`${__(
                                                    '请选择',
                                                )}${__('传输模式')}`}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                            />
                                        </Form.Item>
                                    </Col> */}
                                        <Col span={12}>
                                            <Form.Item
                                                label={__('调度方式')}
                                                name="ddfs"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: `${__(
                                                            '请选择',
                                                        )}${__('调度方式')}`,
                                                    },
                                                ]}
                                            >
                                                <Select
                                                    allowClear
                                                    options={ScheduleTypeList}
                                                    placeholder={`${__(
                                                        '请选择',
                                                    )}${__('调度方式')}`}
                                                    getPopupContainer={(node) =>
                                                        node.parentNode
                                                    }
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                name="ddfs"
                                                noStyle
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: `${__(
                                                            '请选择',
                                                        )}${__('调度方式')}`,
                                                    },
                                                ]}
                                            >
                                                <Select
                                                    allowClear
                                                    options={ScheduleTypeList}
                                                    placeholder={`${__(
                                                        '请选择',
                                                    )}${__('调度方式')}`}
                                                    getPopupContainer={(node) =>
                                                        node.parentNode
                                                    }
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Collapse ghost>
                                                <Panel
                                                    header={__(
                                                        '查看更多上报信息',
                                                    )}
                                                    key="1"
                                                >
                                                    <DetailsLabel
                                                        wordBreak
                                                        labelWidth="140px"
                                                        detailsList={
                                                            resourceMoreInfoData
                                                        }
                                                    />
                                                </Panel>
                                            </Collapse>
                                        </Col>
                                    </Row>
                                )}
                                {resourceType === ResTypeEnum.TABLE && (
                                    <div id="info">
                                        <LabelTitle
                                            label={__('上报信息项信息')}
                                        />
                                        <div className={styles.infoTitle}>
                                            <div className={styles.title}>
                                                {__('信息项')}
                                            </div>
                                            <div
                                                className={styles.viewBtn}
                                                onClick={() =>
                                                    setInfoItemMore(
                                                        !infoItemMore,
                                                    )
                                                }
                                            >
                                                <span
                                                    className={styles.eyesIcon}
                                                >
                                                    {infoItemMore ? (
                                                        <EyeInvisibleOutlined />
                                                    ) : (
                                                        <EyeOutlined />
                                                    )}
                                                </span>
                                                {__('${show}更多上报信息', {
                                                    show: infoItemMore
                                                        ? __('隐藏')
                                                        : __('查看'),
                                                })}
                                            </div>
                                        </div>
                                        <InfoItemEditTable
                                            isEidt
                                            showMore={infoItemMore}
                                            value={infoItemTableData}
                                            onChange={(o) =>
                                                setInfoItemTableData(o)
                                            }
                                        />
                                    </div>
                                )}
                                {resourceType === ResTypeEnum.API && (
                                    <Row id="resource">
                                        <LabelTitle
                                            label={__('上报资源信息')}
                                        />
                                        <Col span={12}>
                                            <Form.Item
                                                label={__('服务请求报文格式')}
                                                name="fwqqbwgs"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: `${__(
                                                            '请选择',
                                                        )}${__(
                                                            '服务请求报文格式',
                                                        )}`,
                                                    },
                                                ]}
                                            >
                                                <Select
                                                    allowClear
                                                    options={
                                                        RequestContentTypeList
                                                    }
                                                    placeholder={`${__(
                                                        '请选择',
                                                    )}${__(
                                                        '服务请求报文格式',
                                                    )}`}
                                                    getPopupContainer={(node) =>
                                                        node.parentNode
                                                    }
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                label={__('服务响应报文格式')}
                                                name="fwxybwgs"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: `${__(
                                                            '请选择',
                                                        )}${__(
                                                            '服务请求报文格式',
                                                        )}`,
                                                    },
                                                ]}
                                            >
                                                <Select
                                                    allowClear
                                                    options={
                                                        RequestContentTypeList
                                                    }
                                                    placeholder={`${__(
                                                        '请选择',
                                                    )}${__(
                                                        '服务请求报文格式',
                                                    )}`}
                                                    getPopupContainer={(node) =>
                                                        node.parentNode
                                                    }
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Collapse ghost>
                                                <Panel
                                                    header={__(
                                                        '查看更多上报信息',
                                                    )}
                                                    key="1"
                                                >
                                                    <DetailsLabel
                                                        wordBreak
                                                        labelWidth="100px"
                                                        detailsList={
                                                            apiResourceMoreInfoData
                                                        }
                                                    />
                                                </Panel>
                                            </Collapse>
                                        </Col>
                                        <Col span={24} id="requestBody">
                                            <div className={styles.infoTitle}>
                                                <div className={styles.title}>
                                                    {__('请求body')}
                                                </div>
                                                <div
                                                    className={styles.viewBtn}
                                                    onClick={() =>
                                                        setRequestBodyMore(
                                                            !requestBodyMore,
                                                        )
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            styles.eyesIcon
                                                        }
                                                    >
                                                        {requestBodyMore ? (
                                                            <EyeInvisibleOutlined />
                                                        ) : (
                                                            <EyeOutlined />
                                                        )}
                                                    </span>
                                                    {__('${show}更多上报信息', {
                                                        show: requestBodyMore
                                                            ? __('隐藏')
                                                            : __('查看'),
                                                    })}
                                                </div>
                                            </div>
                                            <ApiEditTable
                                                value={apiTableData}
                                                isEidt
                                                onChange={(o) =>
                                                    setApiTableData(o)
                                                }
                                                columnKeys={
                                                    !requestBodyMore
                                                        ? [
                                                              'name',
                                                              'lxgs',
                                                              'sfsz',
                                                          ]
                                                        : [
                                                              'name',
                                                              'lxgs',
                                                              'sfsz',
                                                              'sfbc',
                                                              'description',
                                                          ]
                                                }
                                            />
                                            {requestBodyMore && (
                                                <div>
                                                    <div
                                                        className={
                                                            styles.titleText
                                                        }
                                                    >
                                                        {__('请求示例')}
                                                    </div>
                                                    <JsonPreView
                                                        value={JSON.stringify(
                                                            requestJson,
                                                        )}
                                                    />
                                                </div>
                                            )}
                                        </Col>
                                        <Col span={24} id="responseBody">
                                            <div className={styles.infoTitle}>
                                                <div className={styles.title}>
                                                    {__('响应参数')}
                                                </div>
                                                <div
                                                    className={styles.viewBtn}
                                                    onClick={() =>
                                                        setResponseBodyMore(
                                                            !responseBodyMore,
                                                        )
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            styles.eyesIcon
                                                        }
                                                    >
                                                        {responseBodyMore ? (
                                                            <EyeInvisibleOutlined />
                                                        ) : (
                                                            <EyeOutlined />
                                                        )}
                                                    </span>
                                                    {__('${show}更多上报信息', {
                                                        show: responseBodyMore
                                                            ? __('隐藏')
                                                            : __('查看'),
                                                    })}
                                                </div>
                                            </div>
                                            <ApiEditTable
                                                value={apiTableData}
                                                isEidt
                                                onChange={(o) =>
                                                    setApiTableData(o)
                                                }
                                                columnKeys={
                                                    !responseBodyMore
                                                        ? [
                                                              'name',
                                                              'lxgs',
                                                              'sfsz',
                                                              'sfynr',
                                                          ]
                                                        : [
                                                              'name',
                                                              'lxgs',
                                                              'sfsz',
                                                              'sfynr',
                                                              'description',
                                                          ]
                                                }
                                            />
                                            {responseBodyMore && (
                                                <div>
                                                    <div
                                                        className={
                                                            styles.titleText
                                                        }
                                                    >
                                                        {__('返回示例')}
                                                    </div>
                                                    <JsonPreView
                                                        value={JSON.stringify(
                                                            requestJson,
                                                        )}
                                                    />
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                )}
                            </div>
                        )}
                    </Form>
                </div>
                {reportFlag === 1 ? (
                    <ResourcesAnchor
                        type={resourceType}
                        contentRef={contentRef}
                    />
                ) : (
                    <div style={{ width: '116px' }} />
                )}
            </div>
            {isOnlyReport && (
                <Space size={16} className={styles.footer}>
                    <Button onClick={back}>{__('取消')}</Button>
                    <Button
                        loading={loading}
                        type="primary"
                        onClick={() => forms.submit()}
                    >
                        {__('确认上报')}
                    </Button>
                </Space>
            )}
        </div>
    )
})
export default ResourcesReport
