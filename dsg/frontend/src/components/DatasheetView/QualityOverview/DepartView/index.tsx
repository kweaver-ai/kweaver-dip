import { ExportOutlined } from '@ant-design/icons'
import {
    Button,
    Checkbox,
    Col,
    Form,
    message,
    Progress,
    Row,
    Tooltip,
} from 'antd'
import { memo, useEffect, useMemo, useState } from 'react'
import ChooseOwnerModal from '@/components/ChooseOwnerModal'
import {
    exportExploreReports,
    formatError,
    getCurUserDepartment,
    getFormViewOverview,
} from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { Loader } from '@/ui'
import { downloadPdf } from '@/utils'
import { getScore, RenderTooltip, safeMultiply } from '../helper'
import CountCard from './CountCard'
import DimensionScoreCard from './DimensionScoreCard'
import __ from './locale'
import QualityScoreCard from './QualityScoreCard'
import styles from './styles.module.less'
import ViewTable from './ViewTable'
import DepartSelect from '../DepartSelect'

const renderText = (percent: number = 0) => {
    return (
        <span
            style={{
                fontSize: '14px',
                color: 'rgba(0,0,0,0.85)',
                fontWeight: 'bold',
            }}
        >
            {percent}%
        </span>
    )
}

const DepartView = ({
    depart,
    isOwner = false,
}: {
    depart?: Record<string, any>
    isOwner?: boolean
}) => {
    const [radarMapData, setRadarMapData] = useState<any[]>()
    const [overview, setOverview] = useState<any>()
    const [loading, setLoading] = useState<boolean>(false)
    const [exportLoading, setExportLoading] = useState<boolean>(false)
    const [currentDepartment, setCurrentDepartment] =
        useState<Record<string, any>>()
    const [currentOwnerIds, setCurrentOwnerIds] = useState<string[]>([])
    const [members, setMembers] = useState<any[]>([])
    const [chooseOwnerModalOpen, setChooseOwnerModalOpen] = useState(false)
    const [needRule, setNeedRule] = useState<boolean>(false)

    useEffect(() => {
        onLoadData()
    }, [depart, isOwner])

    useEffect(() => {
        if (currentDepartment) {
            getOverviewData()
        }
    }, [currentDepartment, currentOwnerIds])

    const onLoadData = async () => {
        setLoading(true)
        try {
            if (isOwner) {
                setCurrentDepartment(depart)
            } else {
                const res = await getCurUserDepartment()
                const firstDepart = res?.[0]
                if (firstDepart) {
                    const curDepart = {
                        value: firstDepart?.id,
                        label: firstDepart?.name,
                        key: firstDepart?.id,
                        type: firstDepart?.path?.includes('/') ? 2 : 1,
                    }
                    setCurrentDepartment(curDepart)
                }
            }
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const getOverviewData = async () => {
        try {
            setLoading(true)
            const res = await getFormViewOverview({
                department_id: currentDepartment?.value,
                owner_ids: currentOwnerIds?.join(','),
            })
            setOverview(res)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getRadarMapData()
        getRadarMapDataEmpytStatus()
    }, [overview])

    const getRadarMapData = () => {
        const itemList = [
            {
                item: __('准确性'),
                score: getScore(overview?.accuracy_average_score, false),
            },
            {
                item: __('完整性'),
                score: getScore(overview?.completeness_average_score, false),
            },
            {
                item: __('一致性'),
                score: getScore(overview?.consistency_average_score, false),
            },
            {
                item: __('规范性'),
                score: getScore(overview?.standardization_average_score, false),
            },
            {
                item: __('唯一性'),
                score: getScore(overview?.uniqueness_average_score, false),
            },
        ]
        setRadarMapData(itemList)
    }

    const getRadarMapDataEmpytStatus = () => {
        const fieldList = [
            'completeness_average_score',
            'uniqueness_average_score',
            'consistency_average_score',
            'standardization_average_score',
            'accuracy_average_score',
        ]
        const flag: boolean = fieldList.every(
            (item) => overview?.[item] === null,
        )
        return flag
    }

    // 库表数据质量评分
    const dataQulityScore = useMemo(() => {
        let score
        try {
            const validScoreList = radarMapData?.filter(
                (item) => typeof item.score === 'number',
            )
            const count = validScoreList?.length
            if (typeof count === 'number' && count > 0) {
                const sum = validScoreList
                    ?.map((item) => item.score)
                    .reduce((num, res) => num + res * 100, 0)

                if (sum >= 0) {
                    // 取整
                    score = Math.trunc(sum / count) / 100
                }
            }
        } catch (e) {
            // console.log(e)
        }
        return score
    }, [radarMapData])

    const exportReport = async () => {
        if (!currentDepartment?.value) return
        const params = {
            department_id: currentDepartment?.value,
            owner_ids: currentOwnerIds?.join(','),
            need_rule: needRule,
        }
        try {
            setExportLoading(true)
            const res = await exportExploreReports(params)
            if (res) {
                const contentDisposition = res.headers['content-disposition']
                downloadPdf(res.data, contentDisposition)
                message.success('导出成功')
            } else {
                message.error('导出失败')
            }
        } catch (error: any) {
            formatError(error)
        } finally {
            setExportLoading(false)
        }
    }

    return (
        <div className={styles['depart-view']}>
            <div className={styles['depart-view-header']}>
                <div className={styles['depart-view-header-left']}>
                    <Form layout="inline">
                        <Form.Item label={__('所属部门')}>
                            {isOwner ? (
                                <DepartSelect
                                    onSelect={(d: any, l: any) => {
                                        const departInfo = {
                                            value: d,
                                            label: l,
                                            key: d,
                                        }
                                        setCurrentDepartment(departInfo)
                                    }}
                                    defaultValue={currentDepartment?.value}
                                    style={{ width: '200px' }}
                                />
                            ) : (
                                <div
                                    className={
                                        styles['depart-view-header-left-depart']
                                    }
                                >
                                    <FontIcon
                                        style={{ fontSize: 16 }}
                                        name={
                                            currentDepartment?.type === 1
                                                ? 'icon-zuzhi1'
                                                : 'icon-bumen1'
                                        }
                                    />
                                    <span title={currentDepartment?.label}>
                                        {currentDepartment?.label}
                                    </span>
                                </div>
                            )}
                        </Form.Item>
                        <Form.Item label={__('数据Owner')}>
                            <div
                                style={{
                                    maxWidth: 280,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                <div
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '4px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {members.length > 0 ? (
                                        <>
                                            {members
                                                .slice(0, 2)
                                                .map((member) => (
                                                    <div
                                                        key={member.id}
                                                        className={
                                                            styles.memberTag
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                styles.memberTagText
                                                            }
                                                            title={member.name}
                                                        >
                                                            {member.name}
                                                        </span>
                                                        <span
                                                            className={
                                                                styles.memberTagClose
                                                            }
                                                            onClick={() => {
                                                                const newMembers =
                                                                    members.filter(
                                                                        (m) =>
                                                                            m.id !==
                                                                            member.id,
                                                                    )
                                                                setMembers(
                                                                    newMembers,
                                                                )
                                                                setCurrentOwnerIds(
                                                                    newMembers.map(
                                                                        (m) =>
                                                                            m.id,
                                                                    ),
                                                                )
                                                            }}
                                                        >
                                                            ×
                                                        </span>
                                                    </div>
                                                ))}
                                            {members.length > 2 && (
                                                <Tooltip
                                                    title={members
                                                        .slice(2)
                                                        .map((m) => m.name)
                                                        .join('、')}
                                                >
                                                    <div
                                                        className={
                                                            styles.memberTag
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                styles.memberTagText
                                                            }
                                                        >
                                                            +
                                                            {members.length - 2}
                                                        </span>
                                                    </div>
                                                </Tooltip>
                                            )}
                                        </>
                                    ) : null}
                                </div>
                                <Button
                                    type="link"
                                    onClick={() =>
                                        setChooseOwnerModalOpen(true)
                                    }
                                    style={{ padding: 0 }}
                                >
                                    {__('选择')}
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </div>
                <div className={styles['depart-view-header-right']}>
                    <span className={styles.check}>
                        <Checkbox
                            checked={needRule}
                            onChange={(e) => setNeedRule(e.target.checked)}
                        />
                        <Tooltip
                            title={__('导出规则详情用时可能较长，请您耐心等待')}
                            placement="bottom"
                            color="#fff"
                            showArrow={false}
                            overlayInnerStyle={{
                                fontSize: '12px',
                                color: 'rgba(0,0,0,0.45)',
                                maxWidth: '300px',
                            }}
                            overlayStyle={{
                                marginTop: '-10px',
                            }}
                        >
                            <span>{__('勾选导出所有库表质量规则详情')}</span>
                        </Tooltip>
                    </span>
                    <Button
                        type="primary"
                        icon={<ExportOutlined />}
                        disabled={loading}
                        onClick={() => exportReport()}
                        loading={exportLoading}
                    >
                        {__('导出报告')}
                    </Button>
                </div>
            </div>
            {loading ? (
                <div className={styles['depart-view-loading']}>
                    <Loader />
                </div>
            ) : (
                <div className={styles['depart-view-content']}>
                    <Row gutter={16}>
                        <Col span={6}>
                            <QualityScoreCard
                                data={getScore(overview?.average_score, true)}
                            />
                        </Col>
                        <Col span={6}>
                            <DimensionScoreCard
                                data={radarMapData}
                                isEmpty={typeof dataQulityScore !== 'number'}
                            />
                        </Col>
                        <Col span={12}>
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <CountCard
                                        title={__('库表总数')}
                                        count={overview?.total_views}
                                        rightNode={
                                            <div>
                                                <FontIcon
                                                    name="icon-shituzongshu"
                                                    type={IconType.COLOREDICON}
                                                    style={{
                                                        fontSize: '48px',
                                                    }}
                                                />
                                            </div>
                                        }
                                    />
                                </Col>
                                <Col span={12}>
                                    <CountCard
                                        title={__('库表探查覆盖量')}
                                        count={overview?.explored_views}
                                        tooltip={RenderTooltip(
                                            undefined,
                                            __('已探查生成质量报告的库表数量'),
                                            { placement: 'bottom' },
                                        )}
                                        rightNode={
                                            <div>
                                                <FontIcon
                                                    name="icon-yitanchashitu"
                                                    type={IconType.COLOREDICON}
                                                    style={{
                                                        fontSize: '48px',
                                                    }}
                                                />
                                            </div>
                                        }
                                    />
                                </Col>
                                <Col span={12}>
                                    <CountCard
                                        title={__('高于平均分库表')}
                                        count={overview?.above_average_views}
                                        rightNode={
                                            <div>
                                                <Progress
                                                    width={70}
                                                    type="circle"
                                                    strokeColor="#06B89A"
                                                    strokeWidth={12}
                                                    percent={getScore(
                                                        (overview?.above_average_views ??
                                                            0) /
                                                            (overview?.explored_views ??
                                                                1),
                                                        true,
                                                    )}
                                                    format={renderText}
                                                />
                                            </div>
                                        }
                                    />
                                </Col>
                                <Col span={12}>
                                    <CountCard
                                        title={__('低于平均分库表')}
                                        count={overview?.below_average_views}
                                        rightNode={
                                            <div>
                                                <Progress
                                                    width={70}
                                                    type="circle"
                                                    strokeColor="#EF5965"
                                                    strokeWidth={12}
                                                    percent={getScore(
                                                        (overview?.below_average_views ??
                                                            0) /
                                                            (overview?.explored_views ??
                                                                1),
                                                        true,
                                                    )}
                                                    format={renderText}
                                                />
                                            </div>
                                        }
                                    />
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <div className={styles['depart-view-content-table']}>
                        <ViewTable
                            departmentId={currentDepartment?.value}
                            ownerIds={currentOwnerIds?.join(',')}
                            isOwner={isOwner}
                        />
                    </div>
                </div>
            )}
            <ChooseOwnerModal
                multiple
                open={chooseOwnerModalOpen}
                value={members}
                onOk={(selectedUsers) => {
                    if (!selectedUsers.length) {
                        setMembers([])
                        setCurrentOwnerIds([])
                        return
                    }
                    setMembers(selectedUsers)
                    setCurrentOwnerIds(selectedUsers.map((u) => u.id))
                }}
                onCancel={() => setChooseOwnerModalOpen(false)}
            />
        </div>
    )
}

export default memo(DepartView)
