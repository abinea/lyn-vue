import Vue from '../index.js'
import Watcher from '../watcher.js'

export default function mountComponent(vm) {
  const updateComponent = () => {
    // 负责初始渲染和后续更新组件的一个方法
    vm._update(vm._render())
  }
  // 实例化一个渲染 Watcher
  new Watcher(updateComponent)
}

Vue.prototype._render = function () {
  return this.$options.render.apply(this)
}

/**
 *
 * @param {*} vnode 由 render 函数生成的VNode（虚拟 DOM）
 */
Vue.prototype._update = function (vnode) {
  // 获取旧的 VNode 节点
  const preVNode = this._vnode
  // 设置新的 VNode
  this._vnode = vnode
  if (!preVNode) {
    // 说明首次渲染
    this.__patch__(this.$el, vnode)
  } else {
    // 说明是后续更新
    this.__patch__(preVNode, vnode)
  }
}
