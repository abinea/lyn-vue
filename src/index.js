import mount from './compiler/index.js.js.js'
import initData from './initData.js'

export default function Vue(options) {
  this._init(options)
}

Vue.prototype._init = function (options) {
  this.$options = options
  initData(this)

  if (this.$options.el) {
    this.$mount()
  }
}

Vue.prototype.$mount = function () {
  mount(this)
}
