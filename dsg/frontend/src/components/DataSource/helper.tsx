import Icon from '@ant-design/icons'
import { Color } from '@antv/x6'
import { FC } from 'react'
import { VIEWMODE } from './const'
import { ReactComponent as level1 } from '@/assets/DataAssetsCatlg/level1.svg'
import { ReactComponent as level2 } from '@/assets/DataAssetsCatlg/level2.svg'
import { ReactComponent as level3 } from '@/assets/DataAssetsCatlg/level3.svg'
import { ReactComponent as level4 } from '@/assets/DataAssetsCatlg/level4.svg'
import styles from './styles.module.less'
import __ from './locale'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import { databaseTypesEleData } from '@/core/dataSource'

export const viewModeList = [
    {
        label: <div style={{ fontWeight: 550 }}>{__('组织架构')}</div>,
        value: VIEWMODE.BARCHITECURE,
    },
    {
        label: <div style={{ fontWeight: 550 }}>{__('业务领域')}</div>,
        value: VIEWMODE.DOMAIN,
    },
]

// 视角节点IconList
export const levelIcons = {
    1: (
        <Icon
            component={level1}
            className={styles.icon}
            style={{ color: '#9e7abb' }}
        />
    ),
    2: (
        <Icon
            component={level2}
            className={styles.icon}
            style={{ color: '#df9c19' }}
        />
    ),
    3: (
        <Icon
            component={level3}
            className={styles.icon}
            style={{ color: '#3c9810' }}
        />
    ),
    4: (
        <Icon
            component={level4}
            className={styles.icon}
            style={{ color: '#3c9810' }}
        />
    ),
}

export const dataBaseOptions = [
    {
        label: 'MySQL',
        value: 'mysql',
    },
    {
        label: 'MariaDB',
        value: 'maria',
    },
    {
        label: 'Hive',
        value: 'hive-hadoop2',
    },
    {
        label: 'PostgreSQL',
        value: 'postgresql',
    },
    {
        label: 'Oracle',
        value: 'oracle',
    },
    {
        label: 'SQL Server',
        value: 'sqlserver',
    },
    {
        label: 'ClickHouse',
        value: 'clickhouse',
    },
]

/**
 * 数据来源类型
 * @param INFOSYS  信息系统
 * @param DATAWAREHOUSE    数据仓库
 * @param NOCLASS    未分类
 */
export enum DataSourceOrigin {
    INFOSYS = 'records',
    DATAWAREHOUSE = 'analytical',
    DATASANDBOX = 'sandbox',
}

export const dataServiceLabelList = {
    [DataSourceOrigin.INFOSYS]: __('信息系统'),
    [DataSourceOrigin.DATAWAREHOUSE]: __('数据仓库'),
    [DataSourceOrigin.DATASANDBOX]: __('数据沙箱'),
    '': __('未分类'),
}

export const dataSourceAllOptions = [
    {
        label: __('不限'),
        value: '',
    },
    {
        label: dataServiceLabelList[DataSourceOrigin.INFOSYS],
        value: DataSourceOrigin.INFOSYS,
    },
    {
        label: dataServiceLabelList[DataSourceOrigin.DATAWAREHOUSE],
        value: DataSourceOrigin.DATAWAREHOUSE,
    },
    // {
    //     label: dataServiceLabelList[DataSourceOrigin.DATASANDBOX],
    //     value: DataSourceOrigin.DATASANDBOX,
    // },
]

// 新建/编辑数据源时来源字段可选项
export const editDataSourceOptions = [
    {
        label: dataServiceLabelList[DataSourceOrigin.INFOSYS],
        value: DataSourceOrigin.INFOSYS,
    },
    {
        label: dataServiceLabelList[DataSourceOrigin.DATAWAREHOUSE],
        value: DataSourceOrigin.DATAWAREHOUSE,
    },
    // {
    //     label: dataServiceLabelList[DataSourceOrigin.DATASANDBOX],
    //     value: DataSourceOrigin.DATASANDBOX,
    // },
]

export const dataBaseAllOptions = [
    {
        label: '不限',
        value: '',
    },
]

// 筛选条件
export const filterConditionList: Array<IformItem> = [
    {
        key: 'source_type',
        label: __('数据源来源'),
        options: dataSourceAllOptions,
        type: SearchType.Radio,
    },
    {
        key: 'type',
        label: __('数据库类型'),
        options: dataBaseAllOptions,
        type: SearchType.Radio,
    },
]

export const detailsList = [
    { label: __('数据源名称'), key: 'name', span: 12 },
    { label: __('数据源来源'), key: 'source_type', span: 12 },
    { label: __('信息系统'), key: 'info_system_name', span: 12 },
    { label: __('数据库类型'), key: 'type', span: 12 },
    { label: __('文件存储位置'), key: 'excel_protocol', span: 12 },
    { label: __('数据库名称'), key: 'database_name', span: 12 },
    { label: __('数据库模式'), key: 'schema', span: 12 },
    { label: __('连接地址'), key: 'host', span: 12 },
    { label: __('端口'), key: 'port', span: 12 },
    { label: __('用户名'), key: 'username', span: 12 },
    { label: __('密码'), key: 'password', span: 12 },
    { label: __('Token'), key: 'guardian-token', span: 12 },
    { label: __('路径'), key: 'excel_base', span: 12 },
    { label: __('更新人'), key: 'updated_by_uid', span: 12 },
    { label: __('更新时间'), key: 'updated_at', span: 12 },
]
export const basicInfoDetailsList = [
    {
        label: __('基本属性'),
        key: 'basic',
        list: [
            { label: __('数据源名称'), key: 'name', span: 12 },
            { label: __('连接类型'), key: 'type', span: 12 },
            { label: __('数据库名称'), key: 'database_name', span: 12 },
            { label: __('连接方式'), key: 'connect_protocol', span: 12 },
            { label: __('连接地址'), key: 'host', span: 12 },
            { label: __('端口'), key: 'port', span: 12 },
            { label: __('用户ID'), key: 'user_id', span: 12, type: 'excel' },
            { label: __('用户名'), key: 'username', span: 12 },
            { label: __('密码'), key: 'password', span: 12 },
            {
                label: __('存储介质'),
                key: 'excel_protocol',
                span: 12,
                type: 'excel',
            },
            {
                label: __('存储路径'),
                key: 'excel_base',
                span: 12,
                type: 'excel',
            },
            { label: __('备注'), key: 'comment', span: 12 },
        ],
    },
    {
        label: __('来源/归属信息'),
        key: 'originInfo',
        list: [
            { label: __('数据源来源'), key: 'source_type', span: 12 },
            { label: __('信息系统'), key: 'info_system_name', span: 12 },
            { label: __('所属部门'), key: 'department_name', span: 12 },
        ],
    },
    {
        label: __('来源/归属信息更新'),
        key: 'originInfoUpdate',
        list: [
            { label: __('更新人'), key: 'updated_by_uid', span: 12 },
            { label: __('更新时间'), key: 'updated_at', span: 12 },
        ],
    },
]

// 对密码进行加密的公钥
export const publicKey = `-----BEGIN RSA Public Key-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDkk38QokiD44dmyk2VVt3fxs2m
rtKBg7f3i4akb9FoHwUggbfMggAbCx3NUDMpQNDOzGhtafVNCPyKoGEXJqcTgCks
JUT0Hpk5gmc58AwsDhK/czMdlZN5/CxRwLZ7MqM/znYxTVYN9inMlqYIiTHw/2e6
YywoZDbno5pOp5rabQIDAQAB
-----END RSA Public Key-----
`
/**
 * 公司2048rsa公钥
 */
export const PublicKey2048 = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4E+eiWRwffhRIPQYvlXU
jf0b3HqCmosiCxbFCYI/gdfDBhrTUzbt3fL3o/gRQQBEPf69vhJMFH2ZMtaJM6oh
E3yQef331liPVM0YvqMOgvoID+zDa1NIZFObSsjOKhvZtv9esO0REeiVEPKNc+Dp
6il3x7TV9VKGEv0+iriNjqv7TGAexo2jVtLm50iVKTju2qmCDG83SnVHzsiNj70M
iviqiLpgz72IxjF+xN4bRw8I5dD0GwwO8kDoJUGWgTds+VckCwdtZA65oui9Osk5
t1a4pg6Xu9+HFcEuqwJTDxATvGAz1/YW0oUisjM0ObKTRDVSfnTYeaBsN6L+M+8g
CwIDAQAB
-----END PUBLIC KEY-----`
