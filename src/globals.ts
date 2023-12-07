import { SaveData } from './types/SaveData';


type Globals = {
    seconds_per_tick: number
    data: SaveData
    [key: string]: any
}

const globals: Globals = {
    seconds_per_tick: 1,
    data: {
        pace: 1,
        max_id: 0,
        unlocked_plants: ['basic_plant'],
        plant: null,
        leave_time: null
    },
    getTimeAway: () => {
        let current_time_ms = new Date().getTime();
        return globals.data.leave_time ? (current_time_ms - globals.data.leave_time) / 1000 : null;
    }
}

export default globals;