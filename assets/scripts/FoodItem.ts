import { _decorator, Component, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FoodItem')
export class FoodItem extends Component {
    @property({ tooltip: "Berapa lama makanan bertahan sebelum hilang (detik)" })
    public lifespan: number = 10; 

    private timer: number = 0;
    private opacityComp: UIOpacity = null;

    start() {
        // Ambil atau tambahkan komponen UIOpacity untuk mengatur transparansi
        this.opacityComp = this.getComponent(UIOpacity);
        if (!this.opacityComp) {
            this.opacityComp = this.addComponent(UIOpacity);
        }
    }

    update(dt: number) {
        this.timer += dt;

        // Mulai memudar saat waktu tersisa 3 detik
        if (this.timer > (this.lifespan - 3)) {
            // Hitung sisa waktu dan ubah opacity (255 = penuh, 0 = hilang)
            let remaining = this.lifespan - this.timer;
            let ratio = remaining / 3; // Rasio 1 ke 0 dalam 3 detik
            this.opacityComp.opacity = ratio * 255;
        }

        // Hancurkan objek jika waktu habis
        if (this.timer >= this.lifespan) {
            this.node.destroy();
        }
    }
}