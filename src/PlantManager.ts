import MyCache from './MyCache';
import Plant from './Plant';
import globals from './globals';
import { PlantTemplates } from './PlantTemplate';
import { getTicksBySeconds, secondsToTime } from './util';
import UIManager from './UIManager';

export default class PlantManager {

    cache: MyCache
    ui: UIManager

    plant: Plant;

    plant_templates: PlantTemplates = {}

    plant_template_ids: string[] = [
        "basic_plant",
        "yellow_dip"
    ]

    on_plant: (plant: Plant) => void
    on_plant_grown: (plant: Plant) => void

    constructor(ui: UIManager) {
        this.ui = ui;
    }

    async init(cache: MyCache) {
        this.cache = cache;
        //let difference_s = this.getTimeAway()

        // this.plants = {};

        // for(let i = 0; i < this.data.plants.length; i++) {
        //     const plant = await Plant.fromJSON(this.data.plants[i], this.cache)
        //     this.createPlant(plant)
        // }
        const plant = await Plant.fromJSON(globals.data.plant, cache)
        //this.createPlant(plant);
        //this.fastForwardBySeconds(difference_s)

        this.setPlant(plant);
    }

    get(){
        return this.plant;
    }

    async plantNewPlant(template_id: string) {
        console.log('planting')
        const plant = await Plant.fromTemplate('my_plant', template_id, this.cache);
        this.setPlant(plant);
        if(this.on_plant) {
            this.on_plant(plant);
        }
    }

    setPlant(plant: Plant) {
        this.plant = plant;
        this.plant.onFullyGrown(this.on_plant_grown);
    }

    fastForwardBySeconds(seconds: number) {
        if(!seconds) {
            return;
        }
        const growth_before = this.plant.growth;

        const ticks = getTicksBySeconds(seconds)
        this.plant.fastForward(ticks);

        const growth_after =  this.plant.growth;
        

        const time = secondsToTime(seconds);
        console.log(time)
        if(time.m > 0) {
            const growth_difference = growth_after - growth_before;
            let growth_percent: number | boolean = growth_difference / this.plant.maxGrowth() * 100

            if(this.plant.isFullyGrown()) {
                growth_percent = true;
            }

            
            let message = this.ui.progressMessageText(time, growth_percent)

            let show_plant_button = false;
            const unlock = this.getTemplateUnlock(this.plant.plant_id);

            if (this.plant.isFullyGrown() && unlock) {
                message += '<br><b>You have unlocked a new plant - ' + unlock.name + '. Would you like to plant it?';
                show_plant_button = true;
            }

            this.ui.displayProgressMessage(message, show_plant_button);
        }
        
    }

    getTemplateUnlock(template_id: string) {
        const unlock_id = this.plant_templates[template_id].unlocks;
        return this.plant_templates[unlock_id]
    }

    // createPlant(plant: Plant) {
    //     this.plants[plant.id] = plant;
    // }
}