import { _decorator, Component, Node, Prefab, instantiate, UITransform, math } from 'cc';
import { Pacman } from './Pacman'; 
const { ccclass, property } = _decorator;

@ccclass('FoodSpawner')
export class FoodSpawner extends Component {

    @property(Prefab) public dotPrefab: Prefab = null;
    @property(Prefab) public powerPrefab: Prefab = null;
    @property(Prefab) public strawberryPrefab: Prefab = null;
    @property(Node) public foodParent: Node = null;

    @property public spawnInterval: number = 3.0;
    @property public maxFoodLimit: number = 5; // Batasi maksimal 5
    @property public initialDelay: number = 2.0;

    private isSpawnerStarted: boolean = false;

    update(deltaTime: number) {
        if (Pacman.GAME_UDAH_MULAI && !this.isSpawnerStarted) {
            this.startSpawner();
        }
    }

    private startSpawner() {
        this.isSpawnerStarted = true;
        this.schedule(this.spawnRandomFood, this.spawnInterval, 99999, this.initialDelay);
    }

    private spawnRandomFood() {
        if (!this.foodParent) return;

        let currentActiveFood = 0;
        for (let child of this.foodParent.children) {
            if (child.active) {
                currentActiveFood++;
            }
        }

        if (currentActiveFood >= this.maxFoodLimit) {
            return; 
        }

        let rand = Math.random();
        let selectedPrefab: Prefab = null;
        let typeName: string = "";

        // --- PERUBAHAN PROBABILITAS YANG LEBIH EKSTREM ---
        if (rand < 0.85) {
            // 85% kemungkinan muncul Dot (Sangat Sering)
            selectedPrefab = this.dotPrefab;
            typeName = "dot";
        } else if (rand < 0.95) {
            // 10% kemungkinan muncul power (Langka)
            selectedPrefab = this.powerPrefab;
            typeName = "power";
        } else {
            // 5% kemungkinan muncul Strawberry (Sangat Langka / Epic)
            selectedPrefab = this.strawberryPrefab;
            typeName = "strawberry";
        }
        // ------------------------------------------------

        this.createFood(selectedPrefab, typeName);
    }

    private createFood(prefab: Prefab, name: string) {
        if (!prefab) return;

        let food = instantiate(prefab);
        food.parent = this.foodParent;
        food.name = name; 

        // Tentukan posisi random (logika batas sama seperti sebelumnya)
        let transform = this.node.getComponent(UITransform);
        let randomX = math.randomRange(-(transform.width/2)+50, (transform.width/2)-50);
        let randomY = math.randomRange(-(transform.height/2)+50, (transform.height/2)-50);
        food.setPosition(randomX, randomY, 0);
    }
}