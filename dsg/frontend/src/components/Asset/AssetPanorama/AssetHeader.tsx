import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LeftOutlined } from '@ant-design/icons'
import AssetSearch from './components/AssetSearch'
import { IDataViewItem } from './helper'
import __ from './locale'
import styles from './styles.module.less'

interface IAssetHeader {
    onSearchSelect?: (item: IDataViewItem) => void
    title: string
}

function AssetHeader({ onSearchSelect, title }: IAssetHeader) {
    const navigator = useNavigate()
    const handleBack = () => {
        navigator(-1)
    }

    return (
        <div className={styles['asset-header']}>
            <div className={styles['asset-header-title']}>
                <div className={styles['backBar-btn']} onClick={handleBack}>
                    <LeftOutlined style={{ fontSize: 16 }} />
                    <span className={styles.returnText}>{__('返回')}</span>
                </div>
                <div className={styles['backBar-title']}>{title}</div>
            </div>
            <div className={styles['asset-header-search']}>
                <AssetSearch onSelect={onSearchSelect} />
                {/* <Tooltip title={__('一键收起')} placement="bottom">
                    <span
                        className={styles['icon-shrink']}
                        onClick={() =>
                            setShrink(new Date().toLocaleTimeString())
                        }
                    >
                        <AssetShrinkOutlined style={{ fontSize: '28px' }} />
                    </span>
                </Tooltip> */}
            </div>
        </div>
    )
}

export default memo(AssetHeader)
