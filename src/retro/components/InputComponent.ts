
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import SceneComponent from "retro/SceneComponent";
import ResourceManager from "retro/ResourceManager";
import { Vector2, Raycaster } from 'three';
import { map, forEach, set, get, isNil, isObject } from "lodash-es"
import Collider from "retro/components/collision/Collider";

const raycaster: Raycaster = new Raycaster();
const mouse: Vector2 = new Vector2();

class InputDaemon {
    protected id: string;
    protected domain: InputComponent;
    constructor(id: string, domain: InputComponent) {
        this.id = id;
        this.domain = domain
    }
    public destroy(): void {
        console.log(`destroying input daemon`);
    }
}

class MouseState {
    public hovered: boolean = false
    public captured: boolean = true
    public pos_x: number = 0
    public pos_y: number = 0
    public prev_pos_x: number = 0
    public prev_pos_y: number = 0
    public delta_x: number = 0
    public delta_y: number = 0
    constructor(source?: MouseState) {
        if (isObject(source)) {
            forEach(source, (v: any, k: string) => {
                this[k] = v;
            })
        }
    }
    public update_pos(x: number = 0, y: number = 0): void {
        if (this.hovered) {
            this.delta_x = x - this.prev_pos_x
            this.delta_y = y - this.prev_pos_y
            this.prev_pos_x = this.pos_x
            this.prev_pos_y = this.pos_y
            this.pos_x = x
            this.pos_y = y
        }
    }
    public clone(): MouseState {
        return new MouseState(this);
    }
}

class InputComponent extends SceneComponent {
    public static instance?: InputComponent;

    private mouse_state: MouseState = new MouseState()

    constructor(params) {
        super(params)
        this.handle_mouseover = this.handle_mouseover.bind(this)
        this.handle_mouseout = this.handle_mouseout.bind(this)
        this.handle_mousemove = this.handle_mousemove.bind(this)
        this.handle_mousedown = this.handle_mousedown.bind(this)
        this.handle_mouseup = this.handle_mouseup.bind(this)
        InputComponent.instance = this;
    }
    override on_create() {
        this.globals.dom.addEventListener('mouseover', this.handle_mouseover, false)
        this.globals.dom.addEventListener('mouseout', this.handle_mouseout, false)
        this.globals.dom.addEventListener('mousemove', this.handle_mousemove, false)
        this.globals.dom.addEventListener('mousedown', this.handle_mousedown, false)
        this.globals.dom.addEventListener('mouseup', this.handle_mouseup, false)
    }
    override async on_destroy() {
        await super.on_destroy();
        this.globals.dom.removeEventListener('mouseover', this.handle_mouseover, false)
        this.globals.dom.removeEventListener('mouseout', this.handle_mouseout, false)
        this.globals.dom.removeEventListener('mousemove', this.handle_mousemove, false)
        this.globals.dom.removeEventListener('mousedown', this.handle_mousedown, false)
        this.globals.dom.removeEventListener('mouseup', this.handle_mouseup, false)
    }
    override get_gizmo_render_data(): IRetroComponentGizmoRenderDataItem[] {
        return [
            ...super.get_gizmo_render_data()
        ]
    }
    override on_tick(time_data) {

    }
    protected handle_mouseover(evt: MouseEvent): void {
        this.mouse_state.update_pos(evt.offsetX / (evt.target as HTMLElement).offsetWidth, evt.offsetY / (evt.target as HTMLElement).offsetHeight);
        this.mouse_state.hovered = true
    }
    protected handle_mouseout(evt: MouseEvent): void {
        this.mouse_state.hovered = false
    }
    protected handle_mousedown(evt: MouseEvent): void {
        this.mouse_state.captured = true
    }
    protected handle_mouseup(evt: MouseEvent): void {
        this.mouse_state.captured = false
    }
    protected handle_mousemove(evt: MouseEvent): void {
        this.mouse_state.update_pos(evt.offsetX / (evt.target as HTMLElement).offsetWidth, evt.offsetY / (evt.target as HTMLElement).offsetHeight);
    }
    public raycast_from_screen() {

    }
    public create_input(id: string): InputDaemon {
        return new InputDaemon(id, this);
    }
}

export default InputComponent;
