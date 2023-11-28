import GameObject from './GameObject';
import Vector from './Vector'

export default class Sprite extends GameObject {

    image: ImageBitmap
    width: number
    height: number

    constructor(image: ImageBitmap, position?: Vector) {
        super(position);
        this.image = image;
        this.width = image.width;
        this.height = image.height;
    }

    getCenter(scale: number = 1) {
        return this.position.divide(scale).add(new Vector(-this.width / 2, - this.height / 2))
    }

}