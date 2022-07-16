import compileToFunction from './compileToFunction.js'
import mountComponent from './mountComponent.js'

export default function mount(vm) {
  // 配置项没有 render 函数，则进行编译
  if (!vm.$options.render) {
    let template = ''
    // 存在 template 选项
    if (vm.$options.template) {
      template = vm.$options.template
    } else if (vm.$options.el) {
      vm.$el = document.querySelector(vm.$options.el)
      template = vm.$el.outerHTML
    }

    // 生成渲染函数
    const render = compileToFunction(template)
    vm.$options.render = render
  }
  mountComponent(vm)
}
