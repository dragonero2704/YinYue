class Cache{
    constructor(size = 100){
        this.registry = new Map();
        this.history = [];
        this.maxSize = size;
    }

    set(key, value){
        this.registry.set(key,value)
        this.history.push(key)
        if(this.registry.size > this.maxSize){
            //removes the element that was added first
            let key = this.history.shift()
            this.registry.delete(key)
        }
    }

    unset(key){
        this.registry.delete(key)
        this.history = this.history.map(e=>e!==key)
    }

    get(key){
        return this.registry.get(key)
    }

    clear(){
        this.registry.clear()
        this.history = []
    }
}

module.exports = {
    Cache
}