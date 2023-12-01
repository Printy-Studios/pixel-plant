import Rect from './Rect'
import Vector from './Vector'

type Direction = 'up' | 'down' | 'left' | 'right'

type ProgressBarOptions = {
    current: number,
    color: string,
    bg_color: string,
    divider_color?: string,
    direction: Direction
    dividers?: number[] //Places on the bar where a divider should be
}


export default class ProgressBar extends Rect {
    current: number
    color: string
    bg_color: string
    direction: Direction
    dividers: number[]
    divider_color: string

    constructor(rect: Rect, options: ProgressBarOptions) {
        super(rect.position, rect.size)
        Object.assign(this, options)
    }
}

//export default ProgressBar