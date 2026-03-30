import { Drawer, type DrawerProps } from 'antd'
import { useEffect, useState } from 'react'
import moment from 'moment'
import { formatError, getDesenDetails } from '@/core'
import LabelTitle from './LabelTitle'
import __ from './locale'
import { methodMap } from '.'
import styles from './styles.module.less'
import { DesenMethods } from './Config'

export interface DesensitizationDetail {
    id: string
    name: string
    updated_by_name: string
    created_by_name: string
    description: string
    algorithm: string
    method: string
    updated_at: string
    created_at: string
    middle_bit?: number
    tail_bit?: number
    head_bit?: number
}

interface DetailsProps extends DrawerProps {
    detailsId?: string
}

const Details = (props: DetailsProps) => {
    const { open, detailsId, ...restProps } = props

    const [details, setDetails] = useState<DesensitizationDetail>(
        {} as DesensitizationDetail,
    )

    const getDetails = async (objId: string) => {
        try {
            // TODO:接口待联调
            const res = await getDesenDetails(objId)
            setDetails(res)
        } catch (error) {
            setDetails({} as DesensitizationDetail)
            formatError(error)
        }
    }

    useEffect(() => {
        if (open && detailsId) {
            getDetails(detailsId)
        } else {
            setDetails({} as DesensitizationDetail)
        }
    }, [open, detailsId])

    const getMethodBit = () => {
        let str: string = ''
        if (details.method === DesenMethods.BAE) {
            str = `(首部脱敏${details.head_bit || '0'}位，尾部脱敏${
                details.tail_bit || '0'
            }位)`
        } else if (details.method === DesenMethods.CENTER) {
            str = `(中间脱敏${details.middle_bit || '0'}位)`
        }
        return str
    }

    return (
        <Drawer
            title={__('脱敏算法详情')}
            open={open}
            mask={false}
            width={1024}
            getContainer={false}
            rootStyle={{ position: 'absolute' }}
            bodyStyle={{ padding: '16px 24px 0' }}
            {...restProps}
        >
            <div className={styles.detailsWrapper}>
                <LabelTitle
                    label={__('基本属性')}
                    style={{ marginBottom: '16px' }}
                />
                <div className={styles.detailRow}>
                    <span>{__('算法名称')}：</span>
                    <span>{details.name ?? '--'}</span>
                </div>
                <div className={styles.detailRow}>
                    <span>{__('描述')}：</span>
                    <span>{details.description ?? '--'}</span>
                </div>
                <div className={styles.detailRow}>
                    <span>{__('脱敏算法')}：</span>
                    <span>{details.algorithm ?? '--'}</span>
                </div>
                <div className={styles.detailRow}>
                    <span>{__('脱敏方式')}：</span>
                    <span>{methodMap[details.method] ?? '--'}</span>
                    <span className={styles.detailDes}>{getMethodBit()}</span>
                </div>
            </div>
            <div className={styles.detailsWrapper}>
                <LabelTitle
                    label={__('更新信息')}
                    style={{ marginBottom: '16px' }}
                />
                <div className={styles.detailRow}>
                    <span>{__('创建人')}：</span>
                    <span style={{ color: 'rgb(0 0 0 / 85%)' }}>
                        {details.created_by_name ?? '--'}
                    </span>
                </div>
                <div className={styles.detailRow}>
                    <span>{__('创建时间')}：</span>
                    <span>
                        {details.updated_at
                            ? moment(details.updated_at).format(
                                  'YYYY-MM-DD HH:mm:ss',
                              )
                            : '--'}
                    </span>
                </div>
                <div className={styles.detailRow}>
                    <span>{__('更新人')}：</span>
                    <span>{details.updated_by_name ?? '--'}</span>
                </div>
                <div className={styles.detailRow}>
                    <span>{__('更新时间')}：</span>
                    <span>
                        {details.updated_at
                            ? moment(details.updated_at).format(
                                  'YYYY-MM-DD HH:mm:ss',
                              )
                            : '--'}
                    </span>
                </div>
            </div>
        </Drawer>
    )
}

export default Details
