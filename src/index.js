import mount from './compiler/index.js'
import patch from './compiler/patch.js'
import renderHelper from './compiler/renderHelper.js'
import initComputed from './initComputed.js'
import initData from './initData.js'

export default function Vue(options) {
  this._init(options)
}

Vue.prototype._init = function (options) {
  this.$options = options
  initData(this)
  // 初始化计算属性，并将其代理 Vue 实例上
  initComputed(this)
  // 在 Vue 实例上挂载运行时生成的 VNode 的工具函数
  renderHelper(this)
  // 将 patch方法挂载到 Vue 实例上
  this.__patch__ = patch
  if (this.$options.el) {
    this.$mount()
  }
}

Vue.prototype.$mount = function () {
  mount(this)
}
