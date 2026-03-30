import {
    AppApiColored,
    AppDataContentColored,
    DataRequirementColored,
    DataModelColored,
    DatasheetViewColored,
    IndicatorManageColored,
    LogicEntityColored,
    FontIcon,
} from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import { formatTime } from '@/utils'
import { ICCRuleItem } from '@/core'
import { IconType } from '@/icons/const'

export enum RuleType {
    DataResource = 'DataCatalog',
    LogicView = 'DataView',
    DimensionalModel = 'DimensionalModel',
    Indicator = 'Indicator',
    Api = 'Api',
    LogicEntity = 'LogicEntity',
    DataRequirement = 'DataRequirement',
    InfoCatalog = 'InfoCatalog',
    FileResource = 'FileResource',
    Application = 'Application',
    DataAnalRequire = 'DataAnalRequire',
    TenantApply = 'TenantApplication',
}

/**
 * 分隔符可选项
 */
export const SeparatorOptions = ['_', '-', '/', '\\'].map((o) => ({
    key: o,
    label: o,
    value: o,
}))

/**
 * 数字码位数可选项
 */
export const DigitalWidthOptions = [3, 4, 5, 6, 7, 8, 9].map((o) => ({
    key: o,
    label: o,
    value: o,
}))

/**
 * 默认前缀
 */
export const DefaultPrefix = {
    /**
     * 数据资源目录
     */
    [RuleType.DataResource]: 'ZYML',
    /**
     * 库表
     */
    [RuleType.LogicView]: 'SJST',
    /**
     * 维度模型
     */
    [RuleType.DimensionalModel]: 'WD',
    /**
     * 指标
     */
    [RuleType.Indicator]: 'ZB',
    /**
     * 接口
     */
    [RuleType.Api]: 'JK',
    /**
     * 逻辑实体
     */
    [RuleType.LogicEntity]: 'LGST',
    /**
     * 需求
     */
    [RuleType.DataRequirement]: 'XQ',
    /**
     * 租户申请
     */
    [RuleType.TenantApply]: 'ZHSQ',
}

/**
 * 规则类别-icon
 */
export const RuleTypeIcon = {
    // 文件资源
    [RuleType.FileResource]: (
        <FontIcon
            name="icon-wenjianziyuan"
            type={IconType.COLOREDICON}
            style={{
                fontSize: '36px',
            }}
        />
    ),
    /**
     * 数据资源目录
     */
    [RuleType.DataResource]: <AppDataContentColored />,
    /**
     * 信息资源目录
     */
    [RuleType.InfoCatalog]: (
        <FontIcon
            name="icon-xinximulu1"
            type={IconType.COLOREDICON}
            style={{
                fontSize: '36px',
            }}
        />
    ),
    /**
     * 库表
     */
    [RuleType.LogicView]: <DatasheetViewColored />,
    /**
     * 维度模型
     */
    [RuleType.DimensionalModel]: <DataModelColored />,
    /**
     * 指标
     */
    [RuleType.Indicator]: <IndicatorManageColored />,
    /**
     * 接口
     */
    [RuleType.Api]: <AppApiColored />,
    /**
     * 逻辑实体
     */
    [RuleType.LogicEntity]: (
        <LogicEntityColored className={styles['icon-logic']} />
    ),
    /**
     * 需求
     */
    [RuleType.DataRequirement]: <DataRequirementColored />,
    [RuleType.Application]: (
        <FontIcon
            name="icon-gongxiangshenqing"
            type={IconType.COLOREDICON}
            style={{
                fontSize: '36px',
            }}
        />
    ),
    [RuleType.DataAnalRequire]: (
        <FontIcon
            name="icon-shujufenxixuqiu"
            type={IconType.COLOREDICON}
            style={{
                fontSize: '36px',
            }}
        />
    ),
    /**
     * 租户申请
     */
    [RuleType.TenantApply]: (
        <FontIcon
            name="icon-zuhushenqingguanli2"
            type={IconType.COLOREDICON}
            style={{
                fontSize: '36px',
            }}
        />
    ),
}

/**
 * 获取编码规则信息
 */
export const getCodeRule = ({
    prefix_enabled,
    rule_code_enabled,
    code_separator_enabled,
}: Record<string, boolean>) => {
    const retArr: string[] = []
    if (prefix_enabled) retArr.push(__('前缀'))
    if (rule_code_enabled) retArr.push(__('规则码'))
    if (code_separator_enabled) retArr.push(__('分隔符'))
    retArr.push(__('数字码'))
    return retArr.join('+')
}

/**
 * 获取编码示例
 */
export const getCodeExample = (data: ICCRuleItem) => {
    let codeExample = ''
    if (data.prefix_enabled) codeExample += data.prefix
    if (data.rule_code_enabled)
        codeExample += formatTime(
            data?.updated_at || new Date().toDateString(),
            'YYYYMMDD',
        )

    if (data.code_separator_enabled) codeExample += data.code_separator
    codeExample += String(data?.digital_code_starting || 1).padStart(
        data.digital_code_width || 6,
        '0',
    )
    return codeExample
}
