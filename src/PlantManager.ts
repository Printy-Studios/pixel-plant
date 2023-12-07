export default class PlantManager {
    async initPlants() {

        //let difference_s = this.getTimeAway()

        // this.plants = {};

        // for(let i = 0; i < this.data.plants.length; i++) {
        //     const plant = await Plant.fromJSON(this.data.plants[i], this.cache)
        //     this.createPlant(plant)
        // }
        const plant = await Plant.fromJSON(this.data.plant, this.cache)
        this.createPlant(plant);
        //this.fastForwardBySeconds(difference_s)

        this.setPlant(Object.values(this.plants)[0] as Plant);
    }

    createPlant(plant: Plant) {
        this.plants[plant.id] = plant;
    }
}