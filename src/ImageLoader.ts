import MyCache from './MyCache';
import { getPlantImageBloblID, getPlantImageID } from './util';

export default class ImageLoader {

    cache: MyCache;

    constructor(cache: MyCache){ 
        this.cache = cache;
    }

    async loadTemplateImageIfNull(plant_id: string, stage: number) {
        const res_id = getPlantImageID(plant_id, stage)
        if(!this.cache.has(res_id)) {
            try {
                const img_url = './images/' + plant_id + '/' + plant_id + '_' + stage + '.png'
                const img_res = await fetch(img_url);
                const img_data = await img_res.blob();
                const image = await createImageBitmap(img_data);
                

                const blob_id = getPlantImageBloblID(plant_id, stage)
                this.cache.set(res_id, image);
                this.cache.set(blob_id, img_data);
            } catch(e) {
                throw new Error('Could not load image: ' + e.message)
            }
        }
    }
}