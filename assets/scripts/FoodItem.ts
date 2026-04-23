import { _decorator, Component, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FoodItem')
export class FoodItem extends Component {
    @property({ tooltip: "Berapa lama makanan bertahan sebelum hilang (detik)" })
    public lifespan: number = 10; 

    private timer: number = 0;
    private opacityComp: UIOpacity = null;

    start() {
        this.opacityComp = this.getComponent(UIOpacity);
        if (!this.opacityComp) {
            this.opacityComp = this.addComponent(UIOpacity);
        }
    }

    update(dt: number) {
        this.timer += dt;

        //Makanan mulai kedap-kedip saat waktu tersisa 3 detik
        if (this.timer > (this.lifespan - 3)) {
            let remaining = this.lifespan - this.timer;
            let ratio = remaining / 3;
            this.opacityComp.opacity = ratio * 255;
        }

        if (this.timer >= this.lifespan) {
            this.node.destroy();
        }
    }
}