import React, { memo, useEffect, useState } from 'react'
import { Radio } from 'antd'
import { useSearchParams } from 'react-router-dom'
import styles from './styles.module.less'
import __ from '../../locale'
import AccessDomainTree from './AccessDomainTree'
import ArchitectureTree from './ArchitectureTree'
import { Architecture } from '@/components/BusinessArchitecture/const'
import { SwitchMode, SwitchOptions } from '../../const'
import { AssetTypeEnum } from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface IAccessTree {
    onSelect?: (node: any) => void
}

function AccessTree({ onSelect }: IAccessTree) {
    const [searchParams] = useSearchParams()
    const [mode, setMode] = useState<SwitchMode>(SwitchMode.DOMAIN)
    const [ownerId] = useCurrentUser('ID')
    const currentType = searchParams.get('type') || AssetTypeEnum.DataView

    const handleSelectNode = (node) => {
        let hasAccess = false
        if (mode === SwitchMode.DOMAIN) {
            hasAccess = node?.owners?.includes(ownerId)
        }
        onSelect?.({
            mode,
            id: node.id,
            name: node.name,
            type: node.type,
            hasAccess,
        })
    }

    return (
        <div className={styles['access-tree']}>
            <div className={styles['access-tree-switcher']}>
                <Radio.Group
                    options={SwitchOptions}
                    onChange={(e) => setMode(e.target.value)}
                    value={mode}
                    optionType="button"
                />
            </div>
            <div className={styles['access-tree-content']}>
                {mode === SwitchMode.DOMAIN && (
                    <AccessDomainTree
                        type={currentType}
                        getSelectedKeys={(node) =>
                            node && handleSelectNode(node)
                        }
                        needUncategorized
                        unCategorizedKey="uncategory"
                    />
                )}

                {mode === SwitchMode.ARCHITECTURE && (
                    <ArchitectureTree
                        getSelectedNode={(node) =>
                            node && handleSelectNode(node)
                        }
                        hiddenType={[
                            Architecture.BMATTERS,
                            Architecture.BSYSTEM,
                            Architecture.COREBUSINESS,
                        ]}
                        filterType={[
                            Architecture.ORGANIZATION,
                            Architecture.DEPARTMENT,
                        ].join(',')}
                        needUncategorized
                        unCategorizedKey="uncategory"
                    />
                )}
            </div>
        </div>
    )
}

export default memo(AccessTree)
