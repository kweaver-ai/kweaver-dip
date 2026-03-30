import React, { useEffect, useState } from 'react'
import styles from './styles.module.less'
import __ from './locale'
import MultiTypeSelectTree from '@/components/MultiTypeSelectTree'
import { TreeType } from '@/components/MultiTypeSelectTree/const'
import { DataSourceOrigin } from '@/components/DataSource/helper'

interface IProps {
    onSelectNode: (value: any) => void
}

const ClassifyView = ({ onSelectNode }: IProps) => {
    return (
        <div className={styles.classifyView}>
            <MultiTypeSelectTree
                enabledTreeTypes={[TreeType.Department, TreeType.DataSource]}
                onSelectedNode={onSelectNode}
                showUnCategorized
                treePropsConfig={{
                    [TreeType.Department]: {
                        needUncategorized: false,
                    },
                    [TreeType.DataSource]: {
                        filterDataSourceTypes: [
                            DataSourceOrigin.INFOSYS,
                            DataSourceOrigin.DATASANDBOX,
                        ],
                    },
                }}
            />
        </div>
    )
}

export default ClassifyView
