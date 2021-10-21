import { PerspectiveCamera } from './PerspectiveCamera.js';

class ArrayCamera extends PerspectiveCamera {

	constructor( params ) {

		super();

		this.cameras = params ? params.array : [];

	}

}

ArrayCamera.prototype.isArrayCamera = true;


export { ArrayCamera };
