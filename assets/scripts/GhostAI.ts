import { _decorator, Component, Node, Vec3, Sprite, SpriteFrame, UITransform } from 'cc';
import { Pacman } from './Pacman'; // Import class Pacman
const { ccclass, property } = _decorator;

@ccclass('GhostAI')
export class GhostAI extends Component {

    @property({ type: SpriteFrame, tooltip: "Masukkan gambar hantu biru ke sini" })
    public scaredSprite: SpriteFrame = null;

    private sprite: Sprite = null;
    private normalSprite: SpriteFrame = null; // Untuk menyimpan gambar asli hantu
    private initialPosition: Vec3 = new Vec3();

    @property({ tooltip: "Kecepatan gerak hantu" })
    public speed: number = 150;

    @property({ type: Node, tooltip: "Node Bingkai / Area Bermain" })
    public playAreaNode: Node = null;

    @property({ type: Node, tooltip: "Node Target (Pacman)" })
    public targetPacman: Node = null;

    @property({ tooltip: "Jarak pandang hantu untuk mulai mengejar" })
    public detectionRadius: number = 300;

    @property({ tooltip: "Berapa lama hantu mengejar (detik)" })
    public chaseDuration: number = 5.0;

    @property({ tooltip: "Cooldown sebelum bisa mengejar lagi (detik)" })
    public chaseCooldown: number = 6.0;

    private moveDirection: Vec3 = new Vec3(0, 0, 0);
    private minX: number = 0; private maxX: number = 0;
    private minY: number = 0; private maxY: number = 0;
    
    private chaseTimer: number = 5.0;
    private cooldownTimer: number = 6.0;
    private isChasing: boolean = false; 

    onLoad() {
        this.sprite = this.getComponent(Sprite) || this.node.getComponentInChildren(Sprite);
        if (this.sprite) {
            this.normalSprite = this.sprite.spriteFrame;
        }

        // Mencatat posisi awal hantu ini saat game baru di-play
        this.initialPosition.set(this.node.position); 
    }

    start() {
        this.calculateScreenBounds();
        this.pickRandomDirection();
    }

    // --- FIX 1: FUNGSI RESPAWN MENGGUNAKAN SETTIMEOUT ---
    public dieAndRespawn() {
        this.node.active = false; // Matikan hantu

        // Kita gunakan setTimeout bawaan JavaScript agar timer tetap berjalan
        // meskipun node hantu sedang dalam keadaan mati (inactive)
        setTimeout(() => {
            // Pengecekan isValid mencegah error jika game sudah di-close saat timer berjalan
            if (this.node && this.node.isValid) { 
                this.node.setPosition(this.initialPosition);
                this.node.active = true;
                console.log("Ghost telah respawn di markasnya!");
            }
        }, 3000); // 3000 milidetik = 3 detik
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
        let ghostWidth = uiTransform ? uiTransform.width : 50; 
        let ghostHeight = uiTransform ? uiTransform.height : 50;

        this.minX = -(areaWidth / 2) + (ghostWidth / 2);
        this.maxX = (areaWidth / 2) - (ghostWidth / 2);
        this.minY = -(areaHeight / 2) + (ghostHeight / 2);
        this.maxY = (areaHeight / 2) - (ghostHeight / 2);
    }

    private pickRandomDirection() {
        let angle = Math.random() * Math.PI * 2;
        this.moveDirection.x = Math.cos(angle);
        this.moveDirection.y = Math.sin(angle);
        this.moveDirection.normalize();
    }

    update(deltaTime: number) {
        if (!Pacman.GAME_UDAH_MULAI) return;
        if (!this.targetPacman) return;

        // --- FIX 2: DEKLARASI STATUS PACMAN CUKUP SATU KALI DI ATAS ---
        let pacmanScript = this.targetPacman.getComponent('Pacman') as any;
        let isPacmanEnergized = pacmanScript ? pacmanScript.isEnergized : false;

        // --- Logika Pergantian Sprite (Gambar) ---
        if (this.sprite) {
            if (isPacmanEnergized) {
                this.sprite.spriteFrame = this.scaredSprite;
            } else {
                this.sprite.spriteFrame = this.normalSprite;
            }
        }

        // --- LOGIKA MENGEJAR (SEEK & EVADE AI) ---
        if (this.targetPacman.active) {
            let ghostWorldPos = this.node.worldPosition;
            let pacmanWorldPos = this.targetPacman.worldPosition;
            let dist = Vec3.distance(ghostWorldPos, pacmanWorldPos);

            if(this.cooldownTimer > 0) {
                this.cooldownTimer -= deltaTime;
            }

            if (!this.isChasing && dist < this.detectionRadius && this.cooldownTimer <= 0) {
                this.isChasing = true;
                this.chaseTimer = this.chaseDuration;
            }

            if (this.isChasing) {
                this.chaseTimer -= deltaTime;
                
                if (isPacmanEnergized) {
                    // STATE: EVADE (KABUR)
                    Vec3.subtract(this.moveDirection, ghostWorldPos, pacmanWorldPos);
                } else {
                    // STATE: CHASE (MENGEJAR)
                    Vec3.subtract(this.moveDirection, pacmanWorldPos, ghostWorldPos);
                }

                this.moveDirection.z = 0; 
                this.moveDirection.normalize(); 
                
                if (this.chaseTimer <= 0) {
                    this.isChasing = false;
                    this.cooldownTimer = this.chaseCooldown;
                    this.pickRandomDirection();
                }

                if (dist > this.detectionRadius) {
                    this.isChasing = false;
                    this.cooldownTimer = this.chaseCooldown;
                    this.pickRandomDirection();
                }

            }
        }

        // 1. Hitung langkah selanjutnya
        let step = new Vec3();
        Vec3.multiplyScalar(step, this.moveDirection, this.speed * deltaTime);
        let newPos = new Vec3();
        Vec3.add(newPos, this.node.position, step);

        // 2. Logika Memantul (Bouncing)
        if (newPos.x <= this.minX) {
            newPos.x = this.minX; this.moveDirection.x *= -1;
        } else if (newPos.x >= this.maxX) {
            newPos.x = this.maxX; this.moveDirection.x *= -1;
        }

        if (newPos.y <= this.minY) {
            newPos.y = this.minY; this.moveDirection.y *= -1;
        } else if (newPos.y >= this.maxY) {
            newPos.y = this.maxY; this.moveDirection.y *= -1;
        }

        // 3. Terapkan posisi baru
        this.node.position = newPos;
    }

    public resetToInitialPosition() {
        this.node.active = true;
        this.node.setPosition(this.initialPosition);
        this.isChasing = false;
        this.cooldownTimer = 0;
        this.pickRandomDirection();
    }
}