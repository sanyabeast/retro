import { Object3D } from '../core/Object3D.js';

class Group extends Object3D {

	constructor(params) {
		super(params);
		this.type = 'Group';
	}

}

Group.prototype.isGroup = true;

export { Group };
