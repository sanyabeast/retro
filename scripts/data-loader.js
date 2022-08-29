/** file created by @sanyabeast | 26 Aug 2022 */

const loader_utils = require('loader-utils')
let schemas = undefined
var Validator = require('jsonschema').Validator;
var v = new Validator();

let schema_lib_inited = false

module.exports = function (source_code, map, meta) {
    let options = loader_utils.getOptions(this)

    if (!schema_lib_inited){
        for (let k in options.schema_lib){
            v.addSchema(options.schema_lib[k], `/${k}`)
        }
        console.log(options.schema_lib)
        schema_lib_inited = true
    }
    // console.log(source_code.substring(0, 32))
    console.log(this.resourcePath);

    return source_code
}