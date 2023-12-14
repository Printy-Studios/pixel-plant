import constants from './const';
import Plant from './Plant';
import { PlantTemplate } from './types/PlantTemplate';
import ProgressBar from './ProgressBar';
import Rect from './Rect';
import Sprite from './Sprite';
import Vector from './Vector';

export default class Renderer {

    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    scale: number = constants.scale;
    ui: HTMLDivElement;
    menus: { [key: string]: HTMLDivElement} = {};
    menu_element: HTMLDivElement;
    menu: string = null

    constructor(canvas_id: string, ui_id: string, menu_id: string){
        this.canvas = document.getElementById(canvas_id) as HTMLCanvasElement;
        this.ui = document.getElementById(ui_id) as HTMLDivElement;
        this.menu_element = document.getElementById(menu_id) as HTMLDivElement
        if(!this.canvas) {
            throw new Error('Could not find canvas element by id ' + canvas_id);
        }

        
        window.addEventListener('resize', (e) => {
            this.calculateCanvasSize();
        })

        this.ctx = this.canvas.getContext('2d');
        this.calculateCanvasSize();

        
    }

    calculateCanvasSize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.scale(this.scale, this.scale)
        this.ctx.imageSmoothingEnabled = false;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    scaledPosition(pos: Vector) {
        return pos.divide(this.scale)
    }

    drawSprite(sprite: Sprite) {
        const pos = sprite.position.add(new Vector(-sprite.width / 2, -sprite.height / 2))//sprite.getCenter(this.scale)
        this.ctx.drawImage(sprite.image, pos.x, pos.y)
    }

    drawRect(rect: Rect, color: string) {
        this.ctx.fillStyle = color
        this.ctx.fillRect(
            rect.left,
            rect.top,
            rect.size.x,
            rect.size.y
        )
    }

    drawLine(from: Vector, to: Vector, color: string) {
        this.ctx.strokeStyle = color;
        this.ctx.beginPath()
        this.ctx.moveTo(from.x, from.y)
        this.ctx.lineTo(to.x, to.y)
        this.ctx.stroke()
    }

    currentMenu() {
        return document.getElementById(this.menu);
    }

    drawProgressBar(progress_bar: ProgressBar) {
        const { position, size } = progress_bar;
        const { x, y } = position
        const { x: width, y: height } = size
        const left = x - width / 2
        const top = y - height / 2
        this.drawRect(progress_bar, progress_bar.bg_color)

        this.ctx.fillStyle = progress_bar.color

        const new_rect = structuredClone(progress_bar) as unknown as  Rect
        if(progress_bar.direction == 'right') {
            
            new_rect.size.x = progress_bar.current / 100 * progress_bar.size.x 
            this.drawRect(new_rect, progress_bar.color)

            const bar_length = new_rect.right - new_rect.left;
            const y = new_rect.position.y - 1;
            const end_y = new_rect.bottom + 2;
            for(const divider of progress_bar.dividers) {
                
                const x = new_rect.position.x - (bar_length / 2 )+ bar_length / 100 * divider;
                
                const pos1 = new Vector(x, y)
                const pos2 = new Vector(x, end_y)

                this.drawLine(pos1, pos2, progress_bar.divider_color)
            }
        } else {
            throw new Error('Progress bar rendering only implemented for right direction')
        }

        
        
    }

    drawPlant(plant: Plant) {

        this.drawSprite(plant.getCurrentStage().sprite)
        this.drawProgressBar(plant.water_level_bar)
        //this.drawSprite
    }

    addMenu(menu: HTMLDivElement, menu_id: string) {
        if(menu_id) {
            menu.id = menu_id + '-menu'
        }
        menu.classList.add('menu');
        document.getElementById('menus').appendChild(menu);
        this.menus[menu_id] = menu;
    }

    showMenu(menu_id: string) {
        this.ui.style.display = 'none';
        this.menu_element.style.display = 'flex'
        this.hideMenu();
        const menu = document.getElementById(menu_id + '-menu')
        if(!menu) {
            throw new Error('Could not find menu with ID ' + menu_id)
        }
        menu.style.display = 'flex'
        this.menu_element.style.display = 'flex';
        this.hideUI()
        //this.menu_element.replaceWith(this.menu)
    }

    hideUI() {
        this.ui.style.display = 'none'
    }

    showUI() {
        this.ui.style.display = 'block';
    }

    hideMenu() {
        Object.keys(this.menus).forEach(menu_id => {
            document.getElementById(menu_id + '-menu').style.display = 'none'
        })
        this.menu_element.style.display = 'none';
        this.showUI()
    }

}