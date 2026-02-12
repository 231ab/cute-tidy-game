export class BootScene extends Phaser.Scene {
    constructor() {
        super("BootScene");
    }

    preload() {

        // 加载图形
        this.load.image("box", "https://cdn.jsdelivr.net/gh/kenneyNL/shape-icons/PNG/White/shapeSquare.png");

        // 音效（免费示例音频）
        this.load.audio("bgm", "https://cdn.pixabay.com/download/audio/2022/03/15/audio_6f0d8e3c07.mp3?filename=happy-day-113985.mp3");
        this.load.audio("success", "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=correct-2-46134.mp3");
        this.load.audio("fail", "https://cdn.pixabay.com/download/audio/2022/03/15/audio_52f7e7b0c9.mp3?filename=error-2-126514.mp3");
    }

    create() {
        this.scene.start("MenuScene");
    }
}
