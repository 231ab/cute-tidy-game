import { levels } from "./levels.js";

export class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const { width, height } = this.scale;

        let save = JSON.parse(localStorage.getItem("cuteSave"));
        let currentLevel = save.currentLevel;

        // 防止超过30关崩溃
        if (currentLevel > 30) {
            currentLevel = 1;
            save.currentLevel = 1;
            localStorage.setItem("cuteSave", JSON.stringify(save));
        }

        let config = levels[currentLevel - 1];

        let itemCount = config.itemCount;
        let timeLimit = config.timeLimit;

        let placed = 0;
        let startTime = Date.now();

        this.add.text(width/2, 40, "第 " + currentLevel + " 关", {
            fontSize: "24px",
            color: "#FF69B4"
        }).setOrigin(0.5);

        let timerText = this.add.text(width - 20, 40, "", {
            fontSize: "18px",
            color: "#FF1493"
        }).setOrigin(1, 0.5);

        // 目标区域
        let target = this.add.rectangle(width/2, height - 150, 260, 120, 0xFFB6C1);
        target.setStrokeStyle(4, 0xFF69B4);

        // 创建物品数组
        let items = [];

        for (let i = 0; i < itemCount; i++) {

            let x = Phaser.Math.Between(60, width - 60);
            let y = Phaser.Math.Between(150, height - 300);

            let item = this.add.image(x, y, "box");
            item.setTint(Phaser.Display.Color.RandomRGB().color);
            item.setInteractive({ draggable: true });
            item.setScale(0.8);

            this.input.setDraggable(item);

            items.push(item);
        }

        // ⭐ 监听器只注册一次 ⭐

        this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on("dragend", (pointer, gameObject) => {

            if (!gameObject.input.enabled) return;

            if (Phaser.Geom.Rectangle.Contains(target.getBounds(), gameObject.x, gameObject.y)) {

                gameObject.disableInteractive();
                gameObject.x = width/2;
                gameObject.y = height - 150 + Phaser.Math.Between(-30, 30);

                placed++;

                if (placed >= itemCount) {

                    save.currentLevel++;
                    localStorage.setItem("cuteSave", JSON.stringify(save));

                    this.time.delayedCall(800, () => {
                        this.scene.restart();
                    });
                }

            } else {
                // 放错回弹
                this.tweens.add({
                    targets: gameObject,
                    x: Phaser.Math.Between(60, width - 60),
                    y: Phaser.Math.Between(150, height - 300),
                    duration: 300
                });
            }

        });

        // 时间限制
        if (timeLimit > 0) {

            this.time.addEvent({
                delay: 1000,
                loop: true,
                callback: () => {

                    let timeUsed = Math.floor((Date.now() - startTime) / 1000);
                    let left = timeLimit - timeUsed;

                    timerText.setText("剩余: " + left);

                    if (left <= 0) {
                        this.scene.restart();
                    }
                }
            });
        }
    }
}
