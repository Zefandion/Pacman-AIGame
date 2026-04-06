import { _decorator, Component, Node, Vec3, UITransform } from 'cc';
import { Pacman } from './Pacman'; // Import class Pacman
const { ccclass, property } = _decorator;

@ccclass('GhostAI')
export class GhostAI extends Component {

    @property({ tooltip: "Kecepatan gerak hantu" })
    public speed: number = 150;

    @property({ type: Node, tooltip: "Node Bingkai / Area Bermain" })
    public playAreaNode: Node = null;

    // --- BARU: PROPERTI UNTUK MENGEJAR PACMAN ---
    @property({ type: Node, tooltip: "Node Target (Pacman)" })
    public targetPacman: Node = null;

    @property({ tooltip: "Jarak pandang hantu untuk mulai mengejar" })
    public detectionRadius: number = 300;
    // --------------------------------------------

    private moveDirection: Vec3 = new Vec3(0, 0, 0);
    private minX: number = 0; private maxX: number = 0;
    private minY: number = 0; private maxY: number = 0;
    
    private isChasing: boolean = false; // Status apakah sedang mengejar

    start() {
        this.calculateScreenBounds();
        this.pickRandomDirection();
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
        // Jangan bergerak jika game belum dimulai
        if (!Pacman.GAME_UDAH_MULAI) return;

        // --- BARU: LOGIKA MENGEJAR (SEEK AI) ---
        if (this.targetPacman && this.targetPacman.active) {
            // Hitung jarak antara hantu dan Pacman
            let dist = Vec3.distance(this.node.position, this.targetPacman.position);

            if (dist < this.detectionRadius) {
                // Pacman terdeteksi! Ubah arah menuju Pacman
                this.isChasing = true;
                
                // Vektor arah = Posisi Tujuan - Posisi Asal
                Vec3.subtract(this.moveDirection, this.targetPacman.position, this.node.position);
                this.moveDirection.normalize(); // Selalu normalize agar kecepatannya tidak meledak
                
            } else if (this.isChasing) {
                // Pacman berhasil kabur dari radius deteksi!
                this.isChasing = false;
                this.pickRandomDirection(); // Kembali berjalan acak
            }
        }
        // ---------------------------------------

        // 1. Hitung langkah selanjutnya
        let step = new Vec3();
        Vec3.multiplyScalar(step, this.moveDirection, this.speed * deltaTime);
        let newPos = new Vec3();
        Vec3.add(newPos, this.node.position, step);

        // 2. Logika Memantul (Bouncing)
        // Tetap diaktifkan agar hantu tidak tembus tembok bingkai meskipun sedang mengejar
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
}