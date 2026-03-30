import '../../public-path'
import React from 'react'
// import ReactDOM from 'react-dom/client'
import ReactDOM from 'react-dom'
import DownloadApp from './DownloadApp'

function render(props) {
    const { container } = props
    ReactDOM.render(
        <DownloadApp props={props} />,
        container
            ? container.querySelector('#download')
            : document.querySelector('#download'),
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
    ReactDOM.unmountComponentAtNode(
        container
            ? container.querySelector('#download')
            : document.querySelector('#download'),
    )
}
