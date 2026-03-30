import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { TreeSelect, TreeSelectProps } from 'antd'
import { FormInstance } from 'antd/es/form/Form'
import { noop } from 'lodash'
import { DownOutlined } from '@ant-design/icons'
import __ from './locale'
import { IObject, getObjects, IGetObject, formatError } from '@/core'
import { Architecture } from '../BusinessArchitecture/const'
import Icons from '../BusinessArchitecture/Icons'
import styles from './styles.module.less'

interface DepartmentAndOrgSelectType {
    value?: string
    placeholder?: string
    status?: any
    onChange?: (value: string) => void
    getRules?: (rulers) => void
    getInitValueError?: (result: string) => void
}

const DepartmentAndOrgSelect1 = forwardRef(
    (
        {
            value,
            status,
            placeholder = __('组织/部门名称'),
            onChange,
            getRules,
            getInitValueError = noop,
        }: DepartmentAndOrgSelectType,
        ref,
    ) => {
        const [treeData, setTreeData] = useState<any>([])
        const [allDepartmentData, setAllDepartmentData] = useState<
            Array<IObject>
        >([])

        useEffect(() => {
            // getTreeData()
            // 初始查全部组织
            getNodeObjects({
                limit: 0,
                id: '',
                is_all: false,
                type: Architecture.ORGANIZATION,
            })
        }, [])

        useImperativeHandle(ref, () => ({
            treeData,
        }))

        // useEffect(() => {
        //     if (
        //         value &&
        //         allDepartmentData.length &&
        //         !allDepartmentData.find((item) => item.id === value)
        //     ) {
        //         getInitValueError(__('已被删除，请重新选择'))
        //     }
        // }, [value, allDepartmentData])

        // const getTreeData = async () => {
        //     const { entries } = await getObjects({
        //         is_all: true,
        //         id: '',
        //         type: `${Architecture.ORGANIZATION},${Architecture.DEPARTMENT}`,
        //         limit: 0,
        //     })
        //     setAllDepartmentData(entries)
        //     generateTreeDataOption(entries)
        // }

        // const generateTreeDataOption = (departments: Array<IObject>) => {
        //     const currentData = departments
        //         .map((department) => ({
        //             ...department,
        //             path_id: department?.path_id?.split('/') || [department.id],
        //         }))
        //         .reduce((preData, department) => {
        //             if (preData?.[department.path_id.length]) {
        //                 return {
        //                     ...preData,
        //                     [department.path_id.length]: [
        //                         ...preData[department.path_id.length],
        //                         department,
        //                     ],
        //                 }
        //             }
        //             return {
        //                 ...preData,
        //                 [department.path_id.length]: [department],
        //             }
        //         }, {})
        //     setTreeData(setTreeNodeOption(currentData, 1, ''))
        // }

        // const setTreeNodeOption = (departmentData, level: number, fatherId) => {
        //     if (fatherId) {
        //         const currentDepartments = departmentData[level].filter(
        //             (department) => {
        //                 return department?.path_id?.includes(fatherId)
        //             },
        //         )
        //         if (currentDepartments.length) {
        //             return currentDepartments.map((department) => ({
        //                 value: department.id,
        //                 title: department.name,
        //                 children: departmentData[level + 1]?.length
        //                     ? setTreeNodeOption(
        //                           departmentData,
        //                           Number(level) + 1,
        //                           department.id,
        //                       )
        //                     : [],
        //             }))
        //         }
        //         return []
        //     }
        //     return (
        //         departmentData[level]?.map((department) => ({
        //             value: department.id,
        //             title: department.name,
        //             children: departmentData[level + 1]?.length
        //                 ? setTreeNodeOption(
        //                       departmentData,
        //                       Number(level) + 1,
        //                       department.id,
        //                   )
        //                 : [],
        //         })) || []
        //     )
        // }

        const getNodeObjects = async (params: IGetObject) => {
            try {
                const res = await getObjects(params)
                setTreeData(
                    res.entries.map((node) => ({
                        ...node,
                        isLeaf: !node.expand,
                        title: node.name,
                        name: <span title={node?.path}>{node.name}</span>,
                        pId: '',
                        icon: <Icons type={node.type as Architecture} />,
                    })),
                )
            } catch (error) {
                formatError(error)
            }
        }

        const onLoadData: TreeSelectProps['loadData'] = async ({
            id,
            type,
        }) => {
            const res = await getObjects({
                limit: 0,
                id,
                is_all: false,
            })
            setTreeData(
                treeData.concat(
                    res.entries
                        .map((node) => ({
                            ...node,
                            title: node.name,
                            name: <span title={node?.path}>{node.name}</span>,
                            pId: id,
                            isLeaf: !node.expand,
                            icon: <Icons type={node.type as Architecture} />,
                        }))
                        .filter((node) =>
                            [
                                Architecture.ORGANIZATION,
                                Architecture.DEPARTMENT,
                            ].includes(node.type as Architecture),
                        ),
                ),
            )
        }

        return (
            // <TreeSelect
            //     showSearch
            //     value={value}
            //     placeholder={placeholder}
            //     allowClear
            //     treeDefaultExpandAll
            //     onChange={onChange}
            //     treeData={treeData}
            //     treeNodeFilterProp="title"
            //     getPopupContainer={(node) => node.parentNode}
            // />
            <TreeSelect
                treeDataSimpleMode
                getPopupContainer={(node) => node.parentNode}
                style={{ width: '100%' }}
                dropdownStyle={{
                    width: '100%',
                    maxHeight: 400,
                    overflow: 'auto',
                }}
                value={value}
                // onChange={(value) => {
                //     setDepId(value)
                //     getOrgName(value)
                //     form.setFieldValue('owner_id', null)
                // }}
                onChange={onChange}
                dropdownMatchSelectWidth={false}
                placeholder={placeholder || __('请选择所属部门')}
                loadData={onLoadData}
                treeData={treeData}
                status={status}
                switcherIcon={<DownOutlined />}
                fieldNames={{
                    label: 'name',
                    value: 'id',
                }}
                popupClassName={styles.orgTreeSelect}
                treeIcon
                // allowClear
            />
        )
    },
)

export default DepartmentAndOrgSelect1
