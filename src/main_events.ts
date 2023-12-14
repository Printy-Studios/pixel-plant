import MyEvent from './MyEvent';

const main_events = {
    on_request_plant_new_plant: new MyEvent<(plant_id: string) => void>(),
    on_request_water_plant: new MyEvent(),
    on_request_fast_forward: new MyEvent(),
    on_request_show_menu: new MyEvent<(menu_id: string) => void>(),
    on_request_set_view: new MyEvent<(view_id: string) => void>(),
    on_request_data_reset: new MyEvent(),
    on_request_data_save: new MyEvent(),
    on_fast_forward: new MyEvent()
}

export default main_events