import { Form, message, Cascader, Switch } from 'antd'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { debounce } from 'lodash'
import {
    formatError,
    getRolesFrontendList,
    IRoleDetails,
    getSmsConfig,
    editSmsConfig,
    SmsSwitchStatus,
} from '@/core'
import {
    renderLoader,
    DetailGroupTitle,
    initialValues,
    Mode,
    FooterButtons,
    CascaderOption,
    buildCascaderOptions,
} from './helper'
import __ from './locale'
import styles from './styles.module.less'

const MessagePush = () => {
    const [mode, setMode] = useState<Mode.View | Mode.Edit>(Mode.View)
    const [form] = Form.useForm()
    const [loading, setLoading] = useState<boolean>(true)
    const [fetching, setFetching] = useState<boolean>(false)
    // 是否开启推送
    const [defaultChecked, setDefaultChecked] = useState<boolean>(false)
    // 是否选择了角色
    const [selectedRole, setSelectedRole] = useState<any>(null)
    // 级联选项
    const [options, setOptions] = useState<CascaderOption[]>([])
    // 所有级联选项
    const allOptionsRef = useRef<CascaderOption[]>([])

    // 初始化
    useEffect(() => {
        getData()
    }, [])

    // 获取数据
    const getData = async () => {
        try {
            setLoading(true)
            // 获取角色
            await searchRoles()
            // 获取短信配置
            const smsConfig = await getSmsConfig()
            setDefaultChecked(smsConfig.switch_status === SmsSwitchStatus.On)
            setSelectedRole(smsConfig.push_role_id)

            // 设置表单默认值
            if (smsConfig.push_role_id) {
                // 需要找到对应的级联值 [type, roleId]
                const allRoles = allOptionsRef.current
                let cascaderValue: string[] | null = null

                // 遍历查找匹配的角色
                allRoles.forEach((group) => {
                    if (group.children) {
                        const foundRole = group.children.find(
                            (child) =>
                                child.role?.id === smsConfig.push_role_id,
                        )
                        if (foundRole) {
                            cascaderValue = [group.value, foundRole.value]
                        }
                    }
                })

                if (cascaderValue) {
                    form.setFieldsValue({
                        role_id: cascaderValue,
                    })
                }
            }
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 搜索角色（实际执行搜索的函数）
    const searchRoles = async (value?: string) => {
        try {
            setFetching(true)
            const res = await getRolesFrontendList({
                keyword: value,
                limit: 9999,
            })
            const searchResults = buildCascaderOptions(res?.entries || [])
            if (!value || value === '') {
                allOptionsRef.current = searchResults
            }
            setOptions(searchResults)
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
        }
    }

    // 使用 lodash debounce 实现防抖
    const debouncedSearch = useCallback(
        debounce((value: string) => {
            searchRoles(value)
        }, 500),
        [],
    )

    // 处理搜索
    const onSearch = (value: string) => {
        if (!value.trim()) {
            // 恢复显示全部数据
            setOptions(allOptionsRef.current)
            return
        }

        debouncedSearch(value)
    }

    // 处理表单提交
    const onFinish = async (values) => {
        try {
            // 将级联值转换为角色 ID
            const roleId = values.role_id?.[1]
            await editSmsConfig({
                switch_status: defaultChecked
                    ? SmsSwitchStatus.On
                    : SmsSwitchStatus.Off,
                push_role_id: roleId,
            })
            message.success(__('保存成功'))
            setMode(Mode.View)
        } catch (error) {
            formatError(error)
        }
    }

    const handleSubmit = async () => {
        // 如果开启推送但未选择角色，提示错误
        if (defaultChecked && !selectedRole) {
            message.warning(__('开启推送后请选择角色'))
            return
        }

        try {
            await form.validateFields()
            form.submit()
        } catch (error) {
            // 验证失败
        }
    }

    // 处理下拉框显示状态变化
    const onDropdownVisibleChange = (open: boolean) => {
        if (open) {
            // 恢复显示全部数据
            setOptions(allOptionsRef.current)
        }
    }

    // 自定义显示渲染：只显示角色名
    const displayRender = (labels: string[]) => {
        // labels 格式为 ['内置角色', '角色名'] 或 ['自定义角色', '角色名']
        // 只返回最后一级（角色名）
        return labels[labels.length - 1]
    }

    // 过滤器：用于搜索时的高亮显示
    const filter = (inputValue: string, path: any[]) => {
        return path.some(
            (option) =>
                option.role?.name
                    ?.toLowerCase()
                    .indexOf(inputValue.toLowerCase()) > -1,
        )
    }

    return (
        <div>
            {loading ? (
                renderLoader()
            ) : (
                <Form
                    form={form}
                    initialValues={initialValues}
                    onFinish={onFinish}
                >
                    <div className={styles.messageSetPanel}>
                        <div>
                            <DetailGroupTitle
                                title={__('质量整改、数据服务_供需对接：')}
                                tips={__(
                                    '需质量整改处理、或供需对接资源确认时，给资源提供方的以下角色的用户发送短信',
                                )}
                            >
                                <div className={styles.switchWithTextWrapper}>
                                    <Switch
                                        disabled={mode === Mode.View}
                                        checked={defaultChecked}
                                        onChange={(checked) =>
                                            setDefaultChecked(checked)
                                        }
                                    />
                                    <span className={styles.switchText}>
                                        {defaultChecked
                                            ? __('关闭推送')
                                            : __('开启推送')}
                                    </span>
                                </div>
                            </DetailGroupTitle>
                            <div className={styles.timeInputNumberWrapper}>
                                <Form.Item name="role_id">
                                    <Cascader
                                        style={{ width: 300 }}
                                        disabled={
                                            mode === Mode.View ||
                                            !defaultChecked
                                        }
                                        options={options}
                                        onChange={(value) => {
                                            setSelectedRole(value)
                                        }}
                                        onSearch={onSearch}
                                        onDropdownVisibleChange={
                                            onDropdownVisibleChange
                                        }
                                        placeholder={__('请选择角色')}
                                        showSearch={{ filter }}
                                        displayRender={displayRender}
                                        allowClear
                                        notFoundContent={
                                            fetching
                                                ? __('加载中...')
                                                : __('暂无数据')
                                        }
                                        dropdownMenuColumnStyle={{
                                            maxWidth: 300,
                                        }}
                                    />
                                </Form.Item>
                            </div>
                        </div>
                    </div>
                    <FooterButtons
                        mode={mode}
                        showReset={false}
                        submitDisabled={defaultChecked && !selectedRole}
                        submitDisabledTips={
                            defaultChecked && !selectedRole
                                ? __('开启推送后请选择角色')
                                : ''
                        }
                        handleEdit={() => {
                            setMode(Mode.Edit)
                        }}
                        handleSubmit={handleSubmit}
                    />
                </Form>
            )}
        </div>
    )
}

export default MessagePush
