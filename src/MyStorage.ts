export default class MyStorage {

    prefix: string = 'pixel-plant:'

    get (key: string) {
        return JSON.parse(localStorage.getItem(this.prefix + key));
    }

    set(key: string, value: any) {
        localStorage.setItem(this.prefix + key, JSON.stringify(value));
    }

    has(key: string) {
        return !!localStorage.getItem(this.prefix + key);
    }

    remove(key: string) {
        localStorage.removeItem(key);
    }


}