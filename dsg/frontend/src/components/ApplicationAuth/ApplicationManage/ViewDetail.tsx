import { Col, Drawer, Row, Tooltip } from 'antd'
import { FC, useEffect, useState } from 'react'
import { InfoCircleOutlined } from '@ant-design/icons'
import moment from 'moment'
import __ from '../locale'
import styles from '../styles.module.less'
import { getPermissionDetail, ViewConfigInfo } from '../const'
import BlockContainer from '../BlockContainer'
import { formatError, getAppsDetail } from '@/core'
import { Loader } from '@/ui'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

interface IViewDetail {
    appId: string
    onClose: () => void
    open: boolean
    dataVersion?: 'editing' | 'published' | 'reported'
}
const ViewDetail: FC<IViewDetail> = ({
    appId,
    onClose,
    open,
    dataVersion = 'published',
}) => {
    const [appInfo, setAppInfo] = useState<any>()
    const [loading, setLoading] = useState<boolean>(true)
    const [{ using, governmentSwitch, local_app }] = useGeneralConfig()

    useEffect(() => {
        if (appId) {
            getAppInfoDetail(appId)
        }
    }, [appId])

    /**
     * 异步获取应用详细信息
     * @param id 应用的唯一标识符
     */
    const getAppInfoDetail = async (id) => {
        try {
            // 尝试根据应用ID获取应用信息详情
            const res = await getAppsDetail(id, { version: dataVersion as any })
            setAppInfo(res)
            setLoading(false)
        } catch (err) {
            // 处理可能发生的错误
            formatError(err)
            setLoading(false)
        }
    }
    /**
     * 根据类型生成表单块标题
     * 此函数用于根据不同的类型生成带有特定工具提示的标题，以及一个用于切换的开关
     * 主要用于展示不同部分的表单标题，并提供一个开关来控制对应部分的状态
     *
     * @param type 表单块的类型，用于决定标题的内容和相关的工具提示信息
     * @param title 默认的标题文本，当类型不匹配任何已定义的类型时使用
     * @returns 返回一个 React 元素，根据类型展示不同的标题和工具提示，或返回默认标题
     */
    const formBlockTitle = (type: string, title: string) => {
        switch (type) {
            case 'auth_info':
                // 当类型为 'auth_info' 时，返回授权信息的标题和相关的工具提示，以及一个开关
                return (
                    <div className={styles.titleWrapper}>
                        <div>
                            <span>{__('认证信息')}</span>
                            <Tooltip
                                placement="bottomLeft"
                                title={__(
                                    '业务系统用户在应用账户认证通过后，可以调用权限范围内的 Open API。',
                                )}
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
                            </Tooltip>
                        </div>
                    </div>
                )
            case 'province_registry':
                // 当类型为 'province_registry' 时，返回省平台注册信息的标题和相关的工具提示，以及一个开关
                return (
                    <div className={styles.titleWrapper}>
                        <div>
                            <span>{__('省平台注册信息')}</span>
                            <Tooltip
                                placement="bottomLeft"
                                title={__(
                                    '应用注册到省平台后，可以为已注册应用申请省共享资源。',
                                )}
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
                            </Tooltip>
                        </div>
                    </div>
                )
            default:
                // 当类型不匹配任何已定义的类型时，返回默认标题
                return title
        }
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
                        {appInfo[itemConfig.key]?.length
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
                            : '--'}
                    </div>
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
                        <Tooltip
                            placement="bottomLeft"
                            title={
                                <div>
                                    <div>
                                        {__(
                                            '1、可用资源由资源的数据 Owner 进行授权。若配置了权限申请审核策略，则“应用开发者”也可以从数据服务超市申请资源。',
                                        )}
                                    </div>
                                    <div>
                                        {__(
                                            '2、您可在【我的】查看应用的可用资源详情。',
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
                        </Tooltip>
                    </span>
                )
            case 'updated_at':
            case 'created_at':
                // 格式化时间戳
                return appInfo[itemConfig.key]
                    ? moment(appInfo[itemConfig.key]).format(
                          'YYYY-MM-DD HH:mm:ss',
                      )
                    : '--'
            case 'access_secret':
            case 'province_url':
            case 'province_ip':
            case 'contact_name':
            case 'contact_phone':
            case 'deploy_place':
            case 'access_key':
            case 'app_id':
                return (
                    <span
                        className={styles.text}
                        title={appInfo[itemConfig.key]}
                    >
                        {appInfo?.province_app_info?.[itemConfig.key] || '--'}
                    </span>
                )
            case 'area_name':
                return (
                    <span
                        className={styles.text}
                        title={appInfo?.province_app_info?.area_info?.value}
                    >
                        {appInfo?.province_app_info?.area_info?.value || '--'}
                    </span>
                )
            case 'rang_name':
                return (
                    <span
                        className={styles.text}
                        title={appInfo?.province_app_info?.range_info?.value}
                    >
                        {appInfo?.province_app_info?.range_info?.value || '--'}
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
                            ?.department_name || '--'}
                    </span>
                )
            case 'org_code':
                return (
                    <span
                        className={styles.text}
                        title={appInfo?.province_app_info?.org_info?.org_code}
                    >
                        {appInfo?.province_app_info?.org_info?.org_code || '--'}
                    </span>
                )
            case 'info_systems':
                return (
                    <span
                        className={styles.text}
                        title={appInfo?.info_systems?.name}
                    >
                        {appInfo?.info_systems.name || '--'}
                    </span>
                )
            case 'application_developer':
                return (
                    <span
                        className={styles.text}
                        title={appInfo?.application_developer?.name}
                    >
                        {appInfo?.application_developer?.name || '--'}
                    </span>
                )
            default:
                // 默认配置项渲染
                return (
                    <span
                        className={styles.text}
                        title={appInfo[itemConfig.key]}
                    >
                        {appInfo[itemConfig.key] || '--'}
                    </span>
                )
        }
    }
    return (
        <Drawer
            open={open}
            title={
                <span style={{ fontWeight: 550, fontSize: 16 }}>
                    {__('应用详情')}
                </span>
            }
            onClose={onClose}
            width={700}
        >
            {loading ? (
                <div className={styles.loadingContainer}>
                    <Loader />
                </div>
            ) : (
                <div className={styles.configFormWrapper}>
                    <div className={styles.formContentWrapper}>
                        {appInfo &&
                            ViewConfigInfo.filter((current, index) => {
                                if (!local_app && current.key === 'auth_info') {
                                    return false
                                }
                                if (
                                    !governmentSwitch?.on &&
                                    current.key === 'province_app_info'
                                ) {
                                    return false
                                }
                                return true
                            }).map((item, index) => {
                                return (
                                    <div key={index}>
                                        <BlockContainer
                                            title={formBlockTitle(
                                                item.key,
                                                item.title,
                                            )}
                                        >
                                            <div
                                                className={
                                                    styles.detailItemWrapper
                                                }
                                            >
                                                {item.configItems
                                                    .filter(
                                                        (current) =>
                                                            current.key !==
                                                            'password',
                                                    )
                                                    .map((configItem) => (
                                                        <Row
                                                            key={configItem.key}
                                                        >
                                                            <Col span={7}>
                                                                <span
                                                                    className={
                                                                        styles.label
                                                                    }
                                                                >
                                                                    {
                                                                        configItem.label
                                                                    }
                                                                </span>
                                                            </Col>
                                                            <Col span={17}>
                                                                {getTemplateConfig(
                                                                    configItem,
                                                                )}
                                                            </Col>
                                                        </Row>
                                                    ))}
                                            </div>
                                        </BlockContainer>
                                    </div>
                                )
                            })}
                    </div>
                </div>
            )}
        </Drawer>
    )
}

export default ViewDetail
