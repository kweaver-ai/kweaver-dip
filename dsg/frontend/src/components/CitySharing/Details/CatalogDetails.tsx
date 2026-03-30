import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSize } from 'ahooks'
import __ from '../locale'
import styles from './styles.module.less'
import DetailsContent from './DetailsContent'
import {
    databaseDesignMaterial,
    dataCatalogInfo,
    DownloadFile,
    resourceUsageConfig,
} from './helper'
import { ISharedDeclarationCatalogInfo, ISharedDeclarationDetail } from '@/core'
import { GroupSubHeader } from '../helper'
import CatalogList from '../component/CatalogList'
import { useDict } from '@/hooks/useDict'
import { ApplyResource } from '../const'

interface ICatalogDetails {
    detailsData?: ISharedDeclarationDetail // 目录详情
}

/**
 * 目录详情
 */
const CatalogDetails: React.FC<ICatalogDetails> = ({
    detailsData = undefined,
}) => {
    const [dict, getDict] = useDict()
    const contentRef = useRef<HTMLDivElement>(null)
    const contentSize = useSize(contentRef)

    // 选中目录
    const [selectedCatalog, setSelectedCatalog] =
        useState<ISharedDeclarationCatalogInfo>()

    useEffect(() => {
        if (detailsData?.declaration_catalog_info) {
            setSelectedCatalog(detailsData?.declaration_catalog_info?.[0])
        }
    }, [detailsData])

    // 选中目录的详情数据
    const catalogDetailsData = useMemo(
        () =>
            detailsData?.declaration_catalog_info?.find(
                (c) => c.catalog_id === selectedCatalog?.catalog_id,
            ),
        [selectedCatalog],
    )

    // 选中目录的详情配置
    const catalogDetailConfig = useMemo(() => {
        const config: any[] = [
            dataCatalogInfo,
            {
                ...resourceUsageConfig,
                content: resourceUsageConfig.content.filter(
                    (c) =>
                        c.key !==
                        (selectedCatalog?.resource_provision_method ===
                        ApplyResource.Database
                            ? 'expected_call_frequency'
                            : 'expected_update_frequency'),
                ),
            },
        ]
        // 库表类型
        if (
            selectedCatalog?.resource_provision_method ===
                ApplyResource.Database &&
            catalogDetailsData?.database_design_materials_ids?.length
        ) {
            config.push({
                ...databaseDesignMaterial,
                render: () => (
                    <div className={styles.detailsGroup_downloadList}>
                        {catalogDetailsData?.database_design_materials_ids?.map(
                            (item) =>
                                item?.name ? (
                                    <DownloadFile data={item} />
                                ) : (
                                    '--'
                                ),
                        )}
                    </div>
                ),
            })
        }
        return config
    }, [catalogDetailsData])

    return (
        <div className={styles.catalogDetails}>
            <GroupSubHeader text={__('目录列表')} />
            <div className={styles['catalogDetails-content']}>
                <CatalogList
                    items={detailsData?.declaration_catalog_info}
                    selectedCatalog={selectedCatalog}
                    onItemClick={setSelectedCatalog}
                    style={{ maxHeight: contentSize?.height || 0 }}
                />
                <div
                    ref={contentRef}
                    className={styles['catalogDetails-content-details']}
                >
                    <DetailsContent
                        data={catalogDetailsData}
                        config={catalogDetailConfig}
                    />
                </div>
            </div>
        </div>
    )
}
export default CatalogDetails
