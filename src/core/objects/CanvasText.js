/* created by @sanyabeast 8/14/2021 1:31:45 AM
 *
 *
 */

import * as THREE from 'three';
import AssetManager from "core/utils/AssetManager";


class CanvasText extends THREE.Object3D {
    mesh = null;
    inited = false
    constructor(params) {
        super(params);
        this.params = {
            shrink: 1,
            font_size: 12,
            font_family: "monospace",
            bold: false,
            text: "",
            color: "#ffffff",
            offset_x: 1,
            offset_y: 1,
            ...params,
        };


    }

    init() {
        if (!this.inited) {
            this.canvas = document.createElement("canvas");
            this.canvas.width = 1000
            this.canvas.height = 1000
            this.context2d = this.canvas.getContext("2d");
            this.texture = new THREE.Texture(this.canvas);

            let geometry = new THREE.PlaneBufferGeometry(0.1, 0.1);
            // geometry.translate(-0.05, -0.05, 0)

            let material = AssetManager.create_material("@canvas_text")
            material.uniforms.map.value = this.texture
            if (this.params.gradient) {
                let gradient = this.context2d.createLinearGradient(...this.params.gradient.layout);
                this.params.gradient.colors.forEach((d) => {
                    gradient.addColorStop(d[0], d[1])
                })

                this.gradient_object = gradient
            }

            // material.alphaTest  = 0.5
            // material.depthWrite = false
            // material.depthTest = true

            this.subject = new THREE.Mesh({ geometry, material });
            this.subject.render_layer = this.render_layer
            this.subject.render_index = this.render_index
            this.add(this.subject);

            // this.update_text = debounce(this.update_text.bind(this), 100)
            this.update_text();
        }
        this.inited = true
    }

    set_text(t) {
        if (t !== this.params.text) {
            this.params.text = t
            this.update_text()

        }
    }

    async update_text() {
        if (this.params.background_image && !this.background_image) {
            this.background_image = await AssetManager.load_image(this.params.background_image)
        }


        this.context2d.font = `${this.params.font_weight ?? "400"} ${this.params.font_size
            }px ${this.params.font_family}`;
        let measure = this.context2d.measureText(this.params.text);
        this.canvas.width = this.params.fixed_width || measure.width + 2;
        this.canvas.height = this.params.fixed_height || this.params.font_size + 4;
        this.subject.scale.x = this.params.fixed_width || measure.width + 2;
        this.subject.scale.y = this.params.fixed_height || this.params.font_size + 4;


        this.context2d.clearRect(1, 2, this.canvas.width, this.canvas.height);

        if (this.background_image) {
            this.context2d.drawImage(this.background_image, 0, 0, this.canvas.width, this.canvas.height);
        }

        this.context2d.shadowOffsetX = 3;
        this.context2d.shadowOffsetY = 3;
        this.context2d.shadowColor = "rgba(0,0,0,0.3)";
        this.context2d.shadowBlur = 4;
        this.context2d.font = `${this.params.bold ? "bold" : ""} ${(this.params.font_size * this.params.shrink)
            }pt ${this.params.font_family}`;
        this.context2d.fillStyle = this.params.fill_style ?? "#000000"
        if (this.params.gradient) {
            this.context2d.fillStyle = this.gradient_object
        }
        this.context2d.textAlign = "center";
        this.context2d.textBaseline = "middle";



        this.context2d.fillText(
            this.params.text,
            (this.canvas.width / 2) * this.params.offset_x,
            (this.canvas.height / 2) * this.params.offset_y
        );

        this.subject.material.map = this.texture;
        this.texture.needsUpdate = true;
        this.subject.material.map.needsUpdate = true;

        this.globals.need_render = true

    }
}


export default CanvasText