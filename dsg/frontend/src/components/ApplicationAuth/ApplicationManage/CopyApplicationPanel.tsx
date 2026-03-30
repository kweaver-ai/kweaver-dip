import { FC, useEffect, useState } from 'react'
import { Button, Col, message, Modal, Row } from 'antd'
import __ from '../locale'
import styles from '../styles.module.less'
import {
    getPermissionDetail,
    PermissionsOptions,
    ViewConfigInfo,
} from '../const'
import { formatError, getAppsDetail } from '@/core'
import { Loader } from '@/ui'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

interface ICopyApplicationPanel {
    appId: string
    onClose: () => void
    open: boolean
    appLocalInfo: any
}
const CopyApplicationPanel: FC<ICopyApplicationPanel> = ({
    appId,
    onClose,
    open,
    appLocalInfo,
}) => {
    const [appInfo, setAppInfo] = useState<any>()
    const [loading, setLoading] = useState<boolean>(true)
    const [{ using, governmentSwitch, local_app }] = useGeneralConfig()

    useEffect(() => {
        if (appId && appLocalInfo?.password) {
            getAppInfoDetail(appId)
        }
    }, [appId, appLocalInfo])

    /**
     * 异步获取应用详细信息
     * @param id 应用的唯一标识符
     */
    const getAppInfoDetail = async (id) => {
        try {
            // 尝试根据应用ID获取应用信息详情
            const res = await getAppsDetail(id)
            setAppInfo({ ...res, ...appLocalInfo })
            setLoading(false)
        } catch (err) {
            // 处理可能发生的错误
            formatError(err)
            setLoading(false)
        }
    }

    /**
     * 根据权限范围数据获取权限描述字符串
     * @param authorityScopeData 权限范围数据数组，包含多个权限值
     * @param label 用于标识权限的标签，会在第一个权限信息前附加
     * @returns 返回格式化后的权限描述字符串
     */
    const getAuthorityScopeString = (authorityScopeData, label) => {
        // 映射权限值，生成权限描述字符串数组
        const textData = authorityScopeData
            .map((currentData, innerIndex) => {
                // 查找对应权限的描述
                const permission = PermissionsOptions.find(
                    (option) => option.value === currentData,
                )
                // 格式化权限信息
                return `${innerIndex === 0 ? label : ''}${permission?.label}（${
                    permission?.description
                }）`
            })
            // 使用“、”连接数组元素，生成最终的权限描述字符串
            .join('、')
        return textData
    }
    /**
     * 异步复制信息函数
     * 该函数旨在复制特定信息到剪贴板，并提供成功提示
     */
    const copyInfo = async () => {
        // 收集需要复制的文本内容
        const text = ViewConfigInfo.filter((current) => {
            if (
                !appInfo?.province_app_info?.app_id &&
                current.key === 'province_app_info'
            ) {
                return false
            }
            return current.key !== 'more_info'
        })
            .map((viewConfig, index) => {
                const configInfos = viewConfig.configItems
                    .map((item) => {
                        // 处理“authority_scope”类型的特殊项

                        switch (item.key) {
                            case 'authority_scope':
                                return `${item.label} ${getAuthorityScopeString(
                                    appInfo[item.key],
                                    item.label,
                                )}`
                            case 'access_secret':
                            case 'province_url':
                            case 'province_ip':
                            case 'contact_name':
                            case 'contact_phone':
                            case 'deploy_place':
                            case 'access_key':
                            case 'app_id':
                                return `${item.label}${
                                    appInfo?.province_app_info?.[item.key] || ''
                                } `
                            case 'area_name':
                                return `${item.label}${
                                    appInfo?.province_app_info?.area_info
                                        ?.value || ''
                                } `
                            case 'rang_name':
                                return `${item.label}${
                                    appInfo?.province_app_info?.range_info
                                        .value || ''
                                } `
                            case 'department_name':
                                return `${item.label}${appInfo?.province_app_info?.org_info?.department_name} || ''`
                            case 'org_code':
                                return `${item.label}${appInfo?.province_app_info?.org_info?.org_code} || ''`

                            case 'info_systems':
                                return `${item.label} ${appInfo?.info_systems?.name}`
                            case 'application_developer':
                                return `${item.label} ${appInfo?.application_developer?.name}`
                            case 'has_resource':
                                return `${item.label} ${
                                    appInfo[item.key]
                                        ? __('已授权可用资源')
                                        : __('暂无')
                                }`
                            default:
                                // 处理非“authority_scope”类型的项
                                return `${item.label} ${appInfo[item.key]}`
                        }
                    })
                    .join('\r\n')
                return `${viewConfig.title}\r\n${configInfos}`
            })
            .join('\r\n') // 使用回车和换行符连接所有项
        // 将文本复制到剪贴板
        await navigator.clipboard.writeText(text)

        // 显示成功消息
        message.success(__('复制成功'))
    }

    /**
     * 根据配置项获取模板配置
     * @param {Object} itemConfig - 配置项对象，包含key属性用于区分不同的配置类型
     * @returns {React.ReactNode} - 根据配置项返回不同的UI组件
     */
    const getTemplateConfig = (itemConfig) => {
        switch (itemConfig.key) {
            case 'authority_scope':
                // 渲染权限范围配置
                return (
                    <div className={styles.permissionWrapper}>
                        {appInfo?.[itemConfig.key]?.length
                            ? appInfo[itemConfig.key].map((item) => {
                                  const permission = getPermissionDetail(item)
                                  return (
                                      <div key={item.id}>
                                          <span>{permission?.label}</span>
                                          <span className={styles.description}>
                                              （{permission?.description}）
                                          </span>
                                      </div>
                                  )
                              })
                            : __('暂无')}
                    </div>
                )
            case 'password':
                return (
                    <span
                        className={styles.text}
                        title={appInfo?.[itemConfig.key]}
                    >
                        ******
                    </span>
                )
            case 'has_resource':
                // 渲染可用资源信息配置
                return (
                    <span>
                        <span>
                            {appInfo?.has_resource
                                ? __('已授权可用资源')
                                : __('暂无')}
                        </span>
                        {/* <Tooltip
                            placement="bottomLeft"
                            title={
                                <div>
                                    <div>
                                        {__(
                                            '可用资源由“应用开发者”从数据服务超市申请或直接由资源的数据Owner进行授权，',
                                        )}
                                    </div>
                                    <div>
                                        {__(
                                            '若您是当前应用的“应用开发者”，还可在【我的】查看应用的可用资源详情。',
                                        )}
                                    </div>
                                </div>
                            }
                            color="#fff"
                            overlayInnerStyle={{
                                color: 'rgba(0,0,0,0.85)',
                            }}
                            overlayStyle={{ maxWidth: 650 }}
                            arrowPointAtCenter
                        >
                            <InfoCircleOutlined
                                style={{
                                    color: 'rgba(0, 0, 0, 0.65)',
                                    marginLeft: 8,
                                }}
                            />
                        </Tooltip> */}
                    </span>
                )
            case 'access_secret':
            case 'access_key':
            case 'province_url':
            case 'province_ip':
            case 'contact_name':
            case 'contact_phone':
            case 'deploy_place':
            case 'app_id':
                return (
                    <span
                        className={styles.text}
                        title={appInfo[itemConfig.key]}
                    >
                        {appInfo?.province_app_info?.[itemConfig.key] ||
                            __('暂无')}
                    </span>
                )
            case 'area_name':
                return (
                    <span
                        className={styles.text}
                        title={appInfo?.province_app_info?.area_info?.value}
                    >
                        {appInfo?.province_app_info?.area_info?.value ||
                            __('暂无')}
                    </span>
                )
            case 'rang_name':
                return (
                    <span
                        className={styles.text}
                        title={appInfo?.province_app_info?.range_info.value}
                    >
                        {appInfo?.province_app_info?.range_info.value ||
                            __('暂无')}
                    </span>
                )
            case 'department_name':
                return (
                    <span
                        className={styles.text}
                        title={
                            appInfo?.province_app_info?.org_info
                                ?.department_name
                        }
                    >
                        {appInfo?.province_app_info?.org_info
                            ?.department_name || __('暂无')}
                    </span>
                )
            case 'org_code':
                return (
                    <span
                        className={styles.text}
                        title={appInfo?.province_app_info?.org_info?.org_code}
                    >
                        {appInfo?.province_app_info?.org_info?.org_code ||
                            __('暂无')}
                    </span>
                )
            // case 'updated_at':
            // case 'created_at':
            //     // 格式化时间戳
            //     return appInfo[itemConfig.key]
            //         ? moment(appInfo[itemConfig.key]).format(
            //               'YYYY-MM-DD HH:mm:ss',
            //           )
            //         : '--'
            case 'info_systems':
                return (
                    <span
                        className={styles.text}
                        title={appInfo?.info_systems?.name}
                    >
                        {appInfo?.info_systems.name || __('暂无')}
                    </span>
                )
            case 'application_developer':
                return (
                    <span
                        className={styles.text}
                        title={appInfo?.application_developer?.name}
                    >
                        {appInfo?.application_developer?.name || __('暂无')}
                    </span>
                )
            default:
                // 默认配置项渲染
                return (
                    <span
                        className={styles.text}
                        title={appInfo?.[itemConfig.key]}
                    >
                        {appInfo?.[itemConfig.key] || __('暂无')}
                    </span>
                )
        }
    }

    return (
        <Modal
            width={800}
            title={__('应用信息')}
            onCancel={() => {
                onClose()
            }}
            footer={null}
            open={open}
            maskClosable={false}
            bodyStyle={{ padding: '24px 0' }}
        >
            {loading ? (
                <div className={styles.loadingContainer}>
                    <Loader />
                </div>
            ) : (
                <div className={styles.copyModalContainer}>
                    {/* <div className={styles.contentWrapper}>
                <div className={styles.leftContent}>
                    {Labels.map((label, index) => (
                        <div key={index} className={styles.itemLabel}>
                            {label}
                        </div>
                    ))}
                </div>
                <div className={styles.rightContent}>
                    {transformedContents.map((item, index) =>
                        getTemplate(item.name, item.value, index),
                    )}
                </div>
            </div> */}
                    <div className={styles.contentContainer}>
                        {appInfo &&
                            ViewConfigInfo.filter((current) => {
                                if (
                                    (!appInfo?.province_app_info?.app_id ||
                                        !local_app) &&
                                    current.key === 'province_app_info'
                                ) {
                                    return false
                                }
                                return current.key !== 'more_info'
                            }).map((item, index) => (
                                <div
                                    key={index}
                                    className={styles.contentWrapper}
                                >
                                    <div className={styles.itemTitle}>
                                        <span>{item.title}</span>
                                    </div>
                                    <div className={styles.itemContent}>
                                        {item.configItems
                                            .filter(
                                                (current) =>
                                                    current.key !==
                                                        'password' ||
                                                    appInfo?.password,
                                            )
                                            .map((configItem) => (
                                                <Row key={configItem.key}>
                                                    <Col span={5}>
                                                        <span
                                                            className={
                                                                styles.label
                                                            }
                                                        >
                                                            {configItem.label}
                                                        </span>
                                                    </Col>
                                                    <Col span={19}>
                                                        {getTemplateConfig(
                                                            configItem,
                                                        )}
                                                    </Col>
                                                </Row>
                                            ))}
                                    </div>
                                    {item.key === 'auth_info' &&
                                        appInfo?.password && (
                                            <div className={styles.message}>
                                                {__(
                                                    '提示：密码在弹窗关闭后不再支持查看和复制，请妥善保管。',
                                                )}
                                            </div>
                                        )}
                                </div>
                            ))}
                    </div>

                    <div className={styles.copyButton}>
                        <Button
                            type="primary"
                            style={{
                                width: '100%',
                            }}
                            onClick={() => {
                                copyInfo()
                            }}
                        >
                            {__('复制信息')}
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    )
}

export default CopyApplicationPanel
