import __ from './locale'
import {
    ExplorationRule,
    ExplorationPeculiarity,
} from '../DatasheetView/DatasourceExploration/const'
import { SortDirection } from '@/core'

export const menus = [{ key: 'updated_at', label: __('按更新时间排序') }]

export const defaultMenu = {
    key: 'updated_at',
    sort: SortDirection.DESC,
}

export const initSearchCondition: any = {
    current: 1,
    pageSize: 10,
    keyword: '',
}

export const qualityDimensionOptions = [
    { label: __('准确性'), value: ExplorationPeculiarity.Accuracy },
    { label: __('完整性'), value: ExplorationPeculiarity.Completeness },
    { label: __('有效性'), value: ExplorationPeculiarity.Validity },
    { label: __('唯一性'), value: ExplorationPeculiarity.Uniqueness },
    { label: __('一致性'), value: ExplorationPeculiarity.Consistency },
    { label: __('及时性'), value: ExplorationPeculiarity.Timeliness },
    { label: __('规范性'), value: ExplorationPeculiarity.Normative },
    { label: __('数据统计'), value: ExplorationPeculiarity.DataStatistics },
]
export const dimensionTypeOptions = [
    { label: __('行数据空值项检查'), value: 'row_null' },
    { label: __('行数据重复值检查'), value: 'row_repeat' },
    { label: __('空值项检查'), value: 'null' },
    { label: __('码值检查'), value: 'dict' },
    { label: __('重复值检查'), value: 'repeat' },
    { label: __('格式检查'), value: 'format' },
    { label: __('自定义规则'), value: 'custom' },
]
export const startOptions = [
    { label: __('是'), value: '1' },
    { label: __('否'), value: '2' },
]
export const ruleSourceOptions = [
    { label: __('系统预置'), value: 'internal' },
    { label: __('自定义'), value: 'custom' },
]
export const detectionTitleText = [
    {
        key: 'internal',
        title: __('系统预置规则'),
        secTitle: [
            __('始终显示在应用端检测列表中（不受开关控制）'),
            __('开启"默认检测"时：规则状态自动设为"启用"'),
        ],
    },
    {
        key: 'custom',
        title: __('自定义规则'),
        secTitle: [
            __('默认不显示在检测列表（需通过“从模版中新建”手动选择）'),
            // __('开启"默认检测"时：'),
        ],
        // threeTitle: [
        //     __('✓ 自动出现在检测列表中'),
        //     __('✓ 规则状态自动设为"启用"'),
        // ],
    },
]
export const typeMap = {
    [ExplorationRule.DataView]: [ExplorationPeculiarity.Timeliness],
    [ExplorationRule.Row]: [
        ExplorationPeculiarity.Completeness,
        ExplorationPeculiarity.Uniqueness,
        ExplorationPeculiarity.Accuracy,
    ],
    [ExplorationRule.Field]: [
        ExplorationPeculiarity.Completeness,
        ExplorationPeculiarity.Uniqueness,
        ExplorationPeculiarity.Normative,
        ExplorationPeculiarity.Accuracy,
    ],
}
