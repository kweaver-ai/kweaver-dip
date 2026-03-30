import React from 'react'
import { Card, Row, Col, Statistic } from 'antd'
import { PageContainer } from '@ant-design/pro-layout'
import './index.less'

const QualityOverview: React.FC = () => {
    return (
        <PageContainer title="质量概览">
            <div className="quality-overview-container">
                <Row gutter={[16, 16]}>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="数据表总数"
                                value={0}
                                suffix="个"
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic title="质量问题" value={0} suffix="个" />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic title="质量规则" value={0} suffix="条" />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic title="质量评分" value={0} suffix="分" />
                        </Card>
                    </Col>
                </Row>

                <Card title="质量趋势" style={{ marginTop: 16 }}>
                    <div
                        style={{
                            padding: '40px 0',
                            textAlign: 'center',
                            color: '#999',
                        }}
                    >
                        质量趋势图表区域
                    </div>
                </Card>

                <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={12}>
                        <Card title="质量问题分布">
                            <div
                                style={{
                                    padding: '40px 0',
                                    textAlign: 'center',
                                    color: '#999',
                                }}
                            >
                                质量问题分布图
                            </div>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title="质量检查执行情况">
                            <div
                                style={{
                                    padding: '40px 0',
                                    textAlign: 'center',
                                    color: '#999',
                                }}
                            >
                                质量检查执行情况图
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </PageContainer>
    )
}

export default QualityOverview
