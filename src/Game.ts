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

type Plants = {
    [id: string]: Plant
}

type ViewID = 'plant'

export default class Game {

    renderer = new Renderer('canvas', 'ui', 'menus');
    cache = new MyCache();
    storage = new MyStorage();

    data = new SaveManager(this.storage, this.cache);
    ui = new UIManager(this, this.data, this.cache, this.renderer, this.onDataResetPress, this.onDataSave)

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

    

    loading: boolean = true;

    current_view: ViewID | null = null;

    recently_unlocked: string;

    constructor() {

    }

    async onDataResetPress() {
        await this.data.resetData();
        await this.init()
    }
    
    onDataSave() {
        this.data.saveData(
            this.seconds_per_tick,
            this.plant
        )
    }

    async init() {
        this.setLoading(true)
        await this.data.setDataIfNull();
        await this.initTemplates();
        await this.initImages();
        this.seconds_per_tick = 1 / this.data.data.pace
        window.addEventListener('resize', () => {
            console.log('ddd')
            this.calculatePositions()
        })
        if(!this.first_init) {
            await this.ui.initUi(this.data.data.unlocked_plants);
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
        console.log('abc');
        const plant = await Plant.fromJSON(this.data.data.plant, this.cache)
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
        this.ui.displayProgressMessage(this.plant, this.plant_templates, this.recently_unlocked, false);
        this.data.data.unlocked_plants.push(plant.unlocks);
        this.data.saveData(
            this.seconds_per_tick,
            this.plant
        );
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
        
        this.ui.displayProgressMessage(this.plant, this.plant_templates, this.recently_unlocked, true, growth_before, growth_after, seconds)
        
    }

    getTicksBySeconds(seconds: number) {
        return seconds / this.seconds_per_tick
    }

    

    setView(view_name: ViewID | null) {
        this.current_view = view_name
        if(view_name) {
            this.renderer.hideMenu();
        }
        
    }

    

    getTimeAway() {
        let current_time_ms = new Date().getTime();
        let time_difference_ms = current_time_ms - this.data.data.leave_time
        return this.data.data.leave_time ? (time_difference_ms) / 1000 : null;
    }

    

    calculatePositions() {

        this.plant.setPosition(getViewportCenter())
        console.log('waterbtn')
        console.log(this.ui.water_button)
        this.ui.water_button.style.top = this.plant.position.y * constants.scale + 160 + 'px'
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
            this.seconds_per_tick,
            this.plant
        );
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