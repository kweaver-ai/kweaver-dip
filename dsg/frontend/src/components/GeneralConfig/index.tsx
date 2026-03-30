import { Radio } from 'antd'
import { useEffect, useMemo, useState } from 'react'

import { useUserPermCtx } from '@/context/UserPermissionProvider'
import {
    formatError,
    getConfigValue,
    getTimestampBlacklist,
    SampleDataType,
    setTimestampBlacklist,
    updateGlobalConfigValue,
} from '@/core'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import NumberInput from '@/ui/NumberInput'
import { NumberType } from '@/ui/NumberInput/const'
import { cnLowercaseEnNumNameReg } from '@/utils'
import __ from './locale'
import styles from './styles.module.less'
import TagsSelect from './TagsSelect'

const GeneralConfig = () => {
    const { checkPermission } = useUserPermCtx()
    // 是否开启生成本地应用凭证
    const [{ using, governmentSwitch, local_app }, updateInitGeneralConfig] =
        useGeneralConfig()
    // 黑名单
    const [blackList, setBlackList] = useState<string[]>([])
    // 是否开启黑名单
    const showBlacklist = false
    // const showBlacklist = useMemo(
    //     () => checkPermission('manageGeneralConfiguration'),
    //     [checkPermission],
    // )
    // 是否开启生成本地应用凭证
    const [governmentSwitchStatus, setGovernmentSwitchStatus] =
        useState<boolean>(false)

    const [localAppSwitchStatus, setLocalAppSwitchStatus] =
        useState<string>('false')

    const [sampleDataCount, setSampleDataCount] = useState<string>('5')

    const [sampleDataType, setSampleDataType] = useState<SampleDataType>(
        SampleDataType.Synthetic,
    )

    // useEffect(() => {
    //     if (showBlacklist) {
    //         getBlacklist()
    //     }
    //     getSampleDataConfig()
    // }, [])

    useEffect(() => {
        setGovernmentSwitchStatus(governmentSwitch.on)
    }, [governmentSwitch])

    useEffect(() => {
        setLocalAppSwitchStatus(local_app ? 'true' : 'false')
    }, [local_app])

    const getBlacklist = async () => {
        try {
            const res = await getTimestampBlacklist()
            setBlackList(res)
        } catch (err) {
            formatError(err)
        }
    }

    const updateBlacklist = async (val) => {
        try {
            const res = await setTimestampBlacklist({
                timestamp_blacklist: val,
            })
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 异步设置政府配置
     * @param value 政府数据共享的开关状态，true 表示开启，false 表示关闭
     * 此函数尝试设置政府方面的数据共享配置，并在设置完成后更新初始化的通用配置
     * 如果执行过程中遇到错误，则对其进行格式化处理，以确保程序的健壮性
     */
    const setGovernmentConfig = async (value) => {
        try {
            await updateGlobalConfigValue({
                key: 'government_data_share',
                value: value ? 'true' : 'false',
            })
            updateInitGeneralConfig()
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 更新生成本地应用凭证配置
     * @param value 生成本地应用凭证的开关状态，true 表示开启，false 表示关闭
     */
    const setLocalAppConfig = async (value: boolean) => {
        try {
            // 更新配置中心通用全局配置
            await updateGlobalConfigValue({
                key: 'local_app',
                value: value ? 'true' : 'false',
            })
            updateInitGeneralConfig()
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 格式化样例数据配置 将格式 [
     * {
     * key: 'sample_data_count',
     * value: 5
     * }
     * ] 转换为{key:value}
     * @param res 样例数据配置
     */
    const formatSampleDataConfig = (res: any) => {
        return res.reduce((acc, curr) => {
            acc[curr.key] = curr.value
            return acc
        }, {})
    }

    /**
     * 获取样例数据配置
     */
    const getSampleDataConfig = async () => {
        try {
            const res = await getConfigValue({
                key: 'sample_data_count,sample_data_type',
            })
            const { sample_data_count, sample_data_type } =
                formatSampleDataConfig(res)
            setSampleDataCount(sample_data_count.toString())
            setSampleDataType(sample_data_type)
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 更新样例数据配置
     * @param key 配置项的键
     * @param value 配置项的值
     */
    const updateSampleDataConfig = async (key: string, value: any) => {
        try {
            await updateGlobalConfigValue({
                key,
                value,
            })
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <div className={styles.generalConfigWrap}>
            {/* <div className={styles.titleWrap}>{__('通用配置')}</div> */}
            {/* <div className={styles.title}>{__('资源配置')}</div>
            <div className={styles.configItem}>
                <div className={styles.text}>
                    <div className={styles.textTitle}>
                        {using === 1 ? __('数据资源目录') : __('数据资源')}
                    </div>
                    <div className={styles.textContent}>
                        {using === 1
                            ? __(
                                  '启用后，数据资源需要通过数据编目才能在数据服务超市进行展示。',
                              )
                            : __(
                                  '启用后，数据资源可发布、上线至数据服务超市进行展示。',
                              )}
                    </div>
                </div>
                <div className={styles.statusTip}>{__('启用中')}</div>
            </div> */}
            {showBlacklist && (
                <>
                    <div className={styles.title}>
                        {__('黑名单配置')}
                        <span className={styles.subTitle}>
                            {__('( 配置库表探查业务更新时间字段黑名单 )')}
                        </span>
                    </div>
                    <div className={styles.configItem}>
                        <div className={styles.text}>
                            <div className={styles.textTitle}>
                                {__('以下字段不会被探查为业务更新时间字段')}
                            </div>
                            <TagsSelect
                                onValChange={(val) => {
                                    setBlackList(val)
                                    updateBlacklist(val)
                                }}
                                validateRule={{
                                    ruleReg: cnLowercaseEnNumNameReg,
                                    msg: __(
                                        '仅支持中文、小写字母、数字及下划线，且不能以数字开头',
                                    ),
                                }}
                                value={blackList}
                                maxLength={128}
                            />
                        </div>
                    </div>
                </>
            )}

            {using === 1 && (
                <>
                    <div className={styles.title}>{__('样例数据配置')}</div>
                    <div className={styles.configItem}>
                        <div className={styles.sampleDataCardContainer}>
                            <div className={styles.simpleDataConfigItem}>
                                <div
                                    className={
                                        styles.simpleDataConfigItemTextWrapper
                                    }
                                >
                                    <div
                                        className={
                                            styles.simpleDataConfigItemTitle
                                        }
                                    >
                                        {__('服务超市样例数据条数')}
                                    </div>
                                    <div
                                        className={
                                            styles.simpleDataConfigItemContent
                                        }
                                    >
                                        {__(
                                            '设置后，服务超市会展示相对应的样例数据条数',
                                        )}
                                    </div>
                                </div>
                                <div
                                    className={styles.simpleDataConfigItemInput}
                                >
                                    <NumberInput
                                        type={NumberType.Natural}
                                        max={50}
                                        min={1}
                                        value={sampleDataCount}
                                        onChange={(value) => {
                                            setSampleDataCount(value.toString())
                                        }}
                                        onBlur={(value) => {
                                            updateSampleDataConfig(
                                                'sample_data_count',
                                                value.toString(),
                                            )
                                        }}
                                        placeholder={__('条数（1-50）')}
                                    />
                                    <span>{__('条')}</span>
                                </div>
                            </div>

                            <div className={styles.line} />
                            <div className={styles.simpleDataConfigItem}>
                                <div
                                    className={
                                        styles.simpleDataConfigItemTextWrapper
                                    }
                                >
                                    <div
                                        className={
                                            styles.simpleDataConfigItemTitle
                                        }
                                    >
                                        {__('服务超市样例数据展示方式')}
                                    </div>
                                    <div
                                        className={
                                            styles.simpleDataConfigItemContent
                                        }
                                    >
                                        {__(
                                            '合成数据：通过大模型的能力，参考真实数据特征，合成仿真数据',
                                        )}
                                    </div>
                                    <div
                                        className={
                                            styles.simpleDataConfigItemContent
                                        }
                                    >
                                        {__(
                                            '真实数据：涉密数据为全部脱敏，示例：**********，敏感数据为尾部脱敏，脱敏位数为数据总位数的一半，示例：1234****',
                                        )}
                                    </div>
                                </div>
                                <div
                                    className={styles.simpleDataConfigItemRadio}
                                >
                                    <Radio.Group
                                        value={sampleDataType}
                                        onChange={(e) => {
                                            updateSampleDataConfig(
                                                'sample_data_type',
                                                e.target.value,
                                            )
                                            setSampleDataType(e.target.value)
                                        }}
                                    >
                                        <Radio value={SampleDataType.Synthetic}>
                                            {__('合成数据')}
                                        </Radio>
                                        <Radio value={SampleDataType.Real}>
                                            {__('真实数据')}
                                        </Radio>
                                    </Radio.Group>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default GeneralConfig
