<template>
  <div class="dev-gui" :class="{ mobile: device.device_type !== `desktop` }">
    <div class="status">
      <div class="status-line"><p>dev mode</p></div>
      <div class="status-line">
        <p v-html="`device type: ${device.device_type}`"></p>
      </div>
      <div class="status-line">
        <p v-html="`loaded components: ${asset_stats.components_count}`"></p>
      </div>
      <div class="status-line">
        <p v-html="`loaded materials: ${asset_stats.materials_count}`"></p>
      </div>
      <div class="status-line">
        <p v-html="`loaded geometries: ${asset_stats.geometries_count}`"></p>
      </div>
      <div class="status-line">
        <p v-html="`loaded prefabs: ${asset_stats.prefabs_count}`"></p>
      </div>
      <div class="status-line">
        <p
          v-html="
            `camera pos: [x: ${camera_pos[0]}; y: ${camera_pos[1]}; z: ${camera_pos[2]};]`
          "
        ></p>
      </div>
      <div class="status-line">
        <p
          v-html="
            `pointer screen pos: [x: ${pointer_pos[0]}; y: ${pointer_pos[1]};]`
          "
        ></p>
        <div class="status-line">
          <p v-html="`render items: ${render_items_count}`"></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import * as THREE from "three";
import AssetManager from "core/utils/AssetManager";
import Device from "core/utils/Device";

export default {
  mixins: [],
  name: "DevGUI",
  data() {
    return {
      asset_stats: {
        components_count: 0,
      },
      camera_pos: [0, 0, 0],
      pointer_pos: [0, 0],
      render_items_count: 0,
      device: Device,
    };
  },
  props: {},
  computed: {},
  watch: {},
  mounted() {
    console.log(this.$store);
    this.asset_stats = AssetManager.get_asset_stats();
  },
  methods: {
    on_tick() {
      let camera = this.find_component_of_type("CameraComponent");
      if (camera && camera.subject) {
        let pos = camera.subject.position;
        let fixed = 2;
        this.camera_pos = [
          pos.x.toFixed(fixed),
          pos.y.toFixed(fixed),
          pos.z.toFixed(fixed),
        ];
      }
      let input = this.find_component_of_type("InputComponent");
      if (input) {
        this.pointer_pos = [input.pointer_position.x, input.pointer_position.y];
      }

      let renderer = this.find_component_of_type("RendererComponent");
      if (renderer) {
        this.render_items_count = renderer.render_items_count;
      }
    },
  },
  /** */
  store: {
    state: {},
    mutations: {},
    actions: {},
    getters: {},
  },
};
</script>

<style lang="scss">
.dev-gui {
  position: relative;
  width: 100%;
  height: 100%;
  color: #ffffff;
  font-family: monospace;
  font-size: 14px;
  &.mobile {
    font-size: 8px;
    .status .status-line {
      font-size: 8px;
      line-height: 0.5em;
    }
  }
  .status {
    position: absolute;
    top: 16px;
    left: 16px;
    .status-line {
      color: #eeeeee;
      font-size: 10px;
      line-height: 0.75em;
    }
  }
}
</style>