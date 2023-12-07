import globals from './globals';
import MyCache from './MyCache';
import MyStorage from './MyStorage';
import PlantManager from './PlantManager';
import { SaveData } from './types/SaveData';
import Plant from './Plant';

export default class SaveManager {
    cache: MyCache
    storage: MyStorage
    plant: PlantManager

    constructor(cache: MyCache, storage: MyStorage, plant: PlantManager){
        this.cache = cache;
        this.storage = storage;
        this.plant = plant;
    }

    saveData(data: SaveData = null) {

        //If custom data object was passed, save that
        if(data) {
            this.storage.set('data', data)
            return;
        }
        //Otherwise get current plants and save them
        globals.data.pace = 1 / globals.seconds_per_tick;
        globals.data.plant = this.plant.get().toJSON();
        globals.data.leave_time = new Date().getTime();
        this.storage.set('data', globals.data);
    }

    async setDataToDefaults() {
        const basic_plant = await Plant.fromTemplate(0, 'basic_plant', this.cache);

        
        globals.data = {
            pace: 1,
            max_id: 1,
            leave_time: null,
            unlocked_plants: ["basic_plant"],
            plant: basic_plant.toJSON()
        }

        this.saveData(globals.data);
    }
}