import { DepartmentOutlined } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'

// 业务逻辑实体列表项参数
export const itemOtherInfo = [
    {
        infoKey: 'department',
        title: (
            <DepartmentOutlined
                className={styles.commonIcon}
                style={{ fontSize: 16 }}
            />
        ),
        toolTipTitle: `${__('所属部门：')}`,
    },
]

// 列表-库表卡片-参数详情项
export const viewCardBaiscInfoList = [
    {
        label: __('编码：'),
        value: '',
        key: 'uniform_catalog_code',
        span: 24,
    },
    {
        label: __('技术名称：'),
        value: '',
        key: 'technical_name',
        span: 24,
    },
    {
        label: __('业务数据更新时间：'),
        value: '',
        key: 'business_update_time',
        span: 24,
    },
    {
        label: __('数据Owner：'),
        value: '',
        key: 'owner',
        span: 24,
    },
    {
        label: __('描述：'),
        value: '',
        key: 'description',
        span: 24,
    },
]

export const fileInfoDetailsList = [
    {
        label: __('资源信息'),
        key: 'basic',
        list: [
            {
                label: __('资源名称'),
                value: '',
                key: 'rescName',
                span: 12,
            },
            {
                label: __('编码'),
                value: '',
                key: 'fileCode',
            },
            {
                label: __('所属组织架构'),
                value: '',
                key: 'org_name',
                span: 12,
            },
            {
                label: __('更新时间'),
                value: '',
                key: 'updated_at',
            },
        ],
    },
    // {
    //     label: __('附件清单'),
    //     // key: 'accessories_list',
    //     key: 'fileList',
    //     list: [],
    // },
]
