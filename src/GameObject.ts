import Vector from './Vector';

export default class GameObject {

    position: Vector;

    constructor(position: Vector = new Vector(0, 0)) {
        this.position = position
    }

}