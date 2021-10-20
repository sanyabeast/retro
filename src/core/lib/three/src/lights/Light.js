import { Object3D } from '../core/Object3D.js';
import { Color } from '../math/Color.js';

class Light extends Object3D {

	constructor( params ) {

		super();

		this.type = 'Light';

		this.color = new Color( params.color );
		this.intensity = params.intensity;

	}

	dispose() {

		// Empty here in base class; some subclasses override.

	}

	copy( source ) {

		super.copy( source );

		this.color.copy( source.color );
		this.intensity = source.intensity;

		return this;

	}

	toJSON( meta ) {

		const data = super.toJSON( meta );

		data.object.color = this.color.getHex();
		data.object.intensity = this.intensity;

		if ( this.groundColor !== undefined ) data.object.groundColor = this.groundColor.getHex();

		if ( this.distance !== undefined ) data.object.distance = this.distance;
		if ( this.angle !== undefined ) data.object.angle = this.angle;
		if ( this.decay !== undefined ) data.object.decay = this.decay;
		if ( this.penumbra !== undefined ) data.object.penumbra = this.penumbra;

		if ( this.shadow !== undefined ) data.object.shadow = this.shadow.toJSON();

		return data;

	}

}

Light.prototype.isLight = true;

export { Light };
