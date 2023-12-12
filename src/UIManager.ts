import constants from './const';
import Game from './Game';
import SaveManager from './SaveManager';
import { ViewID } from './types/Misc';
import { getPlantTemplateFullyGrownImageURL, getTemplateMaxStageIndex, getTemplateUnlock, secondsToTime } from './util';
import { PlantTemplate, PlantTemplates } from './types/PlantTemplate';
import MyCache from './MyCache';
import Renderer from './Renderer';
import Plant from './Plant';
import MyEvent from './MyEvent';
import main_events from './main_events';
import vars from './globals';
import globals from './globals';

export default class UIManager {

    data: SaveManager;
    cache: MyCache;
    renderer: Renderer;
    //game: Game;

    button: HTMLButtonElement = document.createElement('button');
    menu: HTMLDivElement = document.createElement('div');

    water_button: HTMLDivElement;
    reset_button: HTMLDivElement;

    main_menu: HTMLDivElement
    options_menu: HTMLDivElement

    plant_buttons: HTMLButtonElement[] = []

    progress_message: HTMLDivElement;
    progress_message_container: HTMLDivElement;
    progress_message_plant: HTMLDivElement;

    plant_image: HTMLImageElement = document.createElement('img');
    plant_name: HTMLHeadingElement = document.createElement('h2');
    plant_description: HTMLParagraphElement = document.createElement('p');
    current_plant_in_menu: PlantTemplate;

    on_data_reset: Function
    save_data: Function
    

    constructor(game: Game, data: SaveManager, cache: MyCache, renderer: Renderer, on_data_reset: Function, save_data: Function) {
        //this.game = game;
        this.cache = cache;
        this.renderer = renderer;

        this.on_data_reset = on_data_reset;
        this.save_data = save_data;

        this.button.classList.add('button')
        this.menu.classList.add('menu');
    }

    

    initGameUI() {
        // Game UI
        
        this.water_button = this.createButton('Water Plant', 'water-button');
        
        const water_button = this.water_button

        // water_button.innerHTML = 'Water Plant'
        // water_button.style.position = 'absolute'
        // water_button.style.top = '140px'
        // water_button.style.left = '50%';
        // water_button.style.transform = 'translateX(-50%)'
        // water_button.tabIndex = 4;

        //Back button
        const back_button = this.createLinkButton('Back', 'main', 'button-tl')

        //Progress message
        const progress_message_container = document.createElement('div')
        this.progress_message_container = progress_message_container
        progress_message_container.classList.add('progress-message')
        progress_message_container.tabIndex = 0;

        this.progress_message = document.createElement('p')
        const progress_message = this.progress_message;
        progress_message.innerHTML = 'You were away for n hours n minutes and your plant has grown by x %'

        this.progress_message_plant = this.createButton('menu-button')
        this.progress_message_plant.classList.add('small-button')
        this.progress_message_plant.innerHTML = 'Plant'

        progress_message_container.appendChild(progress_message);
        progress_message_container.appendChild(this.progress_message_plant)

        this.progress_message_plant.addEventListener('click', () => {
            main_events.on_request_plant_new_plant.emit(globals.recently_unlocked);
            //this.game.plantNewPlant(this.game.recently_unlocked)
        })

        progress_message_container.addEventListener('focusout', () => {
            progress_message_container.style.display = 'none'
        })

        water_button.addEventListener('click', () => {
            main_events.on_request_water_plant.emit();
            //this.game.waterCurrentPlant()
        })

        this.renderer.ui.appendChild(water_button);
        this.renderer.ui.appendChild(back_button);
        this.renderer.ui.appendChild(progress_message_container)
    }

    

    initMainMenu() {
        //Main menu

        //Play button
        const play_button = this.createViewButton('My Plant', 'plant', 'menu-button', () => {
            main_events.on_request_fast_forward.emit()
            //this.game.fastForwardBySeconds(this.game.getTimeAway())
        });

        //Collection button
        const collection_button = this.createLinkButton('Collection', 'collection', 'menu-button');

        //Options button
        const options_button = this.createLinkButton('Options', 'options', 'menu-button');

        this.main_menu = this.createMenu();

        this.main_menu.appendChild(play_button)
        this.main_menu.appendChild(collection_button)
        this.main_menu.appendChild(options_button)

        this.renderer.addMenu(this.main_menu, 'main')
    }

    initOptionsMenu() {
        //Options menu

        const options_menu = this.createMenu();

        const options_back = this.createLinkButton('Back', 'main', 'menu-button')

        const reset_button = this.createButton('menu-button')
        reset_button.innerHTML = 'Reset Game'

        const pace_selector = document.createElement('div')
        const pace_selector_label = document.createElement('p')
        const pace_selector_dropdown = document.createElement('select')

        pace_selector.classList.add('pace-selector')

        pace_selector_label.innerHTML = 'Pace: '

        
        for (const pace_key in constants.paces) {
            const option = document.createElement('option')
            option.value = pace_key
            option.innerHTML = pace_key
            let should_be_selected = parseFloat(pace_key) == 1 / globals.seconds_per_tick
            if(should_be_selected) {
                option.selected = true;
            }
            pace_selector_dropdown.appendChild(option)
        }

        

        pace_selector.appendChild(pace_selector_label)
        pace_selector.appendChild(pace_selector_dropdown)

        options_menu.appendChild(pace_selector)
        options_menu.appendChild(options_back)
        options_menu.appendChild(reset_button)

        //Options menu

        pace_selector_dropdown.addEventListener('change', (e: any) => {
            globals.seconds_per_tick = 1 / parseFloat(e.target.value);
            this.save_data()
        })

        this.renderer.addMenu(options_menu, 'options')
    }

    initCollectionMenu(plant_templates: PlantTemplates, unlocked_plants: string[]) {
        // Collection menu

        const collection_menu = this.createMenu()

        const collection_back = this.createLinkButton('Back', 'main', 'menu-button');

        collection_menu.appendChild(collection_back)

        for(const template_id in plant_templates) {
            const plant_button = this.createButton('menu-button');
            plant_button.classList.add('plant-button')
            // const plant = await Plant.fromTemplate(template_id, template_id, this.cache)
            const plant_template = plant_templates[template_id]
            const max_stage = getTemplateMaxStageIndex(plant_template);

            const img_element = document.createElement('img')
            img_element.classList.add('collection-image')

            plant_button.appendChild(img_element)

            let is_plant_unlocked = unlocked_plants.includes(plant_template.plant_id)

            if(is_plant_unlocked) {
                //const image = this.cache.get('image_blobs/' + plant_template.plant_id + '/' + max_stage)

                const image_url = plant_template.stages[max_stage].image_url//URL.createObjectURL(image);

                img_element.src = image_url

                const text = document.createElement('p');
                text.innerHTML = plant_template.name

                
                plant_button.appendChild(text);

                plant_button.addEventListener('click', () => {
                    this.showPlantMenu(plant_template);
                });
            } else {
                img_element.src = 'images/question-mark.png'
            }
            
            

            collection_menu.appendChild(plant_button)

        }

        this.renderer.addMenu(collection_menu, 'collection')
    }

    initPlantEntryMenu() {
        //Plant Entry
        const plant_menu = this.createMenu()

        const plant_back = this.createLinkButton('Back', 'collection', 'menu-button');

        this.plant_image.classList.add('collection-image');

        const plant_button = this.createButton('menu-button');
        plant_button.innerHTML = 'Plant';

        plant_menu.appendChild(plant_back);
        plant_menu.appendChild(this.plant_image);
        plant_menu.appendChild(this.plant_name);
        plant_menu.appendChild(this.plant_description);
        plant_menu.appendChild(plant_button);

        plant_button.addEventListener('click', () => {
            main_events.on_request_plant_new_plant.emit(this.current_plant_in_menu.plant_id);
            //this.game.plantNewPlant(this.current_plant_in_menu.plant_id);
        })

        this.renderer.addMenu(plant_menu, 'plant');
    }

    async initUi(plant_templates: PlantTemplates, unlocked_plants: string[]) {
        
        this.initGameUI();
        this.initMainMenu();
        this.initOptionsMenu();
        this.initPlantEntryMenu();
        this.initCollectionMenu(plant_templates, unlocked_plants);

    }

    createButton(text: string, class_name: string = null) {
        const btn = this.button.cloneNode() as HTMLDivElement
        btn.classList.add(class_name)
        btn.innerHTML = text;
        return btn;
    }

    createLinkButton(text = "", link_to: string = "", class_name: string = "", on_click: Function = null) {
        const btn = this.createButton(text, class_name);

        btn.addEventListener('click', () => {
            main_events.on_request_show_menu.emit(link_to)
            if(on_click) {
                on_click()
            }
        })

        return btn;
    }

    createViewButton(text = "", link_to: ViewID, class_name: string = "", on_click: Function = null) {
        const btn = this.createButton(text, class_name);

        btn.addEventListener('click', () => {
            main_events.on_request_set_view.emit(link_to);
            if(on_click) {
                on_click()
            }
        })

        return btn;
    }

    createMenu(class_name: string = null) {
        const menu = this.menu.cloneNode() as HTMLDivElement;
        menu.classList.add(class_name)
        return menu;
    }

    showPlantMenu(plant_template: PlantTemplate) {
        this.plant_image.src = getPlantTemplateFullyGrownImageURL(plant_template, this.cache);
        this.plant_name.innerHTML = plant_template.name;
        this.plant_description.innerHTML = plant_template.description;
        this.current_plant_in_menu = plant_template;
        this.renderer.showMenu('plant');
    }

    displayProgressMessage(plant: Plant, plant_templates: PlantTemplates, recently_unlocked: string, ff = true, growth_before: number = null, growth_after: number = null, seconds_elapsed: number = null) {

        let show_plant_button = false;

        let message = "";

        const time = secondsToTime(seconds_elapsed);
        let has_time = time.m > 0;
        if(has_time && ff) {
            const growth_difference = growth_after - growth_before;
            let growth_percent: number | boolean = growth_difference / plant.maxGrowth() * 100

            if(plant.isFullyGrown()) {
                growth_percent = true;
            }
            
            message = this.progressMessageText(time, growth_percent)
            
        } else if(!ff) {
            message = this.progressMessageText({ h: 0, m: 0}, true)
        }

        const unlock = getTemplateUnlock(plant.plant_id, plant_templates);

        if (plant.isFullyGrown() && unlock) {
            message += '<br><b>You have unlocked a new plant - ' + unlock.name + '. Would you like to plant it?';
            recently_unlocked = unlock.plant_id;
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

    calculatePositions(plant: Plant){
        this.water_button.style.top = plant.position.y * constants.scale + 160 + 'px'
    }
}