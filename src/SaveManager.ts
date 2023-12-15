import main_events from './main_events';
import MyCache from './MyCache';
import MyStorage from './MyStorage';
import Plant from './Plant';
import { SaveData } from './types/SaveData';

export default class SaveManager {

    storage: MyStorage
    cache: MyCache

    constructor(storage: MyStorage, cache: MyCache) {
        this.storage = storage;
        this.cache = cache;
    }

    data: SaveData

    saveData(
        seconds_per_tick: number,
        plant: Plant
    ) {

        //If custom data object was passed, save that
        // if(data) {
        //     this.storage.set('data', data)
        //     return;
        // }
        //Otherwise get current plants and save them
        this.updateCachedData(seconds_per_tick, plant)
        this.setData(this.data)
    }

    updateCachedData(
        seconds_per_tick: number,
        plant: Plant
    ) {
        this.data.pace = 1 / seconds_per_tick;
        this.data.plant = plant.toJSON();
        this.data.leave_time = new Date().getTime();
    }

    setCachedData(data: SaveData) {
        this.data = data;
    }

    async setDataToDefaults() {
        const basic_plant = await Plant.fromTemplate(0, 'basic_plant', this.cache);
        
        const data: SaveData = {
            pace: 1,
            max_id: 1,
            leave_time: null,
            unlocked_plants: ["basic_plant"],
            plant: basic_plant.toJSON()
        }

        this.setData(data);

        main_events.after_data_reset.emit();
    }
    
    setData(data: SaveData) {
        this.setCachedData(data);
        this.storage.set('data', data)
    }

    async resetData() {
        await this.setDataToDefaults();
    }

    getData() {
        if(!this.storage.has('data')) {
            throw new Error('Could not retrieve save data: no data is set')
        }
        return this.storage.get('data');
    }

    async setDataIfNull() {
        if(!this.storage.has('data')) {
            await this.setDataToDefaults();
        } else {
            this.data = this.getData();
        }
    }

    /**
     * Returns how long the user was away (not in-game or window not focused)
     * @returns 
     */
    getTimeAway() {
        let current_time_ms = new Date().getTime();
        let time_difference_ms = current_time_ms - this.data.leave_time
        return this.data.leave_time ? (time_difference_ms) / 1000 : null;
    }
}