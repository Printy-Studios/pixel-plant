import Vector from './Vector';
import GameObject from './GameObject';
import ProgressBar from './ProgressBar';
import Sprite from './Sprite';
import WaterLevel from './WaterLevel'
import Rect from './Rect';
import { getPlantImageID, getTemplateResourceID, getViewportCenter, rangeOverlap } from './util';
import MyCache from './MyCache';
import constants from './const';

type PlantID = string | number

export type PlantStage = {
    sprite: Sprite,
    at_growth: number
}

export type PlantData = {
    id: PlantID,
    plant_id: string,
    name: string,
    water_level_current: number,
    growth: number,
    fully_grown_called: boolean,
}

export type PlantTemplate = {
    plant_id: string,
    name: string,
    description: string,
    unlocks?: string,
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
    }[]
}

export type PlantOptions = {
    plant_id: string,
    name?: string,
    water_level?: WaterLevel,
    current_stage?: number,
    stages: PlantStage[],
    growth?: number,
    position?: Vector,
    unlocks?: string,
}

export default class Plant extends GameObject {
    id: string | number
    plant_id: string
    name: string
    unlocks: string

    water_level: WaterLevel = new WaterLevel(
        0.5,
        [
            {
                from: 0,
                to: 100,
                growth_rate: 4
            },
        ]
    );
    water_level_bar: ProgressBar; 
    current_stage: number = 0;
    stages: PlantStage[]
    growth: number = 0;
    position: Vector = new Vector(0, 0)
    size: Vector = new Vector(16, 32)

    fully_grown_called: boolean;
    fully_grown_cb: (plant: Plant) => void

    constructor(id: string | number, options: PlantOptions) {
        super()
        this.id = id;
        Object.assign(this, options);
        
        this.initWaterLevelBar();
        
        this.setPosition(getViewportCenter());
    }

    initWaterLevelBar() {
        const dividers = this.water_level.stages.map(stage => stage.to);
        dividers.pop();

        this.water_level_bar = new ProgressBar(
            new Rect(
                new Vector(0, 0),
                new Vector(20, 2)
            ),
            {
                bg_color: '#0008FF42',
                color: '#0008FFAD',
                divider_color: 'darkblue',
                direction: 'right',
                current: 0,
                dividers
            }
        )
        this.water_level_bar.current = this.water_level.current
    }

    maxGrowth() {
        return this.stages[this.stages.length - 1].at_growth
    }

    isFullyGrown() {
        return this.growth > this.maxGrowth() 
    }

    toJSON(): PlantData {
        return {
            id: this.id,
            plant_id: this.plant_id,
            name: this.name,
            water_level_current: this.water_level.current,
            growth: this.growth,
            fully_grown_called: this.fully_grown_called
        }
    }

    onFullyGrown(callback: ( plant: Plant ) => void) {
        this.fully_grown_cb = callback;
    }

    static async fromJSON(json: PlantData, cache: MyCache) {
        const plant = await Plant.fromTemplate(json.id, json.plant_id, cache)
        plant.name = json.name
        plant.water_level.set(json.water_level_current)
        plant.setGrowth(json.growth)
        plant.fully_grown_called = json.fully_grown_called;
        return plant;
    }

    static async stagesFromTemplate(template: PlantTemplate, cache: MyCache) {
        const plant_stages: PlantStage[] = []
        for(let i = 0; i < template.stages.length; i++) {
            const res_id = getPlantImageID(template.plant_id, i)
            
            const image = cache.get(res_id);

            //Plant data
            const sprite = new Sprite(image);
            const at_growth = template.stages[i].at_growth

            plant_stages.push(
                {
                    sprite,
                    at_growth
                }
            )
        }

        return plant_stages;
    }

    static async fromTemplate(id: string | number, template_id: string, cache: MyCache) {

        const res_id = getTemplateResourceID(template_id);

        if(!cache.has(res_id)) {
            const template_res = await fetch('./plant_templates/' + template_id + '.json');
            const template = await template_res.json()
            cache.set(res_id, template)
        }

        const template: PlantTemplate = cache.get(res_id);

        const stages = await Plant.stagesFromTemplate(template, cache);
        const water_level = WaterLevel.fromTemplate(template)
        const options: PlantOptions = {
            plant_id: template.plant_id,
            water_level,
            name: 'My Plant',
            stages,
            unlocks: template.unlocks
        }
        return new Plant(
            id,
            options
        )
    }

    private calculateCurrentStage() {
        const stage_indexes = this.stages.map((stage, index) => index);
        var curr_stage_index = stage_indexes.reduce((a, i)=> {
            const prev_stage = this.stages[a];
            const curr_stage = this.stages[i];

            let is_growth_in_curr_stage = curr_stage.at_growth > prev_stage.at_growth && this.growth > curr_stage.at_growth
            if(is_growth_in_curr_stage) {
                return i;
            } else {
                return a;
            }
        }) as unknown as number

        this.current_stage = curr_stage_index
    }

    growBy(added_growth: number) {
        this.growth += added_growth;
        this.calculateCurrentStage();

        if(this.isFullyGrown() && this.fully_grown_cb && !this.fully_grown_called) {
            this.fully_grown_cb(this);
            this.fully_grown_called = true;
        }
    }

    /**
     * Grows plant by 1 tick
     */
    grow(){
        let growth_rate = 0;
        if(this.water_level.current > 0) {
            growth_rate = this.water_level.getCurrentStage().growth_rate
        }
        this.growBy(growth_rate)
    }

    setGrowth(growth: number) {
        this.growth = growth;
        this.calculateCurrentStage();
    }

    getCurrentStage() {
        return this.stages[this.current_stage]
    }

    fastForward(ticks: number) {
        const water_end = this.water_level.current;
        this.water_level.decreaseByTicks(ticks);
        const water_start = this.water_level.current
        
        let added_growth = 0;
        for(let i = 0; i < this.water_level.stages.length; i++) {
            const water_stage = this.water_level.stages[i];
            const growt_rate = water_stage.growth_rate;
            const overlap = rangeOverlap(water_start, water_end, water_stage.from, water_stage.to);
            added_growth += (overlap / this.water_level.decrease_rate) *  growt_rate
        }
        this.growBy(added_growth)
    }

    tick() {
        this.grow();
        //this.water_level.decrease();
        this.decreaseWaterLevel();
    }

    decreaseWaterLevelByTicks(ticks: number) {
        this.water_level.decreaseByTicks(ticks)
        this.updateWaterLevelBar();
    }

    decreaseWaterLevel() {
        this.decreaseWaterLevelByTicks(1)
    }

    updateWaterLevelBar() {
        this.water_level_bar.current = this.water_level.current
    }

    setPosition(p: Vector) {
        this.position = p;
        for(let i = 0; i < this.stages.length; i++) {
            this.stages[i].sprite.position = this.position;
        }
        this.water_level_bar.setPosition(new Vector(
            this.position.x,
            this.getRect().bottom + 2
        ))
    }

    getRect() {
        return {
            top: this.position.y - this.size.y / 2,
            bottom: this.position.y + this.size.y / 2,
            left: this.position.x - this.size.x / 2,
            right: this.position.x + this.size.x / 2
        }
    }
}