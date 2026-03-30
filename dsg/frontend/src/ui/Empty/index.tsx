import React, { DetailedHTMLProps, HTMLAttributes } from 'react'
import { Button } from 'antd'
import empty from '@/assets/searchEmpty.svg'
import styles from './styles.module.less'
import { AddOutlined } from '@/icons'
import __ from './locale'

/**
 * 空 样式组件
 * @interface IEmpty
 * @param {string} iconSrc 图标路径
 * @param {React.ReactElement} desc 描述文字
 */
interface IEmpty
    extends React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLDivElement>,
        HTMLDivElement
    > {
    iconSrc?: any
    iconHeight?: any
    desc?: React.ReactElement | string
    onAdd?: () => void
    btnText?: string
    primary?: boolean
}

const Empty: React.FC<IEmpty> = ({
    iconSrc = empty,
    iconHeight = 144,
    desc = __('抱歉，没有找到相关内容'),
    onAdd,
    btnText = __('新建'),
    primary = true,
    ...props
}) => {
    return (
        <div className={styles.empty} {...props}>
            <img src={iconSrc} alt="SearchEmpty" height={iconHeight} />
            <div className={styles.description}>{desc}</div>
            {onAdd && (
                <Button
                    type={primary ? 'primary' : 'default'}
                    icon={<AddOutlined />}
                    onClick={onAdd}
                    className={styles.btn}
                >
                    {btnText}
                </Button>
            )}
        </div>
    )
}
export default Empty
