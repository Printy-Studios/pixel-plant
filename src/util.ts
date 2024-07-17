import constants from './const';
import MyCache from './MyCache';
import { PlantTemplate, PlantTemplates } from './types/PlantTemplate';
import Vector from './Vector';

type Time = {
    h: number,
    m: number,
    s: number
}

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

export function humanReadableTime(time: Time) {
    const hours_str = time.h > 0 ? `${time.h} ${time.h == 1 ? 'hour' : 'hours'}` : null;
    const mins_str = time.m > 0 ? `${time.m} ${time.m == 1 ? 'minute' : 'minutes'}` : null;
    const seconds_str = time.s > 0 ? `${time.s} ${time.s == 1 ? 'second' : 'seconds'}` : null;

    const arr = [hours_str, mins_str, seconds_str].filter(str => str != null);

    return arr.join(', ');
}

export function humanReadableTimeFromSeconds(seconds: number) {
    const time = secondsToTime(seconds);
    return humanReadableTime(time);
}

export function getViewportCenter() {
    return new Vector(
        window.innerWidth / 2 / constants.scale,
        window.innerHeight / 2 / constants.scale
    )
}

export function getTemplateMaxStageIndex(template: PlantTemplate) {
    return template.stages.length - 1;
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

export function getPlantTemplateFullyGrownImageURL(plant_template: PlantTemplate) {
    const max_stage = plant_template.stages.length - 1;
    return plant_template.stages[max_stage].image_url
}

export function getTemplateUnlock(template_id: string, all_templates: PlantTemplates) {
    const unlock_id = all_templates[template_id].unlocks;
    return all_templates[unlock_id]
}

/**
 * Get the maximum units of growth a plant can grow to
 */
export function getTemplateMaxGrowth(plant_template: PlantTemplate) {
    const max_stage_index = getTemplateMaxStageIndex(plant_template);
    return plant_template.stages[max_stage_index].at_growth * plant_template.multiplier;
}

/**
 * Get the plants max water index
 * @param plant_template 
 */
export function getTemplateMaxWaterIndex(plant_template: PlantTemplate) {
    return plant_template.water_level.stages.length - 1;
}

/**
 * Get plant's max water level
 */
export function getTemplateMaxWaterStage(plant_template: PlantTemplate) {
    const max_index = getTemplateMaxWaterIndex(plant_template);
    return plant_template.water_level.stages[max_index]
}

/**
 * Get the growth rate of a plant at max water level
 */
export function getTemplateMaxGrowthRate(plant_template: PlantTemplate) {
    const max_water_level = getTemplateMaxWaterStage(plant_template);

    return max_water_level.growth_rate * plant_template.multiplier;
}

/**
 * Time it takes to grow a plant if its is at max water stage
 */
export function templateTimeToGrow(plant_template: PlantTemplate, seconds_per_tick: number) {
    const max_growth = getTemplateMaxGrowth(plant_template);
    const max_growth_rate = getTemplateMaxGrowthRate(plant_template);
    return max_growth * plant_template.multiplier / max_growth_rate * seconds_per_tick;
}

/**
 * How often a plant's water level runs out, in seconds
 * 
 */
export function templateWateringFrequency(plant_template: PlantTemplate, seconds_per_tick: number) {
    const water_decrease_rate = plant_template.water_level.decrease_rate * plant_template.multiplier;
    return 100 / water_decrease_rate * seconds_per_tick;
}