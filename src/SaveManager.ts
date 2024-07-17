import main_events from './main_events';
import MyCache from './MyCache';
import MyStorage from './MyStorage';
import Plant from './Plant';
import { SaveData } from './types/SaveData';

type DataSaveRequest = {
    seconds_per_tick?: number,
    plant?: Plant,
    new_game?: boolean,
    unlocked_plants?: string[],
    grown_plants?: string[]
}

export default class SaveManager {

    storage: MyStorage
    cache: MyCache

    constructor(storage: MyStorage, cache: MyCache) {
        this.storage = storage;
        this.cache = cache;
    }

    data: SaveData

    saveData(data: DataSaveRequest){

        //If custom data object was passed, save that
        // if(data) {
        //     this.storage.set('data', data)
        //     return;
        // }
        //Otherwise get current plants and save them
        this.updateCachedData(data);
        this.setData(this.data)
    }

    updateCachedData(data: DataSaveRequest){
        if (data.seconds_per_tick != undefined) {
            this.data.pace = 1 / data.seconds_per_tick;
        }
        if (data.plant != undefined) {
            this.data.plant = data.plant.toJSON();
        }
        if(data.new_game !== undefined) {
            this.data.new_game = data.new_game;
        }
        if(data.unlocked_plants !== undefined) {
            this.data.unlocked_plants = data.unlocked_plants;
        }
        if(data.grown_plants !== undefined) {
            this.data.grown_plants = data.grown_plants;
        }
        this.data.leave_time = new Date().getTime();
        
        
    }

    setCachedData(data: SaveData) {
        this.data = data;
    }

    async getDefaultData(): Promise<SaveData> {
        const basic_plant = await Plant.fromTemplate(0, 'basic_plant', this.cache);

        return {
            pace: 1,
            max_id: 1,
            leave_time: null,
            unlocked_plants: ["basic_plant"],
            grown_plants: [],
            plant: basic_plant.toJSON(),
            new_game: true,
        }
    }

    async setDataToDefaults() {
        
        const data = await this.getDefaultData();

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
            const default_data = await this.getDefaultData();
            this.data = { ...default_data, ...this.getData()};
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