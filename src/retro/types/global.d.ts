import { Object3D, WebGLRenderer } from "three";
import GameObject from "../GameObject";
import DeviceData from "../utils/Device";

export { };

declare global {

    var IS_DEV: boolean
    var IS_PROD: boolean
    var VERSION_TAG: string

    interface Window {
        on_click_to_start: Function,
        app: App
        editor_app: any,
        editor_store: any,
        _frame: Frame,
        F_THREE_PATCH_PROPS: Function
        F_BROADCAST_HOOK: Function
        F_PATCH_COMP_PROPS: Function
        F_THREE_PATCH_UNIFORMS: Function
        F_TEXTURE_STREAMING_FUNCTION: Function
        rm: any
    }

    class App { }
    class Frame { }

    class PackageDataDict {
        version: string
    }

    var PACKAGE_DATA: PackageDataDict

    class NodeRequire {
        context: Function
    }

    class EventDispatcher {
        addEventListener: Function
    }

    class PRESET {
        static DEFAULT_TICKRATE: number
        static NO_GREETING: boolean
        static PERSISTENT_SCENE_PREFAB: string
        static WORK_IN_BACKGROUND_MOBILE: boolean
        static WORK_IN_BACKGROUND: boolean
        static RUNTIME_IMMUTABLE_CONTEXT_ENABLED: boolean
        static FEATURE_WIDGETATION_PREFIX: string
        static FEATURE_WIDGETATION_ENABLE: boolean
    }

    interface ReflectedObject {
        __proto__: any
    }

    interface IVector3LikeObject {
        x: number
        y: number
        z: number
    }

    interface IRetroComponentRenderDataItem {
        object: Object3D
        parent: GameObject
    }

    interface IRetroComponentGizmoRenderDataItem {
        object: Object3D
        parent: Object3D
        layers: {
            [x: string]: boolean
        }
    }

    interface IRetroObjectTimeData {
        non_stop: boolean,
        prev_time: number,
        delta: number,
        ticks: number,
        rate: number,
        enabled: boolean
    }

    interface IRetroObjectMeta {
        params: object
        persistence_inited: boolean
        persistence_autosave: boolean
        has_persistent_state: boolean
        game_object: GameObject
        object_type: string
        enabled: boolean
        lifecycle: {
            never_enabled: boolean
        }
        reactivated: boolean,
        layers: {
            rendering: boolean
            normal: boolean
            raycast: boolean
            collision: boolean
            gizmo: boolean
            lights: boolean
            include: Array<string>
            exclude: Array<string>
        }
        params_applied: boolean,
        ticking: IRetroObjectTimeData
        need_reactive_update: boolean
        updated_reactive_props: Array<string>
        reactive_values: object
    }

    interface IGeneratedPrefab {
        enabled: boolean
        name: string
        ref: string

    }

    interface IGeneratedScenePrefab extends IGeneratedPrefab {
        position: number[] | IVector3LikeObject
        scale: number[] | IVector3LikeObject | number
        rotation: number[] | IVector3LikeObject
        visible: boolean
        render_layer: number
        render_index: number
        render_order: number
        frustum_culled: boolean
    }

    interface IGlobalsDict {
        now: number
        renderer?: WebGLRenderer
    }

    interface IRetroObject { }

    interface IGameObject extends IRetroObject { }

    interface IRetroComponent extends IRetroObject {
        component_name: string
        is_component: boolean
    }

    interface IWidgetComponent extends IRetroComponent {
        store_commit: (token_name: string, data: any) => void
        store_set: (token_name: string, data: any) => void
        call_inside_widget_application: (method_mame: string) => void
        fit_zoom_upscale: boolean
        zoom: number
    }

    interface IRendererComponent extends IRetroComponent {
        target_fps: number
        rendering_scale: number
    }

    interface IAudioListenerComponent extends IRetroComponent {
        bound_object: GameObject
    }

    interface IClockComponent extends IRetroComponent {
        begin_tick(): void
    }

    interface ITextureParams {
        filter?: string
        maxsize?: number
    }

    /**Game Object */
    interface IGameObjectPrefabComponentDeclarationParams {
        [x: string]: any
    }
    interface IGameObjectPrefabInlineComponentDeclaration {
        props?: {
            [x: string]: any
        },
        methods?: {
            [x: string]: {
                body: string
                throttle?: number
                debounce?: number
                args?: string[]
            }
        },
        construct?: string
    }

    interface IGameObjectPrefabComponentDeclaration {
        name: string
        meta?: IRetroObjectMeta
        context?: string
        enabled?: boolean
        params?: IGameObjectPrefabComponentDeclarationParams
        ref?: string
        inline?: IGameObjectPrefabInlineComponentDeclaration
        tag?: string
    }

    interface IGameObjectPrefab {
        children?: Array<IGameObjectPrefab>
        states?: object
        tasks?: Array<any>
        position?: Array<number>
        scale?: Array<number>
        rotation?: Array<number>
        visible?: boolean
        enabled?: boolean
        frustum_culled?: boolean
        render_order?: number
        components?: {
            [x: string]: IGameObjectPrefabComponentDeclaration
        }
    }

    interface IRetroTools {
        device: typeof DeviceData
        screen: {
            is_document_visible: Boolean
        },
        type: {
            [x: string]: ((p: any) => boolean)
        }
        intl: {
            [x: string]: Function
        },
        math: {
            [x: string]: Function
        }
        random: {
            [x: string]: Function
        }
        extra: {
            [x: string]: Function
            make_immutable_context_for_object: (target: object) => void
        }
    }

}


