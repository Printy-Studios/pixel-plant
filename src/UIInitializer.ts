import constants from './const';
import Game from './Game';
import { ViewID } from './types/Misc';
import { getTemplateMaxStageIndex } from './util';

export default class UIInitializer {

    game: Game;

    button: HTMLButtonElement = document.createElement('button');
    menu: HTMLDivElement = document.createElement('div');

    constructor(game: Game) {
        this.game = game;

        this.button.classList.add('button')
        this.menu.classList.add('menu');
    }

    initGameUI() {
        // Game UI
        
        this.game.water_button = this.createButton('Water Plant', 'water-button');
        
        const water_button = this.game.water_button

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
        this.game.progress_message_container = progress_message_container
        progress_message_container.classList.add('progress-message')
        progress_message_container.tabIndex = 0;

        this.game.progress_message = document.createElement('p')
        const progress_message = this.game.progress_message;
        progress_message.innerHTML = 'You were away for n hours n minutes and your plant has grown by x %'

        this.game.progress_message_plant = this.createButton('menu-button')
        this.game.progress_message_plant.classList.add('small-button')
        this.game.progress_message_plant.innerHTML = 'Plant'

        progress_message_container.appendChild(progress_message);
        progress_message_container.appendChild(this.game.progress_message_plant)

        this.game.progress_message_plant.addEventListener('click', () => {
            this.game.plantNewPlant(this.game.recently_unlocked)
        })

        progress_message_container.addEventListener('focusout', () => {
            progress_message_container.style.display = 'none'
        })

        water_button.addEventListener('click', () => {
            this.game.waterCurrentPlant()
        })

        this.game.renderer.ui.appendChild(water_button);
        this.game.renderer.ui.appendChild(back_button);
        this.game.renderer.ui.appendChild(progress_message_container)
    }

    

    initMainMenu() {
        //Main menu

        //Play button
        const play_button = this.createViewButton('My Plant', 'plant', 'menu-button', () => {
            this.game.fastForwardBySeconds(this.game.getTimeAway())
        });

        //Collection button
        const collection_button = this.createLinkButton('Collection', 'collection', 'menu-button');

        //Options button
        const options_button = this.createLinkButton('Options', 'options', 'menu-button');

        this.game.main_menu = this.createMenu();

        this.game.main_menu.appendChild(play_button)
        this.game.main_menu.appendChild(collection_button)
        this.game.main_menu.appendChild(options_button)

        this.game.renderer.addMenu(this.game.main_menu, 'main')
    }

    initOptionsMenu() {
        //Options menu

        const options_menu = this.createMenu();

        const options_back = this.createLinkButton('Back', 'menu', 'menu-button')

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
            let should_be_selected = parseFloat(pace_key) == 1 / this.game.seconds_per_tick
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
            this.game.seconds_per_tick = 1 / parseFloat(e.target.value);
            this.game.saveData()
        })

        this.game.renderer.addMenu(options_menu, 'options')
    }

    initCollectionMenu() {
        // Collection menu

        const collection_menu = this.createMenu()

        const collection_back = this.createLinkButton('Back', 'menu', 'menu-button');

        collection_menu.appendChild(collection_back)

        for(const template_id in this.game.plant_templates) {
            const plant_button = this.createButton('menu-button');
            plant_button.classList.add('plant-button')
            // const plant = await Plant.fromTemplate(template_id, template_id, this.cache)
            const plant_template = this.game.plant_templates[template_id]
            const max_stage = getTemplateMaxStageIndex(plant_template);

            const img_element = document.createElement('img')
            img_element.classList.add('collection-image')

            plant_button.appendChild(img_element)

            let is_plant_unlocked = this.game.data.unlocked_plants.includes(plant_template.plant_id)

            if(is_plant_unlocked) {
                const image = this.game.cache.get('image_blobs/' + plant_template.plant_id + '/' + max_stage)

                const image_url = URL.createObjectURL(image);

                img_element.src = image_url

                const text = document.createElement('p');
                text.innerHTML = plant_template.name

                
                plant_button.appendChild(text);

                plant_button.addEventListener('click', () => {
                    this.game.showPlantMenu(plant_template);
                });
            } else {
                img_element.src = 'images/question-mark.png'
            }
            
            

            collection_menu.appendChild(plant_button)

        }

        this.game.renderer.addMenu(collection_menu, 'collection')
    }

    initPlantEntryMenu() {
        //Plant Entry
        const plant_menu = this.createMenu()

        const plant_back = this.createLinkButton('Back', 'collection', 'menu-button');

        this.game.plant_image.classList.add('collection-image');

        const plant_button = this.createButton('menu-button');
        plant_button.innerHTML = 'Plant';

        plant_menu.appendChild(plant_back);
        plant_menu.appendChild(this.game.plant_image);
        plant_menu.appendChild(this.game.plant_name);
        plant_menu.appendChild(this.game.plant_description);
        plant_menu.appendChild(plant_button);

        plant_button.addEventListener('click', () => {
            this.game.plantNewPlant(this.game.current_plant_in_menu.plant_id);
        })

        this.game.renderer.addMenu(plant_menu, 'plant');
    }

    async initUi() {
        
        this.initGameUI();
        this.initMainMenu();
        this.initOptionsMenu();
        this.initPlantEntryMenu();
        this.initCollectionMenu();

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
            this.game.renderer.showMenu(link_to)
            if(on_click) {
                on_click()
            }
        })

        return btn;
    }

    createViewButton(text = "", link_to: ViewID, class_name: string = "", on_click: Function = null) {
        const btn = this.createButton(text, class_name);

        btn.addEventListener('click', () => {
            this.game.setView(link_to)
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
}