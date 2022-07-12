import Dep from "./Dep.js"

export default function Watcher(cb) {
    // cb 负责更新DOM节点
    this._cb = cb
    Dep.target = this
    this._cb()
    // 防止重复收集
    Dep.target = null
}

Watcher.prototype.update = function () {
    // 响应式数据更新时执行回调函数
    this._cb()
}
