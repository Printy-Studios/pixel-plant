import Rect from './Rect'
import Vector from './Vector'

type Direction = 'up' | 'down' | 'left' | 'right'

type ProgressBarOptions = {
    current: number,
    color: string,
    bg_color: string,
    direction: Direction
}


export default class ProgressBar extends Rect {
    current: number
    color: string
    bg_color: string
    direction: Direction

    constructor(rect: Rect, options: ProgressBarOptions) {
        super(rect.position, rect.size)
        Object.assign(this, options)
    }
}

//export default ProgressBar