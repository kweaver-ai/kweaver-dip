import React, { useEffect, useState } from 'react'
import { CheckOutlined, SolutionOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { useUpdateEffect } from 'ahooks'
import { defaultNav, NavStatus, NavType } from './const'
import styles from './styles.module.less'
import {
    DemandInfoOutlined,
    ResourceInfoOutlined,
    SceneInfoOutlined,
    UnitInfoOutlined,
} from '@/icons'

interface ICreateNav {
    getClickNav: (type: NavType) => void
    scrollToTargetNav: NavType
    demandInfoOver: boolean
    unitInfoOver: boolean
    resourceOver: boolean
}
const CreateNav: React.FC<ICreateNav> = ({
    getClickNav,
    demandInfoOver,
    unitInfoOver,
    resourceOver,
    scrollToTargetNav,
}) => {
    const project = localStorage.getItem('project')
    const [navInfo, setNavInfo] = useState(
        project === 'tc'
            ? defaultNav.filter((item) => item.key !== NavType.SCENE)
            : defaultNav,
    )
    const [selectedNav, setSelectedNav] = useState(NavType.DEMAND)

    useUpdateEffect(() => {
        if (scrollToTargetNav) {
            setSelectedNav(scrollToTargetNav)
        }
    }, [scrollToTargetNav])

    useEffect(() => {
        setNavInfo(
            navInfo.map((nav) => {
                if (nav.key === NavType.DEMAND) {
                    return {
                        ...nav,
                        status: demandInfoOver
                            ? NavStatus.FINISHED
                            : NavStatus.UNFINISH,
                    }
                }
                if (nav.key === NavType.UNIT) {
                    return {
                        ...nav,
                        status: unitInfoOver
                            ? NavStatus.FINISHED
                            : NavStatus.UNFINISH,
                    }
                }
                if (nav.key === NavType.CONFIG) {
                    return {
                        ...nav,
                        status: resourceOver
                            ? NavStatus.FINISHED
                            : NavStatus.UNFINISH,
                    }
                }
                return nav
            }),
        )
    }, [demandInfoOver, unitInfoOver, resourceOver])

    const handleClick = (nav) => {
        getClickNav(nav.key)
        setSelectedNav(nav.key)
    }

    const getIcon = (nav) => {
        const classes = {
            [styles.navIcon]: true,
            [styles.navIconActive]:
                selectedNav === nav.key || nav.status === NavStatus.FINISHED,
        }

        if (nav.key === NavType.DEMAND) {
            return <DemandInfoOutlined className={classnames(classes)} />
        }
        if (nav.key === NavType.UNIT) {
            return <UnitInfoOutlined className={classnames(classes)} />
        }
        if (nav.key === NavType.SCENE) {
            return <SceneInfoOutlined className={classnames(classes)} />
        }
        return <ResourceInfoOutlined className={classnames(classes)} />
    }

    return (
        <div className={styles.navWrapper}>
            {navInfo.map((nav) => {
                return (
                    <div key={nav.key}>
                        <div
                            className={styles.nav}
                            onClick={() => handleClick(nav)}
                        >
                            <div
                                className={classnames({
                                    [styles.nvaIconContainer]: true,
                                    [styles.nvaIconContainerActive]:
                                        selectedNav === nav.key,
                                    [styles.nvaIconContainerDisabled]:
                                        selectedNav !== nav.key &&
                                        nav.status === NavStatus.UNFINISH,
                                })}
                            >
                                {getIcon(nav)}
                                <div
                                    className={styles.finishFlag}
                                    hidden={
                                        !(nav.status === NavStatus.FINISHED)
                                    }
                                >
                                    <CheckOutlined
                                        className={styles.flagIcon}
                                    />
                                </div>
                            </div>
                            <div
                                className={classnames({
                                    [styles.finishTitle]:
                                        nav.status === NavStatus.FINISHED,
                                    [styles.progressTitle]:
                                        selectedNav === nav.key,
                                    [styles.unstartTitle]:
                                        selectedNav !== nav.key &&
                                        nav.status === NavStatus.UNFINISH,
                                })}
                            >
                                {nav.name}
                            </div>
                        </div>
                        <div
                            className={classnames({
                                [styles.connectLine]:
                                    project === 'tc'
                                        ? nav.key !== NavType.UNIT
                                        : nav.key !== NavType.SCENE,
                            })}
                        />
                    </div>
                )
            })}
        </div>
    )
}

export default CreateNav
