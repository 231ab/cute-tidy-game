export class BootScene extends Phaser.Scene {
    constructor() {
        super("BootScene");
    }

    preload() {
        this.load.image("box", "https://cdn.jsdelivr.net/gh/kenneyNL/shape-icons/PNG/White/shapeSquare.png");
    }

    create() {
        this.scene.start("MenuScene");
    }
}
