import React, { useEffect, useState } from 'react'
import { Switch } from 'antd'
import { useNavigate } from 'react-router-dom'
import { noop } from 'lodash'

import styles from './styles.module.less'
import __ from './locale'
import { ServiceType } from './helper'
import { useQuery } from '@/utils'
import DataConsanguinity from '../DataConsanguinity'

const DEFAULTPAGESIZE = 10

interface IDataCatlgTableInfoParams {
    id: string
    errorCallback?: (error?: any) => void
}

const DataCatlgConsanguinity = ({
    id,
    errorCallback = noop,
}: IDataCatlgTableInfoParams) => {
    return (
        <div className={styles.businsConsgnityWrapper}>
            <DataConsanguinity id={id} errorCallback={errorCallback} />
        </div>
    )
}

export default DataCatlgConsanguinity
