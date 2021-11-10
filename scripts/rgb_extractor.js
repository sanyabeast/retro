const cmd_args = require('command-line-args')
const get_pixels = require('image-pixels')
const save_pixels = require("save-pixels")
const zeros = require("zeros")
const fs = require("fs")
const path = require("path")

const CHANNEL_NAMES = ["RED", "GREEN", "BLUE", "ALPHA"]
const options = cmd_args([
    { name: 'input', alias: 'i', type: String },
    { name: 'type', alias: 't', type: String, defaultValue: "jpg" }
])

async function main() {
    let base_path = path.dirname(options.input)
    let image_name = path.basename(options.input)
    image_name = image_name.replace(".png", "").replace(".jpg", "")
    let { data, width, height } = await get_pixels(options.input)

    for (let a = 0; a < 4; a++) {
        console.log(`EXTRACTING ${CHANNEL_NAMES[a]}...`)
        let new_data = zeros([width, height])
        let channel_id = a
        let data_extracted = extract_channel(data, channel_id)
        data_extracted.forEach((v, i) => {
            let x = i % width
            let y = Math.floor(i / width)
            new_data.set(x, y, v)
        })
        write_pixels(new_data, `${base_path}/${image_name}_channel_${CHANNEL_NAMES[channel_id]}.${options.type}`, `${options.type}`, {}, (d) => d)
    }
}

function extract_channel(arr, channel) {
    let result = new Uint8Array(arr.length / 4);
    for (let a = 0, l = result.length; a < l; a++) {
        let c = Math.min(arr[a * 4 + channel], 255)
        result[a] = c
    }
    return result
}

function write_pixels(array, filepath, format, options, cb) {
    let out = fs.createWriteStream(filepath)
    let pxstream = save_pixels(array, format, options)
    pxstream.pipe(out)
        .on("error", cb)
        .on("close", cb)
}


main()