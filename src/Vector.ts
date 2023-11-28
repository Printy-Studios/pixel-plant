export default class Vector {
    x: number
    y: number

    constructor (x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(v: Vector) {
        return new Vector(
            this.x + v.x,
            this.y + v.y
        )
    }

    divide(n: number) {
        return new Vector(
            this.x / n,
            this.y / n
        )
    }
}