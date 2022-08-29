<template>
  <div class="dev-gui" :class="{ mobile: device.device_type !== `desktop`, hidden: !is_dev_env }">
    <div class="status">
      <div class="status-line">
        <p>dev mode</p>
      </div>
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
        <p v-html="
          `camera pos: [x: ${camera_pos[0]}; y: ${camera_pos[1]}; z: ${camera_pos[2]};]`
        "></p>
      </div>
      <div class="status-line">
        <p v-html="
          `pointer screen pos: [x: ${pointer_pos[0]}; y: ${pointer_pos[1]};]`
        "></p>
      </div>
      <div class="status-line">
        <p v-html="`render items: ${render_items_count}`"></p>
      </div>
      <div class="status-line">
        <p v-html="`sun time: ${sun_time}`"></p>
      </div>
      <div class="status-line" v-for="(item, name) in user_lines" :key="name">
        <p v-html="`${item.title}: ${item.text}`"></p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import ResourceManager from "retro/ResourceManager";
import Device from "retro/utils/Device";

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
      sun_time: "00:00",
      user_lines: {},
    };
  },
  props: {},
  computed: {
    is_dev_env() {
      return IS_DEV;
    }
  },
  watch: {},
  mounted() {
    window.dev_gui = this;
    this.asset_stats = ResourceManager.get_asset_stats();
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

      let renderer = this.find_component_of_type("Renderer");
      if (renderer) {
        this.render_items_count = renderer.render_items_count;
      }

      let sun = this.find_component_of_type("Sun");
      if (sun) {
        this.sun_time = this.calc_sun_time(sun.time);
      }
    },
    calc_sun_time(progress) {
      let r = "00:00";

      let total_mins = 60 * 24;
      let current_mins = Math.floor(total_mins * progress);
      let h = Math.floor(current_mins / 60).toString();
      let m = (current_mins % 60).toString();
      if (h.length === 1) h = "0" + h;
      if (m.length === 1) m = "0" + m;

      return `${h}:${m}`;
    },
    update_line(tag, { title, text }) {
      let current = this.user_lines[tag];
      if (!current) current = {};
      current.text = text;
      current.title = title;
      this.user_lines[tag] = current;
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
  opacity: 0.2;
  text-align: right;

  &.hidden {
    display: none;
  }

  &.--mobile {
    font-size: 8px;

    .status .status-line {
      font-size: 8px;
      line-height: 1em;
    }
  }

  .status {
    position: absolute;
    top: 16px;
    right: 16px;

    .status-line {
      color: #eeeeee;
      font-size: 10px;
      line-height: 1em;
    }
  }
}
</style>