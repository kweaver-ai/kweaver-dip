import React from 'react'
import { Tooltip } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import DataTable from './DataTable'

const RecognitionAlgorithmConfig = () => {
    return (
        <div className={styles.container}>
            <div className={styles.titleTip}>
                <span className={styles.titleText}>{__('算法模版')}</span>
                <Tooltip
                    title={
                        <div className={styles.titleTooltipWrapper}>
                            <div className={styles.title}>{__('算法模版')}</div>
                            <div>
                                {__(
                                    '对识别数据类型（身份证、手机号等）要用的算法进行定义，已定义好的算法模版可直接被其他规则使用（如：自动识别分类分级规则，需要使用识别算法来识别数据）。',
                                )}
                            </div>
                            {/* <div className={styles.descriptionWrapper}>
                                <div>{__('注意')}</div>
                                <div>
                                    {__(
                                        '当前页面仅对识别数据格式要用的识别算法进行定义，完成“自动”分类分级还需要满足以下条件：',
                                    )}
                                </div>
                                <div>
                                    {__(
                                        '1、使用分级需要启用数据分级并完成等级定义，仅分类不分级可不用设置分级。',
                                    )}
                                </div>
                                <div>
                                    {__(
                                        '2、完成属性定义（属性：主题域>业务对象/业务活动>逻辑实体>属性），数据分类分级是先基于属性完成字段分类，再做这类字段的分级。',
                                    )}
                                </div>
                                <div>
                                    {__('3、基于属性配置分类分级的识别规则')}
                                </div>
                                <div>
                                    {__('4、对表（库表）进行分类分级探查')}
                                </div>
                            </div> */}
                        </div>
                    }
                    placement="bottomRight"
                    overlayStyle={{ maxWidth: 940 }}
                    overlayInnerStyle={{ color: 'rgba(0, 0, 0, 0.85)' }}
                    color="#fff"
                >
                    <InfoCircleOutlined />
                </Tooltip>
            </div>
            <DataTable />
        </div>
    )
}

export default RecognitionAlgorithmConfig
