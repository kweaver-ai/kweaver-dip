import { Progress, Tooltip } from 'antd'
import classNames from 'classnames'
import styles from './styles.module.less'
import __ from '../locale'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { IInterfaceDepartmentStatistics } from '@/core/apis/dataApplicationService/index.d'
import { Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'

interface IProps {
    data?: IInterfaceDepartmentStatistics
}

const DepartmentStatistics = ({ data }: IProps) => {
    return (
        <div className={styles['department-statistics']}>
            <div className={styles['top-info']}>
                <div className={styles.title}>
                    {__('接口服务部门统计')}
                    <Tooltip
                        title={__(
                            '统计各部门已发布接口数占本部门接口总数的比例',
                        )}
                    >
                        <FontIcon
                            name="icon-bangzhu"
                            type={IconType.FONTICON}
                            className={styles['help-icon']}
                        />
                    </Tooltip>
                </div>
                {!data?.department_statistics ||
                data?.department_statistics?.length === 0 ? (
                    <div />
                ) : (
                    <div className={styles['dep-count-container']}>
                        {__('提供部门总数')}
                        <span className={styles['dep-count']}>
                            {data?.department_count || 0}
                        </span>
                    </div>
                )}
            </div>

            {!data?.department_statistics ||
            data?.department_statistics?.length === 0 ? (
                <div className={styles['empty-container']}>
                    <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                </div>
            ) : (
                <div>
                    <div className={styles['title-container']}>
                        <div
                            className={classNames(
                                styles.order,
                                styles['common-title'],
                            )}
                        >
                            {__('排序')}
                        </div>
                        <div
                            className={classNames(
                                styles['dep-name'],
                                styles['common-title'],
                            )}
                        >
                            {__('部门名称')}
                        </div>
                        <div
                            className={classNames(
                                styles['interface-count'],
                                styles['common-title'],
                            )}
                        >
                            {__('接口数')}
                        </div>
                        <div
                            className={classNames(
                                styles['finish-rate'],
                                styles['common-title'],
                            )}
                        >
                            {__('完成率')}
                        </div>
                    </div>
                    <div className={styles['items-container']}>
                        {data?.department_statistics?.map((item, index) => (
                            <div
                                key={item.department_id}
                                className={styles['item-container']}
                            >
                                <div className={styles.order}>{index + 1}</div>
                                <div className={styles['item-info']}>
                                    <div className={styles['top-info']}>
                                        <div
                                            className={styles['dep-name']}
                                            title={item.department_name}
                                        >
                                            {
                                                item.department_name
                                                    .split('/')
                                                    .reverse()[0]
                                            }
                                        </div>
                                        <div
                                            className={
                                                styles['interface-count']
                                            }
                                        >
                                            {item.total_count}
                                        </div>
                                        <div className={styles['finish-rate']}>
                                            {(item.rate * 100).toFixed(2)}%
                                        </div>
                                    </div>
                                    <Tooltip
                                        title={
                                            <div>
                                                <div>
                                                    {__('提供接口占比：')}
                                                    {(item.rate * 100).toFixed(
                                                        2,
                                                    )}
                                                    %
                                                </div>
                                                <div>
                                                    {__('接口总数：')}
                                                    {item.total_count}
                                                </div>
                                                <div>
                                                    {__('提供接口数：')}
                                                    {item.published_count}
                                                </div>
                                            </div>
                                        }
                                    >
                                        <Progress
                                            percent={Number(
                                                (item.rate * 100).toFixed(2),
                                            )}
                                            showInfo={false}
                                            status="active"
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default DepartmentStatistics
