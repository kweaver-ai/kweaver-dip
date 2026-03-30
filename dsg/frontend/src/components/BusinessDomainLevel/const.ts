import { BusinessDomainLevelTypes } from '@/core'
import __ from './locale'

export const LevelMap = {
    0: '1',
    1: '1.1',
    2: '1.1.1',
    3: '1.1.1.1',
    4: '1.1.1.1.1',
    5: '1.1.1.1.1.1',
    6: '1.1.1.1.1.1.1',
}

export const settingInstructions = [
    '在设置好层级深度和类型后，在「业务架构」中，进行业务梳理时会按照规范进行梳理。',
    '设置层级限制最多可设置7层，最少3层，最后一层为业务流程，可插入多个业务领域类型层级和业务流程类型层级来满足多层级的业务梳理需求。',
    '注意：只有业务流程类型下可以关联业务模型。',
    '若中途修改层级深度，原内容保持不变，新增项将遵循新设置规则。',
]

export const settingInstructions2 = [
    '在设置好层级深度和类型后，在「业务架构」中，进行业务梳理时会按照规范进行梳理。',
    '设置层级限制最多可设置7层，最少3层，最后一层为主干业务，可插入多个业务领域类型层级和主干业务类型层级来满足多层级的业务梳理需求。',
    '注意：只有主干业务类型下可以关联业务模型。',
    '若中途修改层级深度，原内容保持不变，新增项将遵循新设置规则。',
]
export const LevelTypeNameMap = {
    [BusinessDomainLevelTypes.DomainGrouping]: __('业务领域分组'),
    [BusinessDomainLevelTypes.Domain]: __('业务领域'),
    [BusinessDomainLevelTypes.Process]: __('主干业务'),
}

export const BusinessDomainLevelDepth = 7
