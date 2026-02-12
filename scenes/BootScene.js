export class BootScene extends Phaser.Scene {
    constructor() {
        super("BootScene");
    }

    preload() {
        // 加载简单图形代替素材
        this.load.image("box", "https://cdn.jsdelivr.net/gh/kenneyNL/shape-icons/PNG/White/shapeSquare.png");
    }

    create() {
        this.scene.start("MenuScene");
    }
}
