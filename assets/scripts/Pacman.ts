import { _decorator, Component, Node, input, Input, EventKeyboard, KeyCode, Vec3, Animation, math, view, UITransform, Sprite, Label } from 'cc';
const { ccclass, property } = _decorator;

enum PacmanDirection { RIGHT, LEFT, UP, DOWN, IDLE }

@ccclass('Pacman')
export class Pacman extends Component {

    static GAME_UDAH_MULAI: boolean = false;

    @property({ tooltip: "Kecepatan gerak pacman" })
    public speed: number = 200;

    @property({ tooltip: "Nama clip animasi menghadap KANAN" })
    public clipNameRight: string = "pacman_right";
    @property({ tooltip: "Nama clip animasi menghadap KIRI" })
    public clipNameLeft: string = "pacman_left";
    @property({ tooltip: "Nama clip animasi menghadap ATAS" })
    public clipNameUp: string = "pacman_up";
    @property({ tooltip: "Nama clip animasi menghadap BAWAH" })
    public clipNameDown: string = "pacman_down";

    // --- PROPERTI UI & NODE REFERENSI ---
    @property({ type: Node, tooltip: "Node Parent dari semua Hantu (Folder ghost)" })
    public ghostParent: Node = null;

    @property({ type: [Node], tooltip: "Masukkan ke-3 node gambar hati ke sini" })
    public heartIcons: Node[] = [];

    @property({ type: Node, tooltip: "Node Bingkai / Area Bermain" })
    public playAreaNode: Node = null;

    @property({ type: Node, tooltip: "Node Parent dari semua Makanan (Folder foods)" })
    public foodParent: Node = null;

    @property({ type: Label, tooltip: "Label teks untuk menampilkan skor" })
    public scoreLabel: Label = null;

    // --- PROPERTI AI & AUTO-PILOT ---
    @property({ tooltip: "Aktifkan mode Bot AI Auto-Pilot" })
    public isAutoPilot: boolean = false;

    @property({ tooltip: "Radius bahaya dari hantu" })
    public dangerRadius: number = 250;

    @property({ tooltip: "Radius deteksi makanan" })
    public foodDetectionRadius: number = 500;

    // --- STATUS PEMAIN ---
    public score: number = 0;
    public health: number = 3;
    
    private isInvulnerable: boolean = false;
    private invulnerableTimer: number = 0;
    private readonly INVULNERABLE_DURATION: number = 2.0; // Masa kebal 2 detik setelah kena hit

    private animationComponent: Animation; 
    private moveDirection: Vec3 = new Vec3(0, 0, 0);
    private currentFacing: PacmanDirection = PacmanDirection.RIGHT; 
    private nodeImage: Node; 

    private minX: number = 0; private maxX: number = 0;
    private minY: number = 0; private maxY: number = 0;

    start() {
        this.nodeImage = this.node.getChildByPath("image_pacman");
        if (this.nodeImage) {
            this.animationComponent = this.nodeImage.getComponent(Animation);
        }

        this.calculateScreenBounds();

        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    private calculateScreenBounds() {
        let areaWidth = 1280; 
        let areaHeight = 720;

        if (this.playAreaNode) {
            let areaTransform = this.playAreaNode.getComponent(UITransform);
            if (areaTransform) {
                areaWidth = areaTransform.width; 
                areaHeight = areaTransform.height;
            }
        }

        let uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform && this.nodeImage) uiTransform = this.nodeImage.getComponent(UITransform);

        let pacmanWidth = uiTransform ? uiTransform.width : 50; 
        let pacmanHeight = uiTransform ? uiTransform.height : 50;

        this.minX = -(areaWidth / 2) + (pacmanWidth / 2);
        this.maxX = (areaWidth / 2) - (pacmanWidth / 2);
        this.minY = -(areaHeight / 2) + (pacmanHeight / 2);
        this.maxY = (areaHeight / 2) - (pacmanHeight / 2);
    }

    /**
     * Fungsi untuk dihubungkan dengan Button UI
     */
    public toggleAutoPilot() {
        this.isAutoPilot = !this.isAutoPilot;
        if (this.isAutoPilot && !Pacman.GAME_UDAH_MULAI) {
            Pacman.GAME_UDAH_MULAI = true;
        }
        console.log("Auto-Pilot: " + (this.isAutoPilot ? "ON" : "OFF"));
    }

    onKeyDown(event: EventKeyboard) {
        if (!Pacman.GAME_UDAH_MULAI) {
            Pacman.GAME_UDAH_MULAI = true;
            console.log("GAME DIMULAI! Pacman mulai bergerak.");
        }

        switch(event.keyCode) {
            case KeyCode.KEY_W: case KeyCode.ARROW_UP: this.moveDirection.y = 1; break;
            case KeyCode.KEY_S: case KeyCode.ARROW_DOWN: this.moveDirection.y = -1; break;
            case KeyCode.KEY_A: case KeyCode.ARROW_LEFT: this.moveDirection.x = -1; break;
            case KeyCode.KEY_D: case KeyCode.ARROW_RIGHT: this.moveDirection.x = 1; break;
        }
    }

    onKeyUp(event: EventKeyboard) {
        switch(event.keyCode) {
            case KeyCode.KEY_W: case KeyCode.ARROW_UP: if (this.moveDirection.y > 0) this.moveDirection.y = 0; break;
            case KeyCode.KEY_S: case KeyCode.ARROW_DOWN: if (this.moveDirection.y < 0) this.moveDirection.y = 0; break;
            case KeyCode.KEY_A: case KeyCode.ARROW_LEFT: if (this.moveDirection.x < 0) this.moveDirection.x = 0; break;
            case KeyCode.KEY_D: case KeyCode.ARROW_RIGHT: if (this.moveDirection.x > 0) this.moveDirection.x = 0; break;
        }
    }

    update(deltaTime: number) {
        if(!Pacman.GAME_UDAH_MULAI) return;

        // --- Logika Kebal & Kedap-Kedip ---
        if (this.isInvulnerable) {
            this.invulnerableTimer += deltaTime;
            if (this.invulnerableTimer >= this.INVULNERABLE_DURATION) {
                this.isInvulnerable = false; 
                if (this.nodeImage) this.nodeImage.active = true; 
            } else {
                if (this.nodeImage) {
                    this.nodeImage.active = Math.floor(this.invulnerableTimer * 10) % 2 === 0;
                }
            }
        } else {
            this.checkCollision(); 
        }

        this.checkFoodCollision();

        if (this.isAutoPilot) {
            this.runAutoPilot();
        }
        
        let newFacing = this.determineFacing(this.moveDirection);
        if (newFacing !== PacmanDirection.IDLE && newFacing !== this.currentFacing) {
            this.updateAnimation(newFacing);
            this.currentFacing = newFacing; 
        }

        if (this.moveDirection.lengthSqr() > 0) {
            let dir = this.moveDirection.clone().normalize();
            let step = new Vec3();
            Vec3.multiplyScalar(step, dir, this.speed * deltaTime);
            let newPos = new Vec3();
            Vec3.add(newPos, this.node.position, step);

            // --- LOGIKA BATAS LAYAR (MANUAL VS AUTO) DENGAN ANTI-GETAR ---
            if (this.isAutoPilot) {
                // Saat Auto-Pilot: Memantul (Bounce) menggunakan Math.abs agar tegas merubah arah
                if (newPos.x <= this.minX) { 
                    newPos.x = this.minX; 
                    this.moveDirection.x = Math.abs(this.moveDirection.x); 
                } else if (newPos.x >= this.maxX) { 
                    newPos.x = this.maxX; 
                    this.moveDirection.x = -Math.abs(this.moveDirection.x); 
                }

                if (newPos.y <= this.minY) { 
                    newPos.y = this.minY; 
                    this.moveDirection.y = Math.abs(this.moveDirection.y); 
                } else if (newPos.y >= this.maxY) { 
                    newPos.y = this.maxY; 
                    this.moveDirection.y = -Math.abs(this.moveDirection.y); 
                }
            } else {
                // Saat Manual: Berhenti di tepi (Clamp)
                newPos.x = math.clamp(newPos.x, this.minX, this.maxX);
                newPos.y = math.clamp(newPos.y, this.minY, this.maxY);
            }

            this.node.position = newPos;
        }
    }

    private runAutoPilot() {
        let fleeVector = new Vec3(0, 0, 0);
        let ghostNear = false;

        // PRIORITAS 1: MENGHINDARI HANTU (FLEE)
        if (this.ghostParent) {
            for (let ghost of this.ghostParent.children) {
                if (!ghost.active) continue;

                let dist = Vec3.distance(this.node.worldPosition, ghost.worldPosition);
                if (dist < this.dangerRadius) {
                    ghostNear = true;
                    let escapeDir = new Vec3();
                    Vec3.subtract(escapeDir, this.node.worldPosition, ghost.worldPosition);
                    Vec3.add(fleeVector, fleeVector, escapeDir);
                }
            }
        }

        if (ghostNear) {
            this.moveDirection = fleeVector.normalize();
            return; 
        }

        // PRIORITAS 2: MENCARI MAKANAN (SEEK)
        let closestFood = this.findClosestFood();
        if (closestFood) {
            let targetDir = new Vec3();
            Vec3.subtract(targetDir, closestFood.worldPosition, this.node.worldPosition);
            targetDir.z = 0;
            this.moveDirection = targetDir.normalize();
        } else {
            // PRIORITAS 3: WANDER (JALAN BEBAS)
            if (this.moveDirection.lengthSqr() === 0) {
                let angle = Math.random() * Math.PI * 2;
                this.moveDirection.x = Math.cos(angle);
                this.moveDirection.y = Math.sin(angle);
                this.moveDirection.normalize();
            }
        }
    }

    private findClosestFood(): Node | null {
        if (!this.foodParent || this.foodParent.children.length === 0) return null;

        let closest: Node = null;
        let minBonusDist = Infinity;

        for (let food of this.foodParent.children) {
            if (!food.active) continue;

            let d = Vec3.distance(this.node.worldPosition, food.worldPosition);
            if (d < minBonusDist && d < this.foodDetectionRadius) {
                minBonusDist = d;
                closest = food;
            }
        }
        return closest;
    }

    private checkFoodCollision() {
        if (!this.foodParent) return;

        let allFoods = this.foodParent.children;
        for (let i = allFoods.length - 1; i >= 0; i--) {
            let food = allFoods[i];
            if (!food.active) continue;

            // Menggunakan worldPosition agar konsisten dengan AI
            let dist = Vec3.distance(this.node.worldPosition, food.worldPosition);
            if (dist < 30) {
                this.eatFood(food);
            }
        }
    }

    private eatFood(foodNode: Node) {
        let points = 0;
        switch (foodNode.name) {
            case "dot": points = 10; break;
            case "apple": points = 50; break;
            case "strawberry": points = 100; break;
            default: points = 10;
        }

        this.score += points;

        if (this.scoreLabel) {
            this.scoreLabel.string = "Score: " + this.score;
        }

        foodNode.destroy();
    }

    private checkCollision() {
        if (!this.ghostParent) return;

        let ghosts = this.ghostParent.children;
        for (let i = 0; i < ghosts.length; i++) {
            let ghost = ghosts[i];
            
            // Menggunakan worldPosition agar tabrakan akurat meskipun beda parent
            let dist = Vec3.distance(this.node.worldPosition, ghost.worldPosition);
            
            if (dist < 40) {
                this.takeDamage();
                break; 
            }
        }
    }

    private takeDamage() {
        this.health--;
        console.log("Kena Hit! Nyawa tersisa: " + this.health);

        if (this.health >= 0 && this.health < this.heartIcons.length) {
            let heartSprite = this.heartIcons[this.health].getComponent(Sprite);
            if (heartSprite) {
                heartSprite.grayscale = true;
            }
        }

        if (this.health <= 0) {
            Pacman.GAME_UDAH_MULAI = false;
            console.log("==== GAME OVER ====");
            if (this.nodeImage) this.nodeImage.active = false; 
        } else {
            // Aktifkan mode kebal
            this.isInvulnerable = true;
            this.invulnerableTimer = 0;

            // KEMBALI KE POSISI AWAL (TENGAH) & RESET ARAH
            this.node.setPosition(new Vec3(0, 0, 0));
            this.moveDirection = new Vec3(0, 0, 0);
        }
    }

    private determineFacing(dir: Vec3): PacmanDirection {
        let absX = Math.abs(dir.x); let absY = Math.abs(dir.y);
        if (absX === 0 && absY === 0) return PacmanDirection.IDLE;
        if (absX > absY) return (dir.x > 0) ? PacmanDirection.RIGHT : PacmanDirection.LEFT;
        else if (absY > absX) return (dir.y > 0) ? PacmanDirection.UP : PacmanDirection.DOWN;
        return (dir.x > 0) ? PacmanDirection.RIGHT : PacmanDirection.LEFT;
    }

    private updateAnimation(direction: PacmanDirection) {
        if (!this.animationComponent) return;
        let clipToPlay: string = "";
        switch(direction) {
            case PacmanDirection.RIGHT: clipToPlay = this.clipNameRight; break;
            case PacmanDirection.LEFT:  clipToPlay = this.clipNameLeft; break;
            case PacmanDirection.UP:    clipToPlay = this.clipNameUp; break;
            case PacmanDirection.DOWN:  clipToPlay = this.clipNameDown; break;
        }
        if (clipToPlay !== "" && this.animationComponent.getState(clipToPlay)) {
            this.animationComponent.play(clipToPlay);
        }
    }
}