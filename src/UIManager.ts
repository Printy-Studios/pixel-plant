import Renderer from './Renderer'
import PlantTemplate, { PlantTemplates } from './PlantTemplate';
import globals from './globals';
import MyCache from './MyCache';


export default class UIManager {

    renderer: Renderer;

    current_view: ViewID | null = null;

    button: HTMLButtonElement = document.createElement('button');

    progress_message: HTMLDivElement;
    progress_message_container: HTMLDivElement;
    progress_message_plant: HTMLDivElement;

    plant_image: HTMLImageElement = document.createElement('img');
    plant_name: HTMLHeadingElement = document.createElement('h2');
    plant_description: HTMLParagraphElement = document.createElement('p');
    current_plant_in_menu: PlantTemplate;


    constructor(renderer: Renderer) {
        this.button.classList.add('button');
        this.renderer = renderer;
    }

    async init(plant_templates: PlantTemplates, cache: MyCache) {
        // Game UI
        const water_button = this.createButton('Water Plant', 'water-button');
        
        //water_button.innerHTML = 'Water Plant'
        // water_button.style.position = 'absolute'
        // water_button.style.top = '140px'
        // water_button.style.left = '50%';
        // water_button.style.transform = 'translateX(-50%)'
        // water_button.tabIndex = 4;

        //Back button
        const back_button = this.createButton('Back', 'button');
        // back_button.innerHTML = 'Back'
        // back_button.style.position = 'absolute'
        // back_button.style.top = '16px'
        // back_button.style.left = '16px'
        // back_button.tabIndex = 2
        
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

        //--Main menu--//

        //Play button
        const play_button = this.createButton('My Plant', 'menu-button')

        //Collection button
        const collection_button = this.createButton('Collection', 'menu-button')

        //Options button
        const options_button = this.createButton('Options', 'menu-button')

        const main_menu = document.createElement('div');
        // this.main_menu.classList.add('menu')
        // this.main_menu.style.alignItems = 'center'
        // this.main_menu.style.justifyContent = 'center'
        // this.main_menu.id = 'main'

        main_menu.appendChild(play_button)
        main_menu.appendChild(collection_button)
        main_menu.appendChild(options_button)

        

        //Options menu

        const options_menu = document.createElement('div')
        options_menu.classList.add('menu')

        const options_back = this.createButton('Back', 'menu-button')

        const reset_button = this.createButton('Reset Game', 'menu-button')

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
        console.log('pace');
        for (const pace_key in paces) {
            const option = document.createElement('option')
            option.value = pace_key
            option.innerHTML = pace_key
            if(parseFloat(pace_key) == 1 / globals.seconds_per_tick) {
                option.selected = true;
            }
            pace_selector_dropdown.appendChild(option)
        }

        

        pace_selector.appendChild(pace_selector_label)
        pace_selector.appendChild(pace_selector_dropdown)

        options_menu.appendChild(pace_selector)
        options_menu.appendChild(options_back)
        options_menu.appendChild(reset_button)
        
        // Collection menu

        const collection_menu = document.createElement('div')
        collection_menu.classList.add('menu')

        const collection_back = this.createButton('menu-button')
        collection_back.innerHTML = 'Back'

        collection_menu.appendChild(collection_back)

        console.log(plant_templates)
        for(const template_id in plant_templates) {
            const plant_button = this.createButton('menu-button');
            plant_button.classList.add('plant-button')
            // const plant = await Plant.fromTemplate(template_id, template_id, this.cache)
            const plant_template = plant_templates[template_id]
            const max_stage = plant_template.stages.length - 1;

            const img_element = document.createElement('img')
            img_element.classList.add('collection-image')

            plant_button.appendChild(img_element)

            if(globals.data.unlocked_plants.includes(plant_template.plant_id)) {
                const image = cache.get('image_blobs/' + plant_template.plant_id + '/' + max_stage)

                const image_url = URL.createObjectURL(image);

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


        //Plant Entry
        const plant_menu = document.createElement('div');

        const plant_back = this.createButton('menu-button');
        plant_back.innerHTML = 'Back';

        this.plant_image.classList.add('collection-image');

        const plant_button = this.createButton('menu-button');
        plant_button.innerHTML = 'Plant';

        plant_menu.appendChild(plant_back);
        plant_menu.appendChild(this.plant_image);
        plant_menu.appendChild(this.plant_name);
        plant_menu.appendChild(this.plant_description);
        plant_menu.appendChild(plant_button);

        


        // Event handlers

        //Main menu
        play_button.addEventListener('click', () => {
            this.setView('plant')
            const time_away = this.getTimeAway() 
            this.fastForwardBySeconds(time_away)
        })

        options_button.addEventListener('click', () => {
            this.renderer.showMenu('options')
        })

        collection_button.addEventListener('click', () => {
            this.renderer.showMenu('collection')
        })

        //Options menu

        pace_selector_dropdown.addEventListener('change', (e: any) => {
            this.seconds_per_tick = 1 / parseFloat(e.target.value);
            console.log(this.seconds_per_tick);
            this.saveData()
        })

        options_back.addEventListener('click', () => {
            this.renderer.showMenu('main')
        })

        // Collection menu

        collection_back.addEventListener('click', () => {
            this.renderer.showMenu('main')
        })

        // Entry menu

        plant_back.addEventListener('click', () => {
            this.renderer.showMenu('main')
        })

        plant_button.addEventListener('click', () => {
            this.plantNewPlant(this.current_plant_in_menu.plant_id);
        })

        //Game UI

        this.progress_message_plant.addEventListener('click', () => {
            this.plantNewPlant(this.recently_unlocked)
        })

        progress_message_container.addEventListener('focusout', () => {
            progress_message_container.style.display = 'none'
        })

        water_button.addEventListener('click', () => {
            this.waterCurrentPlant()
        })

        reset_button.addEventListener('click', () => {
            const confirm_reset = confirm('Are you sure you want to reset the game? All data will be lost')
            if(confirm_reset) {
                this.resetData()
            }
            
        })

        back_button.addEventListener('click', () => {
            this.renderer.showMenu('main')
            this.setView(null)
        })

        

        this.renderer.addMenu(this.main_menu, 'main')
        this.renderer.addMenu(options_menu, 'options')
        this.renderer.addMenu(collection_menu, 'collection')
        this.renderer.addMenu(plant_menu, 'plant');

        this.renderer.ui.appendChild(water_button);
        this.renderer.ui.appendChild(back_button);
        this.renderer.ui.appendChild(progress_message_container)
        
        //this.renderer.ui.appendChild(reset_button)

       
    }

    displayProgressMessage(message: string, show_plant_button: boolean = false,) {
        if(show_plant_button) {
            this.progress_message_plant.style.display = 'flex';
        } else {
            this.progress_message_plant.style.display = 'none';
        }
        this.progress_message.innerHTML = message;
        this.progress_message_container.style.display = 'flex'
        this.progress_message_container.focus()
    }

    showPlantMenu(plant_template: PlantTemplate) {
        this.plant_image.src = this.getPlantTemplateFullyGrownImageURL(plant_template);
        this.plant_name.innerHTML = plant_template.name;
        this.plant_description.innerHTML = plant_template.description;
        this.current_plant_in_menu = plant_template;
        this.renderer.showMenu('plant');
    }

    setView(view_name: ViewID | null) {
        this.current_view = view_name
        if(view_name) {
            this.renderer.hideMenu();
        }
        
    }

    createButton(text: string, class_name: string = "") {
        const btn = this.button.cloneNode() as HTMLDivElement
        btn.classList.add(class_name)
        btn.innerHTML = text;
        return btn;
    }
}