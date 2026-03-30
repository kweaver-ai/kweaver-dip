import classNames from 'classnames'
import styles from './styles.module.less'
import { AlgorithmStatus } from './const'
import __ from './locale'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'

/**
 * 状态标签
 * @param status 状态
 * @returns
 */
export const StatusLabel = ({ status }: { status: AlgorithmStatus }) => {
    return (
        <div className={styles.statusWrapper}>
            <div
                className={classNames(styles.dot, {
                    [styles.enableDot]: status === AlgorithmStatus.ENABLE,
                    [styles.stopDot]: status === AlgorithmStatus.DISABLE,
                })}
            />
            <div>
                {status === AlgorithmStatus.ENABLE
                    ? __('已启用')
                    : __('已停用')}
            </div>
        </div>
    )
}

/**
 * 过滤条件
 */
export const filterItems: IformItem[] = [
    {
        label: __('启用状态'),
        key: 'status',
        options: [
            {
                label: __('不限'),
                value: '',
            },
            {
                label: __('已启用'),
                value: 1,
                icon: <div className={classNames(styles.filterEnabledIcon)} />,
            },
            {
                label: __('已停用'),
                value: 0,
                icon: <div className={classNames(styles.filterDisabledIcon)} />,
            },
        ],
        type: SearchType.Radio,
    },
]

/**
 * 算法详情配置
 */
export const AlgorithmDetailConfig = [
    {
        label: __('基础属性'),
        key: 'base_info',
        items: [
            {
                label: __('算法名称'),
                key: 'name',
                value: '--',
            },
            {
                label: __('算法描述'),
                key: 'description',
                value: '--',
            },
            {
                label: __('识别算法'),
                key: 'algorithm',
                value: '--',
            },
            {
                label: __('类型'),
                key: 'type',
                value: '--',
            },
            {
                label: __('启用状态'),
                key: 'status',
                value: '--',
                render: ({ status }: { status: AlgorithmStatus }) => {
                    return <StatusLabel status={status} />
                },
            },
        ],
    },
    {
        label: __('更新信息'),
        key: 'update_info',
        items: [
            {
                label: __('创建人'),
                key: 'created_by_name',
                value: '--',
            },
            {
                label: __('创建时间'),
                key: 'created_at',
                value: '--',
            },
            {
                label: __('更新人'),
                key: 'updated_by_name',
                value: '--',
            },
            {
                label: __('更新时间'),
                key: 'updated_at',
                value: '--',
            },
        ],
    },
]
