import Watcher from "../Watcher.js"

export default function compileAttribute(node, vm) {
    const attrs = Array.from(node.attributes)
    console.log(attrs)
    for (let attr of attrs) {
        const { name, value } = attr
        if (name.match(/v-on:click/)) {
            compileVOnClick(node, value, vm)
        } else if (name.match(/v-bind:/)) {
            compileVBind(node, name, value, vm)
        } else if (name.match(/v-model/)) {
            compileVModel(node, value, vm)
        }
    }
}

function compileVOnClick(node, method, vm) {
    node.addEventListener("click", function (...args) {
        vm.$options.methods[method].apply(vm, args)
    })
}
function compileVBind(node, attrName, attrValue, vm) {
    node.removeAttribute(attrName)
    attrName = attrName.replace(/v-bind:/, "")
    function cb() {
        node.setAttribute(attrName, vm[attrValue])
    }
    new Watcher(cb)
}
function compileVModel(node, key, vm) {
    let { tagName, type } = node
    tagName = tagName.toLowerCase()
    if (tagName === "input" && type == "text") {
        node.value = vm[key]
        node.addEventListener("input", function () {
            vm[key] = node.value
        })
    } else if (tagName === "input" && type == "checkbox") {
        node.checked = vm[key]
        node.addEventListener("change", function () {
            vm[key] = node.checked
        })
    }
    if (tagName === "select") {
        node.value = vm[key]
        node.addEventListener("change", function () {
            vm[key] = node.value
        })
    }
}