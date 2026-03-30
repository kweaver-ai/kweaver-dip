import { FC, useState, useRef, useEffect } from 'react'
import { Radio, Select } from 'antd'
import Icon from '@ant-design/icons'
import { SelectFilterMenu, SelectFilterOptions } from './const'
import styles from './styles.module.less'
import __ from './locale'
import GlossaryDirTree from '../BusinessDomain/GlossaryDirTree'
import ArchitectureDirTree from '../BusinessArchitecture/ArchitectureDirTree'
import { Architecture } from '../BusinessArchitecture/const'
import { BusinessDomainType } from '../BusinessDomain/const'
import { getDimensionModels } from '@/core'
import { ReactComponent as basicInfo } from '@/assets/DataAssetsCatlg/basicInfo.svg'

interface SelectedFilterTreeType {
    onChange: (value) => void
    extraFunc?: () => void
}
const SelectedFilterTree: FC<SelectedFilterTreeType> = ({
    onChange,
    extraFunc = () => {},
}) => {
    const [selectedMenu, setSelectedMenu] = useState<SelectFilterMenu>(
        SelectFilterMenu.BUSSINESSDOMAIN,
    )

    const treeRef: any = useRef()

    const [selectedNode, setSelectedNode] = useState<any>({})

    const [isEmpty, setIsEmpty] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    // 所有维度模型列表
    const [dimensionalModelList, setDimensionalModelList] = useState<
        Array<any>
    >([])

    // 搜索维度模型
    const [searchModelKey, setSearchModelKey] = useState<string>('')

    // 显示的维度模型数据
    const [showModelList, setShowModelList] = useState<Array<any>>([])

    // 总维度模型数量
    const [totalCount, setTotalCount] = useState<number>(0)
    // 选中数据信息
    const [selectedInfo, setSelectedInfo] = useState<{
        id: string
        type: SelectFilterMenu
        isAll: boolean
    }>({
        id: '',
        type: SelectFilterMenu.BUSSINESSDOMAIN,
        isAll: true,
    })

    const [searchTootipStatus, setSearchTootipStatus] = useState<boolean>(false)
    const [flag, setFlag] = useState<boolean>(true)

    useEffect(() => {
        // 组织架构会setSelectedNode 两次，type不能直接是默认的，需要匹配当前的type
        if (selectedNode) {
            if (selectedNode.name === '全部') {
                setSelectedInfo({
                    id: '',
                    type: selectedInfo.type || SelectFilterMenu.BUSSINESSDOMAIN,
                    isAll: true,
                })
            } else {
                setSelectedInfo({
                    id: selectedNode.id,
                    type: selectedNode.type || selectedInfo.type,
                    isAll: false,
                })
            }
        }
    }, [selectedNode])

    useEffect(() => {
        getInitModelData([])
    }, [searchModelKey])

    useEffect(() => {
        onChange({
            id: selectedInfo.id ? selectedInfo.id : '',
            type: selectedInfo.type
                ? selectedInfo.type
                : SelectFilterMenu.BUSSINESSDOMAIN,
            isAll: selectedInfo.id === '',
        })
    }, [selectedInfo])

    const getInitModelData = async (initData) => {
        const { entries, total_count } = await getDimensionModels({
            offset: initData.length ? initData.length / 50 + 1 : 1,
            limit: 50,
            keyword: searchModelKey,
        })
        setTotalCount(total_count)
        setDimensionalModelList(entries)
        setShowModelList([...initData, ...entries])
    }

    return (
        <div className={styles.selectedFilter}>
            <div className={styles.filterTab}>
                {SelectFilterOptions?.length === 1 ? (
                    <span className={styles.modeTitle}>
                        {SelectFilterOptions?.[0].label}
                    </span>
                ) : SelectFilterOptions?.length === 2 ? (
                    <Radio.Group
                        onChange={(e) => {
                            setSelectedMenu(e.target.value)
                            setSelectedInfo({
                                id: '',
                                type: e.target.value,
                                isAll: true,
                            })
                            extraFunc()
                        }}
                        defaultValue={selectedMenu}
                        className={styles.radioGroup}
                    >
                        {SelectFilterOptions.map((item) => (
                            <Radio.Button
                                value={item.value}
                                className={styles.groupButton}
                            >
                                {item.label}
                            </Radio.Button>
                        ))}
                    </Radio.Group>
                ) : (
                    <div className={styles.viewWrapper}>
                        <Icon component={basicInfo} />
                        <Select
                            defaultValue={selectedMenu}
                            bordered={false}
                            options={SelectFilterOptions}
                            onChange={(value) => {
                                setSelectedMenu(value)
                                setSelectedInfo({
                                    id: '',
                                    type: value,
                                    isAll: true,
                                })
                                extraFunc()
                            }}
                            className={styles.viewSelect}
                            getPopupContainer={(n) => n}
                        />
                    </div>
                )}
            </div>
            {selectedMenu === SelectFilterMenu.BUSSINESSDOMAIN && (
                <div className={styles.bussinessDomain} key={selectedMenu}>
                    <GlossaryDirTree
                        ref={treeRef}
                        getSelectedKeys={(selectedValue) => {
                            setSelectedNode({
                                ...selectedValue,
                                type:
                                    selectedValue?.type ===
                                    SelectFilterMenu.BUSSINESSDOMAIN
                                        ? SelectFilterMenu.BUSSINESSDOMAIN
                                        : SelectFilterMenu.SUBJECTDOMAIN,
                            })
                        }}
                        filterType={[
                            BusinessDomainType.subject_domain_group,
                            BusinessDomainType.subject_domain,
                            BusinessDomainType.business_object,
                            BusinessDomainType.business_activity,
                        ]}
                        limitTypes={[
                            BusinessDomainType.business_object,
                            BusinessDomainType.business_activity,
                        ]}
                        placeholder={__(
                            '搜索主题域分组、主题域、业务对象/活动',
                        )}
                        needUncategorized={flag}
                    />
                </div>
            )}
            {selectedMenu === SelectFilterMenu.ORGNIZATION && (
                <div className={styles.bussinessDomain} key={selectedMenu}>
                    <ArchitectureDirTree
                        getSelectedNode={setSelectedNode}
                        filterType={[
                            Architecture.ORGANIZATION,
                            Architecture.DEPARTMENT,
                        ].join()}
                        canEmpty={false}
                        // placeholder={__('搜索组织、部门')}
                        needUncategorized={flag}
                    />
                </div>
            )}
        </div>
    )
}

export default SelectedFilterTree
