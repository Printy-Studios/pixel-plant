export type PlantTemplate = {
    plant_id: string,
    name: string,
    description: string,
    unlocks?: string,
    multiplier: number
    water_level: {
        decrease_rate: number,
        stages: {
            from: number,
            to: number,
            growth_rate: number   
        }[]
    },
    stages: {
        at_growth: number
        image_url: string
    }[]
}

export type PlantTemplates = {
    [plant_id: string]: PlantTemplate
}
