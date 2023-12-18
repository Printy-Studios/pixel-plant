import { PlantTemplate } from './types/PlantTemplate';

type WaterLevelStage = {
    from: number,
    to: number,
    growth_rate: number
}

export default class WaterLevel {
    current: number;
    decrease_rate: number;
    private current_stage: number;
    stages: WaterLevelStage[];

    constructor(decrease_rate = 0.5, stages: WaterLevelStage[] = []) {
        this.stages = stages;
        this.current = 100;
        this.decrease_rate = decrease_rate;
        this.validateStages();
        this.calcCurrentStage();
    }

    private validateStages() {
        for(let a = 0; a < this.stages.length; a++) {
            
            const stage_a = this.stages[a - 1]
            const stage_b = this.stages[a]
            const stage_c = this.stages[a + 1]
            let valid;

            if (this.stages.length == 1) {
                valid = stage_b.from == 0 && stage_b.to == 100
            } else if (a == 0) {
                valid = stage_b.from == 0 && stage_b.to == stage_c.from
            } else if (a != this.stages.length - 1) {
                valid = stage_a.to == stage_b.from && stage_b.to == stage_c.from
            } else {
                valid = stage_b.from == stage_a.to && stage_b.to == 100
            }
            if(!valid) {
                throw new Error('Invalid water level')
            }
        }
    }

    private calcCurrentStage() {
        for (let i = 0; i < this.stages.length; i++) {
            const stage = this.stages[i];
            if(this.current <= stage.to && this.current >= stage.from) {
                this.current_stage = i;
                return;
            }
        }
        throw new Error('Error calculating water current stage')
    }

    getCurrentStage() {
        return this.stages[this.current_stage];
    }

    decreaseByTicks(ticks: number) {
        this.current = Math.max(0, this.current - this.decrease_rate * ticks);
        this.calcCurrentStage();
    }

    decrease() {
        this.decreaseByTicks(1);
    }

    set(current: number) {
        this.current = current;
        this.calcCurrentStage();
    }

    top() {
        this.set(100)
    }

    static fromTemplate(template: PlantTemplate) {
        const stages: WaterLevelStage[] = []
        template.water_level.stages.forEach((stage) => {
            stages.push(stage);
        })
        return new WaterLevel(
            template.water_level.decrease_rate,
            stages
        )
    }
}