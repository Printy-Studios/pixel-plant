import constants from './const';
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
    first_init: boolean = false; //Whether this the game has been initialized at least once

    seconds_per_tick: number;

    last_frame_time = 0;
    delta = 0;
    delta_sum = 0;

    plant: Plant;

    button: HTMLButtonElement = document.createElement('button');
    menu: HTMLDivElement = document.createElement('div');

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
        this.button.classList.add('button')
        this.menu.classList.add('menu');

    }

    createButton(class_name: string = null) {
        const btn = this.button.cloneNode() as HTMLDivElement
        btn.classList.add(class_name)
        return btn;
    }

    createMenu(class_name: string = null) {
        const menu = this.menu.cloneNode() as HTMLDivElement;
        menu.classList.add(class_name)
        return menu;
    }

    // initGameUI() {
    //     // Game UI
        
    //     const water_button = this.createButton('water-button');
        
    //     this.water_button.innerHTML = 'Water Plant'
    //     water_button.style.position = 'absolute'
    //     water_button.style.top = '140px'
    //     water_button.style.left = '50%';
    //     water_button.style.transform = 'translateX(-50%)'
    //     water_button.tabIndex = 4;

    //     //Back button
    //     const back_button = this.createButton('button');
    //     back_button.innerHTML = 'Back'
    //     back_button.style.position = 'absolute'
    //     back_button.style.top = '16px'
    //     back_button.style.left = '16px'
    //     back_button.tabIndex = 2
        
    //     //Progress message
    //     const progress_message_container = document.createElement('div')
    //     this.progress_message_container = progress_message_container
    //     progress_message_container.classList.add('progress-message')
    //     progress_message_container.tabIndex = 0;

    //     this.progress_message = document.createElement('p')
    //     const progress_message = this.progress_message;
    //     progress_message.innerHTML = 'You were away for n hours n minutes and your plant has grown by x %'

    //     this.progress_message_plant = this.createButton('menu-button')
    //     this.progress_message_plant.classList.add('small-button')
    //     this.progress_message_plant.innerHTML = 'Plant'

    //     progress_message_container.appendChild(progress_message);
    //     progress_message_container.appendChild(this.progress_message_plant)

    //     this.progress_message_plant.addEventListener('click', () => {
    //         this.plantNewPlant(this.recently_unlocked)
    //     })

    //     progress_message_container.addEventListener('focusout', () => {
    //         progress_message_container.style.display = 'none'
    //     })

    //     water_button.addEventListener('click', () => {
    //         this.waterCurrentPlant()
    //     })

    //     this.reset_button.addEventListener('click', () => {
    //         const confirm_reset = confirm('Are you sure you want to reset the game? All data will be lost')
    //         if(confirm_reset) {
    //             this.resetData()
    //         }
            
    //     })

    //     back_button.addEventListener('click', () => {
    //         this.renderer.showMenu('main')
    //         this.setView(null)
    //     })

    //     this.renderer.ui.appendChild(water_button);
    //     this.renderer.ui.appendChild(back_button);
    //     this.renderer.ui.appendChild(progress_message_container)
    // }

    // initMainMenu() {
    //     //Main menu

    //     //Play button
    //     const play_button = this.createButton('menu-button')
    //     play_button.innerHTML = 'My Plant'

    //     //Collection button
    //     const collection_button = this.createButton('menu-button')
    //     collection_button.innerHTML = 'Collection'

    //     //Options button
    //     const options_button = this.createButton('menu-button')
    //     options_button.innerHTML = 'Options'

    //     this.main_menu = this.createMenu();

    //     this.main_menu.appendChild(play_button)
    //     this.main_menu.appendChild(collection_button)
    //     this.main_menu.appendChild(options_button)

    //     // Event handlers

    //     //Main menu
    //     play_button.addEventListener('click', () => {
    //         this.setView('plant')
    //         this.fastForwardBySeconds(this.getTimeAway())
    //     })

    //     options_button.addEventListener('click', () => {
    //         this.renderer.showMenu('options')
    //     })

    //     collection_button.addEventListener('click', () => {
    //         this.renderer.showMenu('collection')
    //     })

    //     this.renderer.addMenu(this.main_menu, 'main')
    // }

    // initOptionsMenu() {
    //     //Options menu

    //     const options_menu = this.createMenu();

    //     const options_back = this.createButton('menu-button')
    //     options_back.innerHTML = 'Back'

    //     const reset_button = this.createButton('menu-button')
    //     reset_button.innerHTML = 'Reset Game'

    //     const pace_selector = document.createElement('div')
    //     const pace_selector_label = document.createElement('p')
    //     const pace_selector_dropdown = document.createElement('select')

    //     pace_selector.classList.add('pace-selector')

    //     pace_selector_label.innerHTML = 'Pace: '

    //     const paces = {
    //         "4": 4,
    //         "2": 2,
    //         "1": 1,
    //         "0.5": 0.5,
    //         "0.25": 0.25
    //     }
    //     for (const pace_key in paces) {
    //         const option = document.createElement('option')
    //         option.value = pace_key
    //         option.innerHTML = pace_key
    //         let should_be_selected = parseFloat(pace_key) == 1 / this.seconds_per_tick
    //         if(should_be_selected) {
    //             option.selected = true;
    //         }
    //         pace_selector_dropdown.appendChild(option)
    //     }

        

    //     pace_selector.appendChild(pace_selector_label)
    //     pace_selector.appendChild(pace_selector_dropdown)

    //     options_menu.appendChild(pace_selector)
    //     options_menu.appendChild(options_back)
    //     options_menu.appendChild(reset_button)

    //     //Options menu

    //     pace_selector_dropdown.addEventListener('change', (e: any) => {
    //         this.seconds_per_tick = 1 / parseFloat(e.target.value);
    //         this.saveData()
    //     })

    //     options_back.addEventListener('click', () => {
    //         this.renderer.showMenu('main')
    //     })

    //     this.renderer.addMenu(options_menu, 'options')
    // }

    // initCollectionMenu() {
    //     // Collection menu

    //     const collection_menu = this.createMenu()

    //     const collection_back = this.createButton('menu-button')
    //     collection_back.innerHTML = 'Back'

    //     collection_menu.appendChild(collection_back)

    //     for(const template_id in this.plant_templates) {
    //         const plant_button = this.createButton('menu-button');
    //         plant_button.classList.add('plant-button')
    //         // const plant = await Plant.fromTemplate(template_id, template_id, this.cache)
    //         const plant_template = this.plant_templates[template_id]
    //         const max_stage = getTemplateMaxStageIndex(plant_template);

    //         const img_element = document.createElement('img')
    //         img_element.classList.add('collection-image')

    //         plant_button.appendChild(img_element)

    //         let is_plant_unlocked = this.data.unlocked_plants.includes(plant_template.plant_id)

    //         if(is_plant_unlocked) {
    //             const image = this.cache.get('image_blobs/' + plant_template.plant_id + '/' + max_stage)

    //             const image_url = URL.createObjectURL(image);

    //             img_element.src = image_url

    //             const text = document.createElement('p');
    //             text.innerHTML = plant_template.name

                
    //             plant_button.appendChild(text);

    //             plant_button.addEventListener('click', () => {
    //                 this.showPlantMenu(plant_template);
    //             });
    //         } else {
    //             img_element.src = 'images/question-mark.png'
    //         }
            
            

    //         collection_menu.appendChild(plant_button)

    //     }

    //     // Collection menu

    //     collection_back.addEventListener('click', () => {
    //         this.renderer.showMenu('main')
    //     })

    //     this.renderer.addMenu(collection_menu, 'collection')
    // }

    // initPlantEntryMenu() {
    //     //Plant Entry
    //     const plant_menu = this.createMenu()

    //     const plant_back = this.createButton('menu-button');
    //     plant_back.innerHTML = 'Back';

    //     this.plant_image.classList.add('collection-image');

    //     const plant_button = this.createButton('menu-button');
    //     plant_button.innerHTML = 'Plant';

    //     plant_menu.appendChild(plant_back);
    //     plant_menu.appendChild(this.plant_image);
    //     plant_menu.appendChild(this.plant_name);
    //     plant_menu.appendChild(this.plant_description);
    //     plant_menu.appendChild(plant_button);

    //     // Entry menu

    //     plant_back.addEventListener('click', () => {
    //         this.renderer.showMenu('main')
    //     })

    //     plant_button.addEventListener('click', () => {
    //         this.plantNewPlant(this.current_plant_in_menu.plant_id);
    //     })

    //     this.renderer.addMenu(plant_menu, 'plant');
    // }

    // async initUi() {
        
    //     this.initGameUI();
    //     this.initMainMenu();
    //     this.initOptionsMenu();
    //     this.initPlantEntryMenu();
    //     this.initCollectionMenu();

    // }

    // loadResources() {
    //     this.plant_template_ids.forEach((template_id) => {

    //     })
    // }

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
            this.calculatePositions()
        })
        if(!this.first_init) {
            await new UIInitializer(this).initUi();
            console.log('initializing ui')
            this.first_init = true;
        }
        
        await this.initPlants();
        this.calculatePositions();

        
        this.setLoading(false)
        this.renderer.showMenu('main')
        //console.log(this.renderer.menu)
    }

   

    async loadTemplateImageIfNull(plant_id: string, stage: number) {
        const res_id = getPlantImageID(plant_id, stage)
        if(!this.cache.has(res_id)) {
            try {
                const img_url = './images/' + plant_id + '/' + plant_id + '_' + stage + '.png'
                const img_res = await fetch(img_url);
                const img_data = await img_res.blob();
                const image = await createImageBitmap(img_data);
                

                const blob_id = getPlantImageBloblID(plant_id, stage)
                this.cache.set(res_id, image);
                this.cache.set(blob_id, img_data);
            } catch(e) {
                throw new Error('Could not load image: ' + e.message)
            }
        }
    }

    async initImages() {
        for(const template_id in this.plant_templates) {
            const template = this.plant_templates[template_id]
            for(let i = 0; i < template.stages.length; i++) {
                await this.loadTemplateImageIfNull(template.plant_id, i);
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