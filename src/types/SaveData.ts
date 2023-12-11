import { PlantID } from '../Plant'

export type PlantData = {
    id: PlantID,
    plant_id: string,
    name: string,
    water_level_current: number,
    growth: number,
    fully_grown_called: boolean,
}

export type SaveData = {
    pace: number,
    max_id: number,
    unlocked_plants: string[],
    plant: PlantData,
    leave_time: number
}