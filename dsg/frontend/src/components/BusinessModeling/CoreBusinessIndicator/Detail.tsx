import { Anchor, Drawer } from 'antd'
import React, { useEffect, useRef, useState, useMemo } from 'react'
import styles from './styles.module.less'
import __ from '../locale'
import {
    BizModelType,
    IBusinessIndicator,
    formatError,
    getCoreBusinessIndicatorDetail,
    transformQuery,
} from '@/core'
import { formatTime } from '@/utils'
import { CycleKV } from '../const'
import { Loader } from '@/ui'
import { useBusinessModelContext } from '../BusinessModelProvider'

const labelText = (text: any) => {
    return text || '--'
}

interface IDetail {
    onClose: () => void
    id: any
    getContainer?: any
    style?: React.CSSProperties
    mask?: boolean
}

function Detail({
    onClose,
    id,
    getContainer = false,
    style = { position: 'absolute', top: '53px' },
    mask = false,
}: IDetail) {
    const [data, setData] = useState<IBusinessIndicator>()
    const [loading, setLoading] = useState<boolean>(false)
    const { businessModelType, isDraft, selectedVersion } =
        useBusinessModelContext()
    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])
    const getData = async (indicatorId: string) => {
        try {
            setLoading(true)
            const ret: IBusinessIndicator =
                await getCoreBusinessIndicatorDetail(indicatorId, versionParams)
            setData(ret)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const container = useRef<any>(null)
    const { Link } = Anchor

    useEffect(() => {
        getData(id)
    }, [id])

    return (
        <Drawer
            width={640}
            title={
                businessModelType === BizModelType.BUSINESS
                    ? __('业务指标详情')
                    : __('数据指标详情')
            }
            placement="right"
            closable
            onClose={() => {
                onClose()
            }}
            mask={mask}
            open
            getContainer={getContainer}
            bodyStyle={{
                padding: '4px 0 24px 24px',
            }}
            style={style}
            className={styles['detail-wrapper']}
            footer={null}
            destroyOnClose
        >
            <div className={styles.configViewWrapper} ref={container}>
                <div className={styles.formContainer}>
                    {loading && <Loader />}
                    <div
                        className={styles['detail-wrapper-content']}
                        hidden={loading}
                    >
                        <div
                            className={styles['detail-wrapper-content-title']}
                            id="business-indictor-basic"
                        >
                            {__('基本信息')}
                        </div>
                        <table>
                            <tbody>
                                <tr>
                                    <td>{__('指标名称')}</td>
                                    <td>{labelText(data?.name)}</td>
                                </tr>
                                <tr>
                                    <td>{__('指标编号')}</td>
                                    <td>{labelText(data?.code)}</td>
                                </tr>
                                <tr>
                                    <td>{__('描述')}</td>
                                    <td
                                        className={
                                            styles[
                                                'detail-wrapper-content-description'
                                            ]
                                        }
                                    >
                                        <div>
                                            {labelText(data?.description)}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div
                            className={styles['detail-wrapper-content-title']}
                            id="business-indictor-statistics"
                        >
                            {__('统计信息')}
                        </div>
                        <table>
                            <tbody>
                                <tr>
                                    <td>{__('计算公式')}</td>
                                    <td>
                                        {labelText(data?.calculation_formula)}
                                    </td>
                                </tr>
                                <tr>
                                    <td>{__('指标单位')}</td>
                                    <td>{labelText(data?.unit)}</td>
                                </tr>
                                <tr>
                                    <td>{__('统计周期')}</td>
                                    <td>
                                        {labelText(
                                            CycleKV?.[data?.statistics_cycle!],
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td>{__('统计口径')}</td>
                                    <td
                                        className={
                                            styles[
                                                'detail-wrapper-content-caliber'
                                            ]
                                        }
                                    >
                                        <div>
                                            {labelText(
                                                data?.statistical_caliber,
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div
                            className={styles['detail-wrapper-content-title']}
                            id="business-indictor-manager"
                        >
                            {__('管理属性')}
                        </div>
                        <table>
                            <tbody>
                                <tr>
                                    <td>{__('创建人')}</td>
                                    <td>{labelText(data?.creator_name)}</td>
                                </tr>
                                <tr>
                                    <td>{__('创建时间')}</td>
                                    <td>
                                        {labelText(
                                            formatTime(
                                                (data?.created_at as number) ||
                                                    '',
                                            ),
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td>{__('修改人')}</td>
                                    <td>{labelText(data?.updater_name)}</td>
                                </tr>
                                <tr>
                                    <td>{__('修改时间')}</td>
                                    <td>
                                        {labelText(
                                            formatTime(
                                                (data?.updated_at as number) ||
                                                    '',
                                            ),
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className={styles.menuContainer}>
                    <Anchor
                        targetOffset={160}
                        getContainer={() =>
                            (container.current as HTMLElement) || window
                        }
                        className={styles.anchorWrapper}
                        onClick={(e: any) => {
                            e.preventDefault()
                        }}
                    >
                        <Link
                            href="#business-indictor-basic"
                            title={__('基本信息')}
                        />
                        <Link
                            href="#business-indictor-statistics"
                            title={__('统计信息')}
                        />
                        <Link
                            href="#business-indictor-manager"
                            title={__('管理属性')}
                        />
                    </Anchor>
                </div>
            </div>
        </Drawer>
    )
}

export default Detail
