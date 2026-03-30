import { Tooltip } from 'antd'
import React, { useState } from 'react'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import __ from './locale'
import { LoginEntityAttribute } from '@/core'

interface ITagDetails {
    attribute: LoginEntityAttribute
}
const TagDetails: React.FC<ITagDetails> = ({ attribute }) => {
    const [open, setOpen] = useState(false)

    return (
        <Tooltip
            title={
                <span style={{ color: '#000' }}>{attribute.label_name}</span>
            }
            placement="bottom"
            color="#fff"
        >
            <FontIcon
                name="icon-biaoqianicon"
                className={styles.standardIcon}
                style={{ color: attribute.label_icon }}
            />
        </Tooltip>
        // <Tooltip
        //     open={open}
        //     autoAdjustOverflow={false}
        //     color="white"
        //     overlayClassName={classNames(
        //         styles.standardToolTip,
        //         styles.tagToolTip,
        //     )}
        //     title={
        //         <div
        //             className={styles.standardDetailsWrapper}
        //             onClick={(e) => {
        //                 e.stopPropagation()
        //             }}
        //         >
        //             <div className={styles.titles}>
        //                 {__('数据分级')}
        //                 <CloseOutlined
        //                     className={styles.closeIcon}
        //                     onClick={() => setOpen(false)}
        //                 />
        //             </div>
        //             <div className={styles.detailsInfo}>
        //                 <FontIcon
        //                     name="icon-biaoqianicon"
        //                     style={{ color: attribute.label_icon }}
        //                 />
        //                 <span className={styles.tagName}>
        //                     {attribute.label_name}
        //                 </span>
        //                 <div className={styles.tagOrigin}>
        //                     {__('来源：${name}', { name: '数据标准' })}
        //                 </div>
        //             </div>
        //         </div>
        //     }
        //     getPopupContainer={(node) => node.parentElement as HTMLElement}
        //     placement="topLeft"
        // >
        //     <Tooltip title={__('数据分级')} placement="bottom">
        //         <div
        //             className={classNames(styles['standard-icon-container'])}
        //             onClick={(e) => {
        //                 e.stopPropagation()
        //                 setOpen(true)
        //             }}
        //         >
        //             <FontIcon
        //                 name="icon-biaoqianicon"
        //                 className={styles.standardIcon}
        //                 style={{ color: attribute.label_icon }}
        //             />
        //         </div>
        //     </Tooltip>
        // </Tooltip>
    )
}

export default TagDetails
