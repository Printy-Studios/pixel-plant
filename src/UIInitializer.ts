import Game from './Game';
import { getTemplateMaxStageIndex } from './util';

export default class UIInitializer {

    game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    initGameUI() {
        // Game UI
        
        const water_button = this.game.createButton('water-button');
        
        water_button.innerHTML = 'Water Plant'
        water_button.style.position = 'absolute'
        water_button.style.top = '140px'
        water_button.style.left = '50%';
        water_button.style.transform = 'translateX(-50%)'
        water_button.tabIndex = 4;

        //Back button
        const back_button = this.game.createButton('button');
        back_button.innerHTML = 'Back'
        back_button.style.position = 'absolute'
        back_button.style.top = '16px'
        back_button.style.left = '16px'
        back_button.tabIndex = 2
        
        //Progress message
        const progress_message_container = document.createElement('div')
        this.game.progress_message_container = progress_message_container
        progress_message_container.classList.add('progress-message')
        progress_message_container.tabIndex = 0;

        this.game.progress_message = document.createElement('p')
        const progress_message = this.game.progress_message;
        progress_message.innerHTML = 'You were away for n hours n minutes and your plant has grown by x %'

        this.game.progress_message_plant = this.game.createButton('menu-button')
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

        this.game.reset_button.addEventListener('click', () => {
            const confirm_reset = confirm('Are you sure you want to reset the game? All data will be lost')
            if(confirm_reset) {
                this.game.resetData()
            }
            
        })

        back_button.addEventListener('click', () => {
            this.game.renderer.showMenu('main')
            this.game.setView(null)
        })

        this.game.renderer.ui.appendChild(water_button);
        this.game.renderer.ui.appendChild(back_button);
        this.game.renderer.ui.appendChild(progress_message_container)
    }

    initMainMenu() {
        //Main menu

        //Play button
        const play_button = this.game.createButton('menu-button')
        play_button.innerHTML = 'My Plant'

        //Collection button
        const collection_button = this.game.createButton('menu-button')
        collection_button.innerHTML = 'Collection'

        //Options button
        const options_button = this.game.createButton('menu-button')
        options_button.innerHTML = 'Options'

        this.game.main_menu = this.game.createMenu();

        this.game.main_menu.appendChild(play_button)
        this.game.main_menu.appendChild(collection_button)
        this.game.main_menu.appendChild(options_button)

        // Event handlers

        //Main menu
        play_button.addEventListener('click', () => {
            this.game.setView('plant')
            this.game.fastForwardBySeconds(this.game.getTimeAway())
        })

        options_button.addEventListener('click', () => {
            this.game.renderer.showMenu('options')
        })

        collection_button.addEventListener('click', () => {
            this.game.renderer.showMenu('collection')
        })

        this.game.renderer.addMenu(this.game.main_menu, 'main')
    }

    initOptionsMenu() {
        //Options menu

        const options_menu = this.game.createMenu();

        const options_back = this.game.createButton('menu-button')
        options_back.innerHTML = 'Back'

        const reset_button = this.game.createButton('menu-button')
        reset_button.innerHTML = 'Reset Game'

        const pace_selector = document.createElement('div')
        const pace_selector_label = document.createElement('p')
        const pace_selector_dropdown = document.createElement('select')

        pace_selector.classList.add('pace-selector')

        pace_selector_label.innerHTML = 'Pace: '

        const paces = {
            "4": 4,
            "2": 2,
            "1": 1,
            "0.5": 0.5,
            "0.25": 0.25
        }
        for (const pace_key in paces) {
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

        options_back.addEventListener('click', () => {
            this.game.renderer.showMenu('main')
        })

        this.game.renderer.addMenu(options_menu, 'options')
    }

    initCollectionMenu() {
        // Collection menu

        const collection_menu = this.game.createMenu()

        const collection_back = this.game.createButton('menu-button')
        collection_back.innerHTML = 'Back'

        collection_menu.appendChild(collection_back)

        for(const template_id in this.game.plant_templates) {
            const plant_button = this.game.createButton('menu-button');
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

        // Collection menu

        collection_back.addEventListener('click', () => {
            this.game.renderer.showMenu('main')
        })

        this.game.renderer.addMenu(collection_menu, 'collection')
    }

    initPlantEntryMenu() {
        //Plant Entry
        const plant_menu = this.game.createMenu()

        const plant_back = this.game.createButton('menu-button');
        plant_back.innerHTML = 'Back';

        this.game.plant_image.classList.add('collection-image');

        const plant_button = this.game.createButton('menu-button');
        plant_button.innerHTML = 'Plant';

        plant_menu.appendChild(plant_back);
        plant_menu.appendChild(this.game.plant_image);
        plant_menu.appendChild(this.game.plant_name);
        plant_menu.appendChild(this.game.plant_description);
        plant_menu.appendChild(plant_button);

        // Entry menu

        plant_back.addEventListener('click', () => {
            this.game.renderer.showMenu('main')
        })

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
}