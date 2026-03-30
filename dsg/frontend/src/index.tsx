import React from 'react'
// import ReactDOM from 'react-dom/client'
import ReactDOM from 'react-dom'
import App from './App'
import './index.css'
import './font/iconfont.css'
import reportWebVitals from './reportWebVitals'
import './font/iconfont.js'

// 由于React18作为主应用加载插件会出现application "" died in status LOADING_SOURCE_CODE 错误，调整为17的render方式
// const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
// root.render(
//     // <React.StrictMode>
//     <App />,
//     // </React.StrictMode>,
// )
ReactDOM.render(<App />, document.getElementById('root') as HTMLElement)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
