const extract = require('extract-zip')
const path = require("path")
const cmd_args = require('command-line-args')
const options = cmd_args([
    { name: 'name', alias: 'n', type: String }
])
console.log(options)

async function main() {
    try {
        await extract(path.resolve(process.cwd(), "misc/app_template.zip"), { dir: path.resolve(process.cwd(), `src/apps/${options.name}/`) })
        console.log('Extraction complete')
    } catch (err) {
        console.log("Error", err)
        // handle any errors
    }
}

main()