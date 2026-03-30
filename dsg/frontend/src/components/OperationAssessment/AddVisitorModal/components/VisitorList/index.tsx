import React, { memo } from 'react'
import classnames from 'classnames'
import { CloseOutlined } from '@/icons'
import VisitorLabel from '../VisitorLabel/index'
import __ from './locale'
import styles from './styles.module.less'
import { OptionType } from '../../const'

const VisitorItem = memo(({ data, onDelete }: any) => {
    return (
        <div className={styles['visitor-item']}>
            <VisitorLabel data={data} />
            <div
                onClick={() => onDelete(data.id)}
                className={styles['visitor-item-close']}
            >
                <CloseOutlined />
            </div>
        </div>
    )
})

function VisitorList({
    items,
    clearItems,
    optItem,
}: {
    items: any[]
    clearItems: () => void
    optItem: (type: OptionType, value: any) => void
}) {
    const handleClear = () => {
        clearItems()
    }

    const removeItem = (id: string) => {
        optItem(OptionType.Remove, { id })
    }

    return (
        <div className={styles['visitor-list']}>
            <div className={styles['visitor-list-top']}>
                <div>{__('已选择')}</div>
                <div>
                    <span
                        className={
                            !items?.length ? styles['no-select'] : undefined
                        }
                        onClick={() => items?.length && handleClear()}
                    >
                        {__('全部清除')}
                    </span>
                </div>
            </div>
            <div
                className={classnames({
                    [styles['visitor-list-visitors']]: true,
                    [styles['is-scroll']]: items?.length > 10,
                })}
            >
                {items?.map((item) => (
                    <VisitorItem
                        key={item.id}
                        data={item}
                        onDelete={removeItem}
                    />
                ))}
            </div>
        </div>
    )
}

export default VisitorList
