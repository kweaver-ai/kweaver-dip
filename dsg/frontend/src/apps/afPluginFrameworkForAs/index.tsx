import '../../public-path'
import React from 'react'
// import ReactDOM from 'react-dom/client'
import ReactDOM from 'react-dom'
import { logout } from '@/core'
import '../../font/iconfont.css'
import '../../font/iconfont.js'
import App from './App'

function render(props) {
    const { container } = props
    ReactDOM.render(
        <App props={props} />,
        container
            ? container.querySelector('#af-plugin-framework-for-as')
            : document.querySelector('#af-plugin-framework-for-as'),
    )
}
// eslint-disable-next-line no-underscore-dangle
if (!window.__POWERED_BY_QIANKUN__) {
    render({})
}
export async function bootstrap() {
    // console.log('react app bootstraped')
}
export async function mount(props) {
    // console.log('props from main framework', props)
    render(props)
}
export async function unmount(props) {
    const { container } = props

    try {
        await logout()
    } catch (error) {
        // console.log(error)
    }

    ReactDOM.unmountComponentAtNode(
        container
            ? container.querySelector('#af-plugin-framework-for-as')
            : document.querySelector('#af-plugin-framework-for-as'),
    )
}
