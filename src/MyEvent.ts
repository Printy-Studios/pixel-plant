export default class MyEvent<Callback extends (...args: any[]) => any> {
    max_id = 0;

    callbacks: {
        [key: string]: Callback
    } = {}

    on(cb: Callback) {
        this.callbacks[this.max_id++] = cb;
        return this.max_id;
    }

    off(id: string) {
        delete this.callbacks[id]
    }

    emit(...args: Parameters<Callback>) {
        for(const key in this.callbacks) {
            this.callbacks[key](...args)
        }
    }

}