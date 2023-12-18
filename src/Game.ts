import constants from './const';
import ImageLoader from './ImageLoader';
import MyCache from './MyCache';
import MyStorage from './MyStorage';
import Plant, { PlantStage } from './Plant';
import { PlantTemplate, PlantTemplates } from './types/PlantTemplate';
import BasicPlant from './plants/BasicPlant';
import Renderer from './Renderer';
import UIManager from './UIManager';
import { getViewportCenter, secondsToTime } from './util';
import Vector from './Vector';
import { SaveData } from './types/SaveData'
import SaveManager from './SaveManager';
import main_events from './main_events';
import globals from './globals';

type Plants = {
    [id: string]: Plant
}

type ViewID = 'plant'

export default class Game {

    renderer = new Renderer('canvas', 'ui', 'menus');
    cache = new MyCache();
    storage = new MyStorage();

    data = new SaveManager(this.storage, this.cache);
    ui = new UIManager(this.renderer)

    image_loader = new ImageLoader(this.cache);
    

    first_init: boolean = false; //Whether this the game has been initialized at least once

    last_frame_time = 0;
    delta = 0;
    delta_sum = 0;

    plant: Plant;

    plant_templates: PlantTemplates = {}

    plants: Plants = {}

    

    loading: boolean = true;

    current_view: ViewID | null = null;

    constructor() {
        main_events.on_request_data_reset.on(this.onRequestDataReset.bind(this));
        main_events.on_request_data_save.on(this.onRequestDataSave.bind(this));
        main_events.on_request_show_menu.on(this.onRequestShowMenu.bind(this));
        main_events.on_request_set_view.on(this.onRequestSetView.bind(this));
        main_events.on_request_fast_forward.on(this.onRequestFastForward.bind(this));
        main_events.on_request_plant_new_plant.on(this.onRequestPlantNewPlant.bind(this));
        main_events.on_request_water_plant.on(this.onRequestWaterPlant.bind(this));

        window.addEventListener('focus', () => {
            if(this.current_view == 'plant') {
                this.fastForwardBySeconds(this.data.getTimeAway())
            }
        })
    }

    async onRequestDataReset() {
        const confirm_reset = confirm('Are you sure you want to reset all data? Plant data and collection will be lost')
        if(!confirm_reset) return;
        await this.data.resetData();
        await this.init()
    }
    
    onRequestDataSave() {
        this.data.saveData(
            globals.seconds_per_tick,
            this.plant
        )
    }

    onRequestShowMenu(menu_id: string) {
        this.setView(null);
        this.renderer.showMenu(menu_id)
    }

    onRequestSetView(view_id: ViewID) {
        this.setView(view_id)
    }

    onRequestFastForward() {
        this.fastForwardBySeconds(this.data.getTimeAway())
    }

    onRequestWaterPlant() {
        this.waterCurrentPlant();
    }

    onRequestPlantNewPlant(template_id: string) {
        this.plantNewPlant(template_id)
    }

    async init() {
        this.setLoading(true)
        await this.data.setDataIfNull();
        await this.initTemplates();
        await this.initImages();
        this.initTemplateImageURLs();
        globals.seconds_per_tick = 1 / this.data.data.pace
        window.addEventListener('resize', () => {
            this.calculatePositions()
        })
        if(!this.first_init) {
            await this.ui.initUi(this.plant_templates, this.data.data.unlocked_plants);
            this.first_init = true;
        }
        
        await this.initPlants();
        this.calculatePositions();

        
        this.setLoading(false)
        this.renderer.showMenu('main')
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
        const plant = await Plant.fromJSON(this.data.data.plant, this.cache)
        this.setPlant(plant);
    }

    async initTemplates() {
        for(const template_id of constants.plant_template_ids) {
            const res = await fetch('plant_templates/' + template_id + '.json')
            const json = await res.json()
            this.plant_templates[template_id] = json;
        }
    }

    initTemplateImageURLs() {
        for(const template_id in this.plant_templates) {
            const template = this.plant_templates[template_id]
            for(const i in template.stages) {
                const image = this.cache.get('image_blobs/' + template.plant_id + '/' + i)
                template.stages[i].image_url = URL.createObjectURL(image);
            }
        }
    }

    onPlantFullyGrown(plant: Plant) {
        this.ui.displayProgressMessage(this.plant, this.plant_templates, false);
        this.data.data.unlocked_plants.push(plant.unlocks);
        this.data.saveData(
            globals.seconds_per_tick,
            this.plant
        );

        if(plant.unlocks) {
            const unlocked_template = this.plant_templates[plant.unlocks];
            this.ui.updateCollectionImage(unlocked_template, true)
        }
        
    }

    fastForwardBySeconds(seconds: number) {
        if(!seconds) {
            return;
        }
        const growth_before = this.plant.growth;

        const ticks = this.getTicksBySeconds(seconds)
        this.plant.fastForward(ticks)

        const growth_after = this.plant.growth;
        
        this.ui.displayProgressMessage(this.plant, this.plant_templates, true, growth_before, growth_after, seconds)
        
    }

    getTicksBySeconds(seconds: number) {
        return seconds / globals.seconds_per_tick
    }

    setView(view_name: ViewID | null) {
        this.current_view = view_name
        if(view_name) {
            this.renderer.hideMenu();
        }
        
    }

    calculatePositions() {
        this.plant.setPosition(getViewportCenter())
        this.ui.calculatePositions(this.plant);
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
        this.data.saveData(
            globals.seconds_per_tick,
            this.plant
        );
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

        if(this.delta_sum > globals.seconds_per_tick && !this.loading && this.current_view == 'plant') {
            this.tick();
            this.delta_sum = 0;
        }
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