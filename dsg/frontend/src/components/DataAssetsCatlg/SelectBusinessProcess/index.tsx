import React, {
    useState,
    useEffect,
    forwardRef,
    useImperativeHandle,
} from 'react'
import { Button, Dropdown, Space } from 'antd'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import BusinessDomainTree from '@/components/BusiArchitecture/BusinessDomainTree'

interface ISelectProcess {
    onChange?: (value: any, valueObj?: any) => void
    value?: any
}
const SelectBusinessProcess = forwardRef((props: ISelectProcess, ref) => {
    const { onChange, value } = props
    const [selectedNodeList, setSelectedNodeList] = useState<any[]>([])
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false)
    const [labelText, setLabelText] = useState<string>(__('业务流程不限'))

    useEffect(() => {
        if (!selectedNodeList?.length) {
            setLabelText(__('业务流程不限'))
            onChange?.([])
        } else {
            const label = selectedNodeList?.map((item) => item.name)
            const ids = selectedNodeList?.map((item) => item.id)
            onChange?.(ids)
            setLabelText(label.join('、'))
        }
    }, [selectedNodeList])

    useImperativeHandle(ref, () => ({
        handleClear,
    }))

    const handleClear = () => {
        setSelectedNodeList([])
    }

    const dropdownRender = () => {
        return (
            <div className={styles.filterDropDown}>
                <div className={styles.clearFilterItem}>
                    <div>{__('选择业务流程')}</div>
                    <Button
                        type="link"
                        disabled={!selectedNodeList?.length}
                        className={styles.filterBtn}
                        onClick={() => {
                            onChange?.([])
                            setSelectedNodeList([])
                        }}
                    >
                        {__('重置筛选')}
                    </Button>
                </div>
                <BusinessDomainTree
                    getSelectedKeys={(node: any) => {
                        setSelectedNodeList(node)
                    }}
                    placeholder={__('搜索业务流程')}
                    placeholderWith={125}
                    isIncludeProcess
                    isShowAll={false}
                    isOnlySelectProcess
                    isInitCheck={false}
                    selectedNode={selectedNodeList}
                    isMultiple
                    filterType={['process']}
                    showCheckBox
                />
            </div>
        )
    }

    return (
        <div className={styles.selectBusinessProcessWrapper}>
            <Dropdown
                dropdownRender={() => dropdownRender()}
                getPopupContainer={(n) => n}
                trigger={['click']}
                onOpenChange={(open) => {
                    setDropdownOpen(open)
                }}
                open={dropdownOpen}
            >
                <div
                    className={styles.dropDownLabel}
                    onClick={(e) => e.preventDefault()}
                >
                    <Space style={{ display: 'flex' }}>
                        <span title={labelText} className={styles.labelText}>
                            {labelText}
                        </span>
                        {dropdownOpen ? <UpOutlined /> : <DownOutlined />}
                    </Space>
                </div>
            </Dropdown>
        </div>
    )
})

export default SelectBusinessProcess
