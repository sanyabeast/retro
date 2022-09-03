/**created by @sanyabeast | 9/3/2022 */

import { forEach } from "lodash-es"
import Component from "./Component"
import GameObject from "./GameObject"

interface IWidgetationCompPropertyDescriptor {
    type: any
    default: () => any
}
interface IWidgetationProxyCompData {
    [x: string]: any
}
interface IWidgetationProxyCompProps {
    params?: IWidgetationCompPropertyDescriptor
    tag?: IWidgetationCompPropertyDescriptor
}
export interface IWidgetationProxyCompMethods {
    detect_domain_game_object?: Function
    $store?: any
    game_object?: GameObject
    retro_object?: GameObject
    domain_game_object?: GameObject
}
export interface IWidgetationProxyComp extends IWidgetationProxyCompMethods, IWidgetationProxyCompProps {
    component_instance?: Component
    name?: string
    mixins?: any[]
    template?: string
    retro_object?: any
    data?: () => IWidgetationProxyCompData
    props?: IWidgetationProxyCompProps
    beforeMount?: Function
    mounted?: Function
    destroyed?: Function
    methods?: IWidgetationProxyCompMethods
    $options?: {
        [x: string]: any
    }
}

let ResourceManager: any = undefined
let proxy_widget_base: IWidgetationProxyComp = {
    props: {
        params: {
            type: Object,
            default() { return {} }
        },
        tag: {
            type: String,
            default() { return undefined }
        }
    },
    methods: {
        detect_domain_game_object() {
            let domain_game_object = this.$store.getters.game_object
            let parent = this as any
            let root_game_object_uuid = this.game_object.UUID
            while (true) {
                if (parent && parent.is_retro_object_proxy && parent.retro_object !== this.retro_object) {
                    domain_game_object = parent.retro_object;
                    break;
                }
                parent = parent.$parent;
                if (!parent) {
                    break;
                }
            }
            while (parent !== undefined && parent.is_retro_object_proxy === false) {
                console.log(parent)
                parent = parent.$parent
            }
            console.log(`found domain game object: ${domain_game_object.UUID} (${root_game_object_uuid === domain_game_object.UUID ? 'root' : ''})`)
            this.domain_game_object = domain_game_object
        }
    }
}

export class Widgetation {
    widget_components: { [x: string]: IWidgetationProxyComp } = {}
    rm: any = undefined

    public init(rm: any): void {
        ResourceManager = rm
        
        if (PRESET.FEATURE_WIDGETATION_ENABLE) {
            let prefix = PRESET.FEATURE_WIDGETATION_PREFIX ?? "R_"
            let ObjectProxyComp = this.create_proxy_object_widget()
            this.widget_components[`${prefix}Object`] = ObjectProxyComp
            forEach(ResourceManager.classes_of_components, (cls, name) => {
                let ProxyComponent = this.create_proxy_component_widget(cls, name)
                this.widget_components[`${prefix}${name}`] = ProxyComponent
            })
        }
    }
    create_proxy_object_widget() {
        let ProxyComp: IWidgetationProxyComp = {
            name: `R_Object`,
            mixins: [proxy_widget_base],
            template: `
                <div :data-name="$options.name" :data-id="id" style="display: none;">
                    <slot/>
                </div>
            `,
            data() {
                return {
                    id: 0,
                    is_retro_component_proxy: false,
                    is_retro_object_proxy: true
                }
            },
            beforeMount() {
                console.log(`new proxy object`);
                this.retro_object = new GameObject()
            },
            mounted() {
                this.detect_domain_game_object()
                this.domain_game_object.add(this.retro_object)
            },
            destroyed() {
                console.log(`destoryed proxy object`)
                this.retro_object.destroy()
                this.domain_game_object.remove(this.retro_object)
            }
        }
        return ProxyComp
    }
    create_proxy_component_widget(cls: new (params: any) => Component, name: string) {
        let component_name = name;

        let ProxyComp: IWidgetationProxyComp = {
            name: `R_${name}`,
            mixins: [proxy_widget_base],
            template: `
                <p 
                    :data-name="$options.name" 
                    :data-id="id" 
                    style="display: none"
                ></p>
            `,
            data() {
                return {
                    id: 0,
                    is_retro_component_proxy: true,
                    is_retro_object_proxy: false
                }
            },
            mounted() {
                console.log(`new component ${name}`)
                this.component_instance = new cls(this.params)
                this.detect_domain_game_object()
                this.domain_game_object.attach_component(this.component_instance, {
                    name: component_name,
                    tag: this.tag as any
                })
            },
            destroyed() {
                console.log(3001, this.$options.name)
                if (this.component_instance) {
                    this.domain_game_object.remove_component(this.component_instance)
                }
            }
        }
        return ProxyComp
    }
}