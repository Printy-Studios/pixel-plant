import constants from './const';
import MyCache from './MyCache';
import { PlantTemplate, PlantTemplates } from './types/PlantTemplate';
import Vector from './Vector';


export function rangeOverlap(x1: number, x2: number, y1: number, y2: number) {
    return Math.max(0, Math.min (x2, y2) - Math.max (x1, y1) + 1);
}

export function secondsToTime(secs: number) {
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    var obj = {
        "h": hours,
        "m": minutes,
        "s": seconds
    };
    return obj;
}

export function getTemplateMaxStageIndex(template: PlantTemplate) {
    return template.stages.length - 1;
}

export function getViewportCenter() {
    return new Vector(
        window.innerWidth / 2 / constants.scale,
        window.innerHeight / 2 / constants.scale
    )
}

export function getPlantImageID(plant_id: string, stage: number) {
    return 'images/' + plant_id + '/' + stage;
}

export function getPlantImageBloblID(plant_id: string, stage: number) {
    return 'image_blobs/' + plant_id + '/' + stage;
}

export function getTemplateResourceID(template_id:string) {
    return 'templates/' + template_id
}

export function getPlantTemplateFullyGrownImageURL(plant_template: PlantTemplate, cache: MyCache) {
    const max_stage = plant_template.stages.length - 1;
    const image = this.cache.get('image_blobs/' + plant_template.plant_id + '/' + max_stage)
    return URL.createObjectURL(image);
}

export function getTemplateUnlock(template_id: string, all_templates: PlantTemplates) {
    const unlock_id = all_templates[template_id].unlocks;
    return all_templates[unlock_id]
}