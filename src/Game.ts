import constants from './const';
import MyCache from './MyCache';
import MyStorage from './MyStorage';
import Plant, { PlantData, PlantStage, PlantTemplate } from './Plant';
import BasicPlant from './plants/BasicPlant';
import Renderer from './Renderer';
import Vector from './Vector';

type PlantTemplates = {
    [plant_id: string]: PlantTemplate
}

type SaveData = {
    max_id: number
    plants: PlantData[]
    leave_time: number
}

type Plants = {
    [id: string]: Plant
}

export default class Game {

    renderer = new Renderer('canvas', 'ui');
    cache = new MyCache();
    storage = new MyStorage();

    seconds_per_tick = 1;

    last_frame_time = 0;
    delta = 0;
    delta_sum = 0;

    plant: Plant;

    button: HTMLDivElement = document.createElement('div');

    plant_templates: PlantTemplates = {}

    plant_template_ids: string[] = [
        "basic_plant"
    ]

    plants: Plants = {}

    data: SaveData;

    loading: boolean = true;

    water_button: HTMLDivElement;
    reset_button: HTMLDivElement;

    constructor() {

        this.button.classList.add('button')
        this.init_ui();
    }

    init_ui() {
        this.water_button = this.button.cloneNode() as HTMLDivElement
        this.reset_button = this.button.cloneNode() as HTMLDivElement

        const reset_button = this.reset_button
        const water_button = this.water_button
        
        this.water_button.innerHTML = 'Water Plant'
        water_button.style.position = 'absolute'
        water_button.style.top = '140px'
        water_button.style.left = '50%';
        water_button.style.transform = 'translateX(-50%)'

        reset_button.innerHTML = 'Reset'
        reset_button.style.position = 'absolute'
        reset_button.style.top = '16px'
        reset_button.style.left = '16px'
        reset_button.style.border = '1px solid brown'
        

        water_button.addEventListener('click', () => {
            this.waterCurrentPlant()
        })

        reset_button.addEventListener('click', () => {
            this.resetData()
        })

        this.renderer.ui.appendChild(water_button);
        this.renderer.ui.appendChild(reset_button)

       
    }

    // loadResources() {
    //     this.plant_template_ids.forEach((template_id) => {

    //     })
    // }

    async initPlants() {

        let current_time_ms = new Date().getTime();

        if(!this.storage.has('data')) {
            await this.setDataToDefaults();
        } else {
            this.data = this.getData();
        }

        let difference_s = this.data.leave_time ? (current_time_ms - this.data.leave_time) / 1000 : null;

        this.plants = {};

        for(let i = 0; i < this.data.plants.length; i++) {
            const plant = await Plant.fromJSON(this.data.plants[i], this.cache)
            if(difference_s) {
                const ticks = this.getTicksBySeconds(difference_s)
                plant.fastForward(ticks)
            }

            this.createPlant(plant)
        }

        this.plant = Object.values(this.plants)[0] as Plant;
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
        this.data.plants = Object.values(this.plants).map((plant) => plant.toJSON())
        this.data.leave_time = new Date().getTime();
        this.storage.set('data', this.data);
    }

    async setDataToDefaults() {
        const basic_plant = await Plant.fromTemplate(0, 'basic_plant', this.cache);

        
        this.data = {
            max_id: 1,
            leave_time: null,
            plants: [
                basic_plant.toJSON()
            ]
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

    async init() {
        this.loading = true;

        window.addEventListener('resize', () => {
            this.calculatePositions()
        })

        await this.initPlants();
        this.calculatePositions();
        this.loading = false;
    }

    start() {
        window.requestAnimationFrame(this.gameLoop.bind(this));
    }

    tick() {
        this.saveData();
        this.plant.tick();
    }

    draw() {
        this.renderer.clear();
        if(!this.loading) {
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

        if(this.delta_sum > this.seconds_per_tick && !this.loading) {
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

}