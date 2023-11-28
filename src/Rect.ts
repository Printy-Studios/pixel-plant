import Vector from './Vector';

export default class Rect {
    position: Vector;
    size: Vector;
    top: number;
    bottom: number;
    left: number;
    right: number;

    constructor(position = new Vector(0, 0), size = new Vector(0, 0)) {
        this.size = size;
        this.position = position;
    }

    calculateBounds() {
        this.left = this.position.x - this.size.x / 2;
        this.right = this.position.x + this.size.x / 2;
        this.top = this.position.y - this.size.y / 2;
        this.bottom = this.position.y - this.size.y / 2;
    }

    setPosition(v: Vector) {
        this.position = v;
        this.calculateBounds();
    }
}