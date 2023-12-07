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
import globals from './globals';
import PlantManager from './PlantManager';
import SaveManager from './SaveManager';





type Plants = {
    [id: string]: Plant
}



export default class Game {

    renderer = new Renderer('canvas', 'ui', 'menus');
    cache = new MyCache();
    storage = new MyStorage();

    ui: UIManager
    plants: PlantManager
    data: SaveManager
    

    first_init: boolean = false; //Whether this the game has been initialized at least once

    seconds_per_tick: number;

    last_frame_time = 0;
    delta = 0;
    delta_sum = 0;

    

    

    

    //plants: Plants = {}

    //data: SaveData;

    loading: boolean = true;

    water_button: HTMLDivElement;
    reset_button: HTMLDivElement;

    main_menu: HTMLDivElement
    options_menu: HTMLDivElement

    plant_buttons: HTMLButtonElement[] = []    

    recently_unlocked: string;

    constructor() {
        this.ui = new UIManager(this.renderer, this.data, this.plants);
        this.plants = new PlantManager(this.ui);
        this.data = new SaveManager(this.cache, this.storage, this.plants);
        // this.button.classList.add('button')
    }

    

    // loadResources() {
    //     this.plant_template_ids.forEach((template_id) => {

    //     })
    // }

    async init() {
        this.setLoading(true)
        if(!this.storage.has('data')) {
            await this.data.setDataToDefaults();
        } else {
            this.data = this.getData();
        }
        await this.initTemplates();
        await this.initImages();
        this.seconds_per_tick = 1 / globals.data.pace
        window.addEventListener('resize', () => {
            this.calculatePositions()
        })
        if(!this.first_init) {
            await this.ui.init(this.plants.plant_templates, this.cache);
            console.log('initializing ui')
            this.first_init = true;
        }
        
        await this.plants.init(this.cache);
        this.plants.on_plant = this.onPlantPlanted;
        this.plants.on_plant_grown = this.onPlantFullyGrown;
        this.calculatePositions();

        
        this.setLoading(false)
        this.renderer.showMenu('main')
        //console.log(this.renderer.menu)
    }

    async initImages() {
        for(const template_id in this.plants.plant_templates) {
            const template = this.plants.plant_templates[template_id]
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
        this.ui.on_play = () => {
            this.ui.setView('plant')
            const time_away = this.getTimeAway() 
            this.plants.fastForwardBySeconds(time_away)
        }
    }

    

    async initTemplates() {
        for(const template_id of this.plants.plant_template_ids) {
            const res = await fetch('plant_templates/' + template_id + '.json')
            const json = await res.json()
            this.plants.plant_templates[template_id] = json;
        }
    }

    onPlantPlanted() {
        this.ui.setView('plant');
    }

    onPlantFullyGrown(plant: Plant) {
        console.log('plant fully grown')
        let message = this.ui.progressMessageText({ h: 0, m: 0}, true)

        let show_plant_button = false;
        const unlock = this.plants.getTemplateUnlock(this.plants.plant.plant_id);

        if (unlock) {
            message += '<br><b>You have unlocked a new plant - ' + unlock.name + '. Would you like to plant it?';
            this.recently_unlocked = unlock.plant_id;
            show_plant_button = true;
        }

        if(this.ui.progress_message.style.display != 'none') {
            this.ui.displayProgressMessage(message, show_plant_button)
        }
        globals.data.unlocked_plants.push(plant.unlocks);
        this.data.saveData();
    }

     

    

    

    async resetData() {
        await this.data.setDataToDefaults();
        await this.init();
    }

    getTimeAway() {
        let current_time_ms = new Date().getTime();
        return globals.data.leave_time ? (current_time_ms - globals.data.leave_time) / 1000 : null;
    }

    getData() {
        if(!this.storage.has('data')) {
            throw new Error('Could not retrieve save data: no data is set')
        }
        return this.storage.get('data');
    }

    

    calculatePositions() {
        this.plants.get().setPosition(new Vector(
            window.innerWidth / 2 / constants.scale,
            window.innerHeight / 2 / constants.scale
        ))

        this.water_button.style.top = this.plants.get().position.y * constants.scale + 160 + 'px'
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
        this.data.saveData();
        console.log(this.plants.get())
        this.plants.get().tick();
    }

    draw() {
        this.renderer.clear();
        if(!this.loading && !this.renderer.menu && this.ui.current_view == 'plant') {
            this.renderer.drawPlant(this.plants.get());
        }
    }

    waterCurrentPlant() {
        this.plants.get().water_level.top();
        this.plants.get().updateWaterLevelBar()
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

    

    

    

}