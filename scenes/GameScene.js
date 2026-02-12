import { levels } from "./levels.js";

export class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const { width, height } = this.scale;

        let save = JSON.parse(localStorage.getItem("cuteSave"));
        let currentLevel = save.currentLevel;
        let config = levels[currentLevel - 1];

        let itemCount = config.itemCount;
        let timeLimit = config.timeLimit;

        let placed = 0;
        let startTime = Date.now();

        // 背景标题
        this.add.text(width/2, 40, "第 " + currentLevel + " 关", {
            fontSize: "24px",
            color: "#FF69B4"
        }).setOrigin(0.5);

        // 时间显示
        let timerText = this.add.text(width - 20, 40, "", {
            fontSize: "18px",
            color: "#FF1493"
        }).setOrigin(1, 0.5);

        // 播放背景音乐
        if (!this.sound.get("bgm")) {
            let bgm = this.sound.add("bgm", { loop: true, volume: 0.3 });
            bgm.play();
        }

        // 目标区域
        let target = this.add.rectangle(width/2, height - 150, 260, 120, 0xFFB6C1);
        target.setStrokeStyle(4, 0xFF69B4);

        // 生成多个物品
        for (let i = 0; i < itemCount; i++) {

            let x = Phaser.Math.Between(60, width - 60);
            let y = Phaser.Math.Between(150, height - 300);

            let item = this.add.image(x, y, "box");
            item.setTint(Phaser.Display.Color.RandomRGB().color);
            item.setInteractive({ draggable: true });
            item.setScale(0.8);

            this.input.setDraggable(item);

            this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
                gameObject.x = dragX;
                gameObject.y = dragY;
            });

            this.input.on("dragend", (pointer, gameObject) => {

                if (Phaser.Geom.Rectangle.Contains(target.getBounds(), gameObject.x, gameObject.y)) {

                    this.sound.play("success");

                    gameObject.disableInteractive();
                    gameObject.x = width/2;
                    gameObject.y = height - 150 + Phaser.Math.Between(-30, 30);

                    placed++;

                    if (placed >= itemCount) {

                        let timeUsed = Math.floor((Date.now() - startTime) / 1000);

                        save.currentLevel++;
                        localStorage.setItem("cuteSave", JSON.stringify(save));

                        this.time.delayedCall(800, () => {
                            this.scene.restart();
                        });
                    }

                } else {
                    this.sound.play("fail");
                }

            });
        }

        // 时间限制逻辑
        if (timeLimit > 0) {

            this.time.addEvent({
                delay: 1000,
                loop: true,
                callback: () => {

                    let timeUsed = Math.floor((Date.now() - startTime) / 1000);
                    let left = timeLimit - timeUsed;

                    timerText.setText("剩余: " + left);

                    if (left <= 0) {
                        this.sound.play("fail");
                        this.scene.restart();
                    }
                }
            });
        }
    }
}
