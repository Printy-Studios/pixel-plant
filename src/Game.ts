import constants from './const';
import ImageLoader from './ImageLoader';
import MyCache from './MyCache';
import MyStorage from './MyStorage';
import Plant, { PlantData, PlantStage, PlantTemplate } from './Plant';
import BasicPlant from './plants/BasicPlant';
import Renderer from './Renderer';
import UIInitializer from './UIInitializer';
import { getPlantImageBloblID, getPlantImageID, getTemplateMaxStageIndex, getViewportCenter, secondsToTime } from './util';
import Vector from './Vector';

type PlantTemplates = {
    [plant_id: string]: PlantTemplate
}

type SaveData = {
    pace: number,
    max_id: number,
    unlocked_plants: string[],
    plant: PlantData,
    leave_time: number
}

type Plants = {
    [id: string]: Plant
}

type ViewID = 'plant'

export default class Game {

    renderer = new Renderer('canvas', 'ui', 'menus');
    cache = new MyCache();
    storage = new MyStorage();

    image_loader = new ImageLoader(this.cache);

    first_init: boolean = false; //Whether this the game has been initialized at least once

    seconds_per_tick: number;

    last_frame_time = 0;
    delta = 0;
    delta_sum = 0;

    plant: Plant;

    plant_templates: PlantTemplates = {}

    plant_template_ids: string[] = [
        "basic_plant",
        "yellow_dip"
    ]

    plants: Plants = {}

    data: SaveData;

    loading: boolean = true;

    water_button: HTMLDivElement;
    reset_button: HTMLDivElement;

    main_menu: HTMLDivElement
    options_menu: HTMLDivElement

    plant_buttons: HTMLButtonElement[] = []

    progress_message: HTMLDivElement;
    progress_message_container: HTMLDivElement;
    progress_message_plant: HTMLDivElement;

    current_view: ViewID | null = null;

    plant_image: HTMLImageElement = document.createElement('img');
    plant_name: HTMLHeadingElement = document.createElement('h2');
    plant_description: HTMLParagraphElement = document.createElement('p');
    current_plant_in_menu: PlantTemplate;

    recently_unlocked: string;

    constructor() {

    }

    

    async setDataIfNull() {
        if(!this.storage.has('data')) {
            await this.setDataToDefaults();
        } else {
            this.data = this.getData();
        }
    }

    async init() {
        this.setLoading(true)
        await this.setDataIfNull();
        await this.initTemplates();
        await this.initImages();
        this.seconds_per_tick = 1 / this.data.pace
        window.addEventListener('resize', () => {
            console.log('ddd')
            this.calculatePositions()
        })
        if(!this.first_init) {
            const ui_init = new UIInitializer(this);
            await ui_init.initUi();
            console.log('initializing ui')
            this.first_init = true;
        }
        
        await this.initPlants();
        console.log('fff')
        this.calculatePositions();

        
        this.setLoading(false)
        this.renderer.showMenu('main')
        //console.log(this.renderer.menu)
    }

    async initImages() {
        for(const template_id in this.plant_templates) {
            const template = this.plant_templates[template_id]
            for(let i = 0; i < template.stages.length; i++) {
                await this.image_loader.loadTemplateImageIfNull(template.plant_id, i);
            }
        }
        
    }

    async initPlants() {
        const plant = await Plant.fromJSON(this.data.plant, this.cache)
        this.setPlant(plant);
    }

    async initTemplates() {
        for(const template_id of this.plant_template_ids) {
            const res = await fetch('plant_templates/' + template_id + '.json')
            const json = await res.json()
            this.plant_templates[template_id] = json;
        }
    }

    onPlantFullyGrown(plant: Plant) {
        console.log('plant fully grown')
        this.displayProgressMessage(false);
        this.data.unlocked_plants.push(plant.unlocks);
        this.saveData();
    }

    fastForwardBySeconds(seconds: number) {
        if(!seconds) {
            return;
        }
        const growth_before = this.plant.growth;

        const ticks = this.getTicksBySeconds(seconds)
        for(const plant_key in this.plants) {
            this.plants[plant_key].fastForward(ticks)
        }

        const growth_after = this.plant.growth;
        
        this.displayProgressMessage(true, growth_before, growth_after, seconds)
        
    }

    displayProgressMessage(ff = true, growth_before: number = null, growth_after: number = null, seconds_elapsed: number = null) {

        let show_plant_button = false;

        let message = "";

        const time = secondsToTime(seconds_elapsed);
        let has_time = time.m > 0;
        if(has_time && ff) {
            const growth_difference = growth_after - growth_before;
            let growth_percent: number | boolean = growth_difference / this.plant.maxGrowth() * 100

            if(this.plant.isFullyGrown()) {
                growth_percent = true;
            }
            
            message = this.progressMessageText(time, growth_percent)
            
        } else if(!ff) {
            message = this.progressMessageText({ h: 0, m: 0}, true)
        }

        const unlock = this.getTemplateUnlock(this.plant.plant_id);

        if (this.plant.isFullyGrown() && unlock) {
            message += '<br><b>You have unlocked a new plant - ' + unlock.name + '. Would you like to plant it?';
            this.recently_unlocked = unlock.plant_id;
            show_plant_button = true;
        }

        if(show_plant_button) {
            this.progress_message_plant.style.display = 'flex';
        } else {
            this.progress_message_plant.style.display = 'none';
        }
        this.progress_message.innerHTML = message;
        this.progress_message_container.style.display = 'flex'
        this.progress_message_container.focus()
    }

    /**
     * If you want to indicate that the plant has fully grown, pass 'true' for `growth_percentage`
     */
    progressMessageText(time: {h: number, m: number}, growth_percentage: number | boolean) {
        const away_str = time.h > 0 && time.m > 0 ? 'You were away for' : '';
        const hrs_str = time.h == 1 ? '1 hour' : time.h > 0 ? time.h + ' hours' : ''
        const mins_str =  time.m == 1 ? '1 minute' : time.m > 0 ? time.m + ' minutes' : ''
        const and_str = time.h > 0 && time.m > 0 ? 'and' : ''

        const growth_str = typeof growth_percentage === 'boolean' ? 'fully grown' : 'grown by ' + growth_percentage + ' %'
        return `${away_str} ${hrs_str} ${and_str} ${mins_str} ${and_str} your plant has ${growth_str}`
    }

    getTicksBySeconds(seconds: number) {
        return seconds / this.seconds_per_tick
    }

    saveData(data: SaveData = null) {

        //If custom data object was passed, save that
        if(data) {
            this.storage.set('data', data)
            return;
        }
        //Otherwise get current plants and save them
        this.updateCachedData()
        this.storage.set('data', this.data);
    }

    updateCachedData() {
        this.data.pace = 1 / this.seconds_per_tick;
        this.data.plant = this.plant.toJSON();
        this.data.leave_time = new Date().getTime();
    }

    setView(view_name: ViewID | null) {
        this.current_view = view_name
        if(view_name) {
            this.renderer.hideMenu();
        }
        
    }

    getTemplateUnlock(template_id: string) {
        const unlock_id = this.plant_templates[template_id].unlocks;
        return this.plant_templates[unlock_id]
    }

    async setDataToDefaults() {
        const basic_plant = await Plant.fromTemplate(0, 'basic_plant', this.cache);
        
        this.data = {
            pace: 1,
            max_id: 1,
            leave_time: null,
            unlocked_plants: ["basic_plant"],
            plant: basic_plant.toJSON()
        }

        this.saveData(this.data);
    }

    async resetData() {
        await this.setDataToDefaults();
        await this.init();
    }

    getData() {
        if(!this.storage.has('data')) {
            throw new Error('Could not retrieve save data: no data is set')
        }
        return this.storage.get('data');
    }

    getTimeAway() {
        let current_time_ms = new Date().getTime();
        let time_difference_ms = current_time_ms - this.data.leave_time
        return this.data.leave_time ? (time_difference_ms) / 1000 : null;
    }

    

    calculatePositions() {

        this.plant.setPosition(getViewportCenter())
        console.log('waterbtn')
        console.log(this.water_button)
        this.water_button.style.top = this.plant.position.y * constants.scale + 160 + 'px'
    }

    getPlantTemplateFullyGrownImageURL(plant_template: PlantTemplate) {
        const max_stage = plant_template.stages.length - 1;
        const image = this.cache.get('image_blobs/' + plant_template.plant_id + '/' + max_stage)
        return URL.createObjectURL(image);
    }

    setLoading(loading: boolean) {
        this.loading = loading;
        if (this.loading) {
            this.renderer.ui.style.display = 'none'
            if(this.renderer.menu) {
                this.renderer.currentMenu().style.display = 'none'
            }
        } else {
            if(this.renderer.menu) {
                this.renderer.currentMenu().style.display = 'block'
            } else {
                this.renderer.ui.style.display = 'block'
            }
            
        }
    }

    start() {
        window.requestAnimationFrame(this.gameLoop.bind(this));
    }

    tick() {
        this.saveData();
        console.log(this.plant)
        this.plant.tick();
    }

    draw() {
        this.renderer.clear();
        if(!this.loading && !this.renderer.menu && this.current_view == 'plant') {
            this.renderer.drawPlant(this.plant);
        }
    }

    waterCurrentPlant() {
        this.plant.water_level.top();
        this.plant.updateWaterLevelBar()
    }

    gameLoop() {
        this.calculateDeltaSum();

        if(this.delta_sum > this.seconds_per_tick && !this.loading && this.current_view == 'plant') {
            this.tick();
            this.delta_sum = 0;
        }
        //console.log(this.plant.water_level.current)
        this.draw();

        window.requestAnimationFrame(this.gameLoop.bind(this))
    }

    calculateDeltaSum() {
        const current_time = new Date().getTime();
        this.delta = (current_time - this.last_frame_time) / 1000;
        this.last_frame_time = new Date().getTime();
        this.delta_sum += this.delta;
    }

    // createPlant(plant: Plant) {
    //     this.plants[plant.id] = plant;
    // }

    showPlantMenu(plant_template: PlantTemplate) {
        this.plant_image.src = this.getPlantTemplateFullyGrownImageURL(plant_template);
        this.plant_name.innerHTML = plant_template.name;
        this.plant_description.innerHTML = plant_template.description;
        this.current_plant_in_menu = plant_template;
        this.renderer.showMenu('plant');
    }

    async plantNewPlant(template_id: string) {
        const plant = await Plant.fromTemplate('my_plant', template_id, this.cache);
        this.setPlant(plant);
        this.setView('plant');
    }

    setPlant(plant: Plant) {
        this.plant = plant;
        this.plant.onFullyGrown(this.onPlantFullyGrown.bind(this));
    }

}