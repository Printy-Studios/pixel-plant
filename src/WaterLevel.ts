import { PlantTemplate } from './Plant';

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
        this.calcCurrentStage();
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