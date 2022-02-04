
/* created by @sanyabeast 9/6/2021 
 *
 *
 */

import Component from "retro/Component";
import ResourceManager from "retro/ResourceManager";
import { Vector3 } from 'three';
import { log, error, is_none, console } from "retro/utils/Tools"
import { isString, isObject, isFunction, isArray, isNumber, isBoolean, isUndefined, isNull, map, filter, keys, values, set, get, unset } from "lodash-es"
import Schema from "retro/utils/Schema"

import d3 from "d3"

class D3Chart extends Component {
    on_create() {
        this.log(`created`)

        let chart_dom_element = this.tools.extra.parse_html(`<div id="chart"></div>`)
        console.log(chart_dom_element)
        this.globals.dom.appendChild(chart_dom_element)

        const loadDataEndOfDay = d3.csv("/yahoo.csv", d => ({
            date: new Date(d.Timestamp * 1000),
            volume: Number(d.volume),
            high: Number(d.high),
            low: Number(d.low),
            open: Number(d.open),
            close: Number(d.close)
        }));

        loadDataEndOfDay.then(data => {
            // render the chart here
        });
    }
    on_tick(time_data) {

    }
}

export default D3Chart;

