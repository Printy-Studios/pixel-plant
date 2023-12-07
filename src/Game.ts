import constants from './const';
import MyCache from './MyCache';
import MyStorage from './MyStorage';
import Plant from './Plant';
import { SaveData } from './types/SaveData';
import PlantTemplate, { PlantTemplates} from './PlantTemplate';
import BasicPlant from './plants/BasicPlant';
import Renderer from './Renderer';
import UIManager from './UIManager';
import { secondsToTime } from './util';
import Vector from './Vector';





type Plants = {
    [id: string]: Plant
}



export default class Game {

    renderer = new Renderer('canvas', 'ui', 'menus');
    cache = new MyCache();
    storage = new MyStorage();
    ui = new UIManager(this.renderer);
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

    recently_unlocked: string;

    constructor() {
        // this.button.classList.add('button')
    }

    

    // loadResources() {
    //     this.plant_template_ids.forEach((template_id) => {

    //     })
    // }

    async init() {
        this.setLoading(true)
        if(!this.storage.has('data')) {
            await this.setDataToDefaults();
        } else {
            this.data = this.getData();
        }
        await this.initTemplates();
        await this.initImages();
        this.seconds_per_tick = 1 / this.data.pace
        window.addEventListener('resize', () => {
            this.calculatePositions()
        })
        if(!this.first_init) {
            await this.ui.init(this.plant_templates, this.cache);
            console.log('initializing ui')
            this.first_init = true;
        }
        
        await this.initPlants();
        this.calculatePositions();

        
        this.setLoading(false)
        this.renderer.showMenu('main')
        //console.log(this.renderer.menu)
    }

    async initImages() {
        for(const template_id in this.plant_templates) {
            const template = this.plant_templates[template_id]
            for(let i = 0; i < template.stages.length; i++) {
                const res_id = 'images/' + template.plant_id + '/' + i;
                if(!this.cache.has(res_id)) {
                    try {
                        const img_url = './images/' + template.plant_id + '/' + template.plant_id + '_' + i + '.png'
                        console.log(img_url)
                        const img_res = await fetch(img_url);
                        const img_data = await img_res.blob();
                        const image = await createImageBitmap(img_data);
                        
    
                        const blob_id = 'image_blobs/' + template.plant_id + '/' + i;
                        this.cache.set(res_id, image);
                        this.cache.set(blob_id, img_data);
                    } catch(e) {
                        throw new Error('Could not load image: ' + e.message)
                    }
                }
            }
        }
        
    }

    initUI() {
        
    }

    async initPlants() {

        //let difference_s = this.getTimeAway()

        // this.plants = {};

        // for(let i = 0; i < this.data.plants.length; i++) {
        //     const plant = await Plant.fromJSON(this.data.plants[i], this.cache)
        //     this.createPlant(plant)
        // }
        const plant = await Plant.fromJSON(this.data.plant, this.cache)
        this.createPlant(plant);
        //this.fastForwardBySeconds(difference_s)

        this.setPlant(Object.values(this.plants)[0] as Plant);
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
        let message = this.progressMessageText({ h: 0, m: 0}, true)

        let show_plant_button = false;
        const unlock = this.getTemplateUnlock(this.plant.plant_id);

        if (unlock) {
            message += '<br><b>You have unlocked a new plant - ' + unlock.name + '. Would you like to plant it?';
            this.recently_unlocked = unlock.plant_id;
            show_plant_button = true;
        }

        if(this.ui.progress_message.style.display != 'none') {
            this.ui.displayProgressMessage(message, show_plant_button)
        }
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

        const growth_after =  this.plant.growth;
        

        const time = secondsToTime(seconds);
        console.log(time)
        if(time.m > 0) {
            const growth_difference = growth_after - growth_before;
            let growth_percent: number | boolean = growth_difference / this.plant.maxGrowth() * 100

            if(this.plant.isFullyGrown()) {
                growth_percent = true;
            }

            
            let message = this.progressMessageText(time, growth_percent)

            let show_plant_button = false;
            const unlock = this.getTemplateUnlock(this.plant.plant_id);

            if (this.plant.isFullyGrown() && unlock) {
                message += '<br><b>You have unlocked a new plant - ' + unlock.name + '. Would you like to plant it?';
                show_plant_button = true;
            }

            this.ui.displayProgressMessage(message, show_plant_button);
        }
        
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
        this.data.pace = 1 / this.seconds_per_tick;
        this.data.plant = this.plant.toJSON();
        this.data.leave_time = new Date().getTime();
        this.storage.set('data', this.data);
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

    

    calculatePositions() {
        this.plant.setPosition(new Vector(
            window.innerWidth / 2 / constants.scale,
            window.innerHeight / 2 / constants.scale
        ))

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
        if(!this.loading && !this.renderer.menu && this.ui.current_view == 'plant') {
            this.renderer.drawPlant(this.plant);
        }
    }

    waterCurrentPlant() {
        this.plant.water_level.top();
        this.plant.updateWaterLevelBar()
    }

    gameLoop() {
        const current_time = new Date().getTime();
        this.delta = (current_time - this.last_frame_time) / 1000;
        this.last_frame_time = new Date().getTime();
        this.delta_sum += this.delta;

        if(this.delta_sum > this.seconds_per_tick && !this.loading && this.ui.current_view == 'plant') {
            this.tick();
            this.delta_sum = 0;
        }
        //console.log(this.plant.water_level.current)
        this.draw();

        window.requestAnimationFrame(this.gameLoop.bind(this))
    }

    createPlant(plant: Plant) {
        this.plants[plant.id] = plant;
    }

    

    async plantNewPlant(template_id: string) {
        console.log('planting')
        const plant = await Plant.fromTemplate('my_plant', template_id, this.cache);
        this.setPlant(plant);
        this.ui.setView('plant');
    }

    setPlant(plant: Plant) {
        this.plant = plant;
        this.plant.onFullyGrown(this.onPlantFullyGrown.bind(this));
    }

}