export default class MyCache {


    items: { [key: string]: any} = {}

    set(id: string, value: any) {
        if(id in this.items) {
            throw new Error('Cache: Could not store item by id ' + id + ': id already taken');
        }
        this.items[id] = value
    }

    get(id: string) {
        if(!(id in this.items)) {
            throw new Error('Cache: Could not find item by id ' + id);
        }
        return this.items[id];
    }

    has(id: string) {
        return (id in this.items)
    }

}