import React, { memo } from 'react'
import { CloseOutlined } from '@/icons'
import styles from './styles.module.less'
import VisitorLabel from './VisitorLabel'
import { OptionType, useVisitorModalContext } from './VisitorModalProvider'

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

function VisitorList() {
    const { items, clearItems, optItem } = useVisitorModalContext()

    const handleClear = () => {
        clearItems()
    }

    const removeItem = (id: string) => {
        optItem(OptionType.Remove, id)
    }

    return (
        <div className={styles['visitor-list']}>
            <div className={styles['visitor-list-top']}>
                <div>已选择访问者</div>
                <div>
                    <span
                        className={
                            !items?.length ? styles['no-select'] : undefined
                        }
                        onClick={() => items?.length && handleClear()}
                    >
                        全部清除
                    </span>
                </div>
            </div>
            <div className={styles['visitor-list-visitors']}>
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

export default memo(VisitorList)
