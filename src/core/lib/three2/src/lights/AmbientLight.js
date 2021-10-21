import { Light } from './Light.js';

class AmbientLight extends Light {

	constructor(params ) {
		console.log(params)
		params = params || {  color: "#ffffff", intensity: 1 }
		super( params );

		this.type = 'AmbientLight';

	}

}

AmbientLight.prototype.isAmbientLight = true;

export { AmbientLight };
