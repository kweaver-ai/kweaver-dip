import { ReactNode } from 'react'
import { Form, Tooltip } from 'antd'
import styles from './styles.module.less'
import __ from '../locale'
import { FontIcon } from '@/icons'

/**
/**
 * 容器栏
 * @param param0
 * @returns
 */
export const ContainerBar = ({ children }: { children: ReactNode }) => {
    return (
        <div className={styles.containerBar}>
            <div className={styles.line} />
            {children}
        </div>
    )
}

/**
 * 渲染说明
 * @param title
 * @param content
 * @returns
 */
export const IntroductionTooltip = () => {
    return (
        <Tooltip
            title={
                <div className={styles.introductionTooltipWrapper}>
                    <div className={styles.title}>{__('说明')}</div>
                    <div className={styles.contentWrapper}>
                        <div>{__('1、内置规则优先级最低。')}</div>
                        <div>
                            {__(
                                '2、若添加了其它规则，则其它规则优先识别；若无，则使用内置规则识别。',
                            )}
                        </div>
                        <div>
                            {__(
                                '3、为保证库表的 “探查分类” 功能正常使用，最少要有一条识别规则，内置规则不可变更和停用，除非规则引用的识别算法服务不可用。',
                            )}
                        </div>
                        <div>
                            {__(
                                '4、识别规则依赖识别算法，若识别算法关闭或异常，则识别规则不能正常使用。',
                            )}
                        </div>
                    </div>
                </div>
            }
            placement="bottomLeft"
            overlayStyle={{ maxWidth: 910 }}
            overlayInnerStyle={{
                color: 'rgba(0, 0, 0, 0.85)',
            }}
            color="#fff"
        >
            <span className={styles.introduction}>{__('说明')}</span>
        </Tooltip>
    )
}

/**
 * 操作栏
 * @param operate
 * @returns
 */
export const OperateBox = ({ operate }: { operate: string }) => {
    return (
        <div className={styles.operateWrapper}>
            <div className={styles.line} />
            <div className={styles.operateBox}>
                <Form.Item name="operate" initialValue={operate} noStyle>
                    <div>{operate === 'or' ? __('或') : __('且')}</div>
                </Form.Item>
            </div>
        </div>
    )
}

/**
 * 探查分类的识别规则详情
 */
export const ClassifyDetailConfig = [
    {
        key: 'base',
        label: __('基本信息'),
        items: [
            {
                key: 'name',
                label: __('规则名称：'),
                value: '',
            },
            {
                key: 'description',
                label: __('描述：'),
                value: '',
            },
        ],
    },
    {
        key: 'classify',
        label: __('探查分类的识别配置'),
        items: [
            {
                key: 'algorithms',
                label: __('识别算法：'),
                value: '',
                render: (algorithms: Array<any>) => {
                    return (
                        <div className={styles.algorithmsWrapper}>
                            {algorithms?.map((item: any) => (
                                <div className={styles.item}>{item?.name}</div>
                            ))}
                        </div>
                    )
                },
            },
            {
                key: 'subject_name',
                label: __('识别分类：'),
                value: '',
                render: (name: any) => {
                    return (
                        <div className={styles.selectOptionWrapper}>
                            <FontIcon
                                name="icon-shuxing"
                                style={{
                                    fontSize: 20,
                                    color: 'rgba(245, 137, 13, 1)',
                                }}
                            />
                            <span>{name}</span>
                        </div>
                    )
                },
            },
        ],
    },
    {
        key: 'updateInfo',
        label: __('更新信息'),
        items: [
            {
                key: 'created_by_name',
                label: __('创建人：'),
                value: '',
            },
            {
                key: 'created_at',
                label: __('创建时间：'),
                value: '',
            },
            {
                key: 'updated_by_name',
                label: __('更新人：'),
                value: '',
            },
            {
                key: 'updated_at',
                label: __('更新时间：'),
                value: '',
            },
        ],
    },
]

/**
 * 探查分类的识别规则详情
 */
export const GradingDetailConfig = [
    {
        key: 'base',
        label: __('基本信息'),
        items: [
            {
                key: 'name',
                label: __('规则名称：'),
                value: '',
            },
            {
                key: 'group_name',
                label: __('规则组：'),
                value: '',
            },
            {
                key: 'description',
                label: __('描述：'),
                value: '',
            },
        ],
    },
    {
        key: 'grading',
        label: __('探查分级的识别配置'),
        item: [],
    },
    {
        key: 'updateInfo',
        label: __('更新信息'),
        items: [
            {
                key: 'created_by_name',
                label: __('创建人：'),
                value: '',
            },
            {
                key: 'created_at',
                label: __('创建时间：'),
                value: '',
            },
            {
                key: 'updated_by_name',
                label: __('更新人：'),
                value: '',
            },
            {
                key: 'updated_at',
                label: __('更新时间：'),
                value: '',
            },
        ],
    },
]
