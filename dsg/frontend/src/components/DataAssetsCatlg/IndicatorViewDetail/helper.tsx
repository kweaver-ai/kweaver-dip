import Icon, { UserOutlined } from '@ant-design/icons'
import { DepartmentOutlined, FontIcon, ThemeOutlined } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'
import { IconType } from '@/icons/const'
import { PolicyActionEnum } from '@/core'

// 列表-库表卡片-参数详情项
export const viewCardBasicInfoList = [
    {
        label: __('编码：'),
        value: '',
        key: 'code',
        span: 24,
    },
    {
        label: __('指标类型：'),
        value: '',
        key: 'indicator_type',
        span: 24,
    },

    {
        label: __('数据Owner：'),
        value: '',
        key: 'owners',
        span: 24,
    },
    {
        label: __('指标定义：'),
        value: '',
        key: 'description',
        span: 24,
    },
]
/**
 * 指标类型的Label
 */
export const IndicatorTypesText = {
    atomic: __('原子指标'),
    derived: __('衍生指标'),
    composite: __('复合指标'),
}

/**
 * 原子指标属性
 */
export const AtomicIndicatorList = [
    {
        label: __('分析维度'),
        value: '',
        key: 'analysis_dimensions',
        span: 24,
    },
    {
        label: __('表达式'),
        value: '',
        key: 'expression',
        span: 24,
    },
    {
        label: __('SQL'),
        value: '',
        key: 'exec_sql',
        span: 24,
    },
]

/**
 * 衍生指标属性
 */
export const DerivedIndicatorList = [
    {
        label: __('依赖原子指标'),
        value: '',
        key: 'atomic_indicator_name',
        span: 24,
    },
    {
        label: __('分析维度'),
        value: '',
        key: 'analysis_dimensions',
        span: 24,
    },
    {
        label: __('时间限定'),
        value: '',
        key: 'time_restrict',
        span: 24,
    },
    {
        label: __('业务限定'),
        value: '',
        key: 'where_info',
        span: 24,
    },
    {
        label: __('SQL'),
        value: '',
        key: 'exec_sql',
        span: 24,
    },
]

/**
 * 复合指标属性
 */
export const CompositeIndicatorList = [
    {
        label: __('分析维度'),
        value: '',
        key: 'analysis_dimensions',
        span: 24,
    },
    {
        label: __('表达式'),
        value: '',
        key: 'expression',
        span: 24,
    },
    {
        label: __('SQL'),
        value: '',
        key: 'exec_sql',
        span: 24,
    },
]

/**
 * 指标类型的属性
 */
export const IndicatorTypesList = {
    atomic: AtomicIndicatorList,
    derived: DerivedIndicatorList,
    composite: CompositeIndicatorList,
}

export const itemOtherInfo = [
    {
        infoKey: 'domain_name',
        title: <ThemeOutlined style={{ fontSize: 16 }} />,
        toolTipTitle: `${__('所属主题：')}`,
    },
    {
        infoKey: 'management_department_name',
        title: (
            <DepartmentOutlined
                className={styles.commonIcon}
                style={{ fontSize: 16 }}
            />
        ),
        toolTipTitle: `${__('所属部门：')}`,
    },
    {
        infoKey: 'owners',
        title: (
            <UserOutlined
                className={styles.commonIcon}
                style={{ fontSize: 16 }}
            />
        ),
        toolTipTitle: `${__('数据Owner：')}`,
    },
    {
        infoKey: 'access',
        title: (
            <FontIcon
                name="icon-ziyuanquanxian"
                className={styles.commonIcon}
                type={IconType.FONTICON}
                style={{ fontSize: 16, marginRight: '8px' }}
            />
        ),
        toolTipTitle: `${__('权限：')}`,
    },
]

// 指标详情的也的tab
export enum IndicatorDetailTabKey {
    // 详情
    Detail = 'detail',

    // 预览
    Preview = 'preview',

    // 血缘
    Consanguinity = 'consanguinity',
}

// 定义指标内容类型的枚举，用于标识指标的类型
export enum IndicatorContentType {
    // 技术类型的指标
    TECHNICAL = 'technical',

    // 授权策略类型的指标
    AUTH_POLICY = 'authPolicy',
}

// 定义了一个指标内容标签数组，用于UI界面的选项卡导航
export const IndicatorContentTabs = [
    {
        // 第一个标签，展示“技术属性”内容
        label: __('技术属性'),
        key: IndicatorContentType.TECHNICAL,
    },
    {
        // 第二个标签，展示“权限信息”内容
        label: __('权限信息'),
        key: IndicatorContentType.AUTH_POLICY,
    },
]

export const ActionText = {
    [PolicyActionEnum.View]: __('查看'),
    [PolicyActionEnum.Read]: __('读取'),
    [PolicyActionEnum.Download]: __('下载'),
    [PolicyActionEnum.Auth]: __('授权'),
    [PolicyActionEnum.Allocate]: __('授权(仅分配)'),
}
