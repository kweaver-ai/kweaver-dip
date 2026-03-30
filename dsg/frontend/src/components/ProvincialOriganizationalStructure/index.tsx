import React, { useEffect, useState } from 'react'
import { Button } from 'antd'
import { SyncOutlined } from '@ant-design/icons'
import ProvinceOriganTree from './ProvinceOrganTree'
import DragBox from '../DragBox'
import styles from './styles.module.less'
import ProvinceOrganTable from './ProvinceOrganTable'
import { Empty, Loader } from '@/ui'
import __ from './locale'
import { ISSZDOrganization, getSSZDOrganization } from '@/core'

const ProvincialOriganizationalStructure = () => {
    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])
    const [treeData, setTreeData] = useState<ISSZDOrganization[]>([])
    const [pageLoading, setPageLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedNodeCode, setSelectedNodeCode] = useState<string>('')

    const getFirstlevelData = async (needPageLoading = true) => {
        try {
            if (needPageLoading) {
                setPageLoading(true)
            }
            const res = await getSSZDOrganization()
            setTreeData(res.entries)
        } catch (e) {
            setTreeData([])
        } finally {
            if (needPageLoading) {
                setPageLoading(false)
            } else {
                setLoading(false)
            }
        }
    }

    useEffect(() => {
        getFirstlevelData()
    }, [])

    return (
        <div className={styles['province-org-wrapper']}>
            {pageLoading ? (
                <Loader />
            ) : treeData.length === 0 ? (
                <div className={styles['empty-container']}>
                    <Empty
                        desc={
                            <>
                                <div>{__('加载失败')}</div>
                                <div>{__('点击下方按钮，重新获取数据')}</div>
                            </>
                        }
                    />
                    <Button
                        className={styles['reload-btn']}
                        onClick={() => {
                            setLoading(true)
                            getFirstlevelData(false)
                        }}
                        icon={<SyncOutlined spin={loading} />}
                    >
                        {loading ? `${__('加载中')}...` : __('重新加载')}
                    </Button>
                </div>
            ) : (
                <DragBox
                    defaultSize={defaultSize}
                    minSize={[220, 270]}
                    maxSize={[800, Infinity]}
                    onDragEnd={(size) => {
                        setDefaultSize(size)
                    }}
                >
                    <div className={styles.left}>
                        <ProvinceOriganTree
                            initData={treeData}
                            getSelectedNode={(code) =>
                                setSelectedNodeCode(code)
                            }
                        />
                    </div>
                    <div className={styles.right}>
                        <ProvinceOrganTable code={selectedNodeCode} />
                    </div>
                </DragBox>
            )}
        </div>
    )
}

export default ProvincialOriganizationalStructure
