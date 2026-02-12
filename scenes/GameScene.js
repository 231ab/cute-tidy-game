import { levels } from "./levels.js";

export class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const { width, height } = this.scale;

        // ========= 背景 =========
        const bg = this.add.graphics();
        bg.fillGradientStyle(
            0xFFF0F5, 0xFFE4F2,
            0xFFF8DC, 0xFFE4E1
        );
        bg.fillRect(0, 0, width, height);

        // ========= 读取存档 =========
       // ==============================
// 💾 安全读取存档（防止白屏）
// ==============================

let save = JSON.parse(localStorage.getItem("cuteSave"));

// 如果没有存档（比如第一次进入、清缓存、无痕模式）
if (!save) {
    save = {
        currentLevel: 1
    };
    localStorage.setItem("cuteSave", JSON.stringify(save));
}

// 如果数据结构异常也修复
if (!save.currentLevel || save.currentLevel < 1) {
    save.currentLevel = 1;
    localStorage.setItem("cuteSave", JSON.stringify(save));
}

let currentLevel = save.currentLevel;

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

        // ========= 标题 =========
        this.add.text(width/2, 50, "🌸 第 " + currentLevel + " 关 🌸", {
            fontSize: "26px",
            fontStyle: "bold",
            color: "#FF69B4"
        }).setOrigin(0.5);

        let timerText = this.add.text(width - 20, 50, "", {
            fontSize: "18px",
            color: "#FF1493"
        }).setOrigin(1, 0.5);

        // ========= 目标区域 =========
        let target = this.add.rectangle(width/2, height - 160, 280, 130, 0xFFB6C1, 0.9);
        target.setStrokeStyle(5, 0xFF69B4);

        // 呼吸动画
        this.tweens.add({
            targets: target,
            scale: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // ========= 创建物品 =========
        for (let i = 0; i < itemCount; i++) {

            let x = Phaser.Math.Between(60, width - 60);
            let y = Phaser.Math.Between(150, height - 320);

            let item = this.add.image(x, y, "box");
            item.setTint(Phaser.Display.Color.RandomRGB().color);
            item.setInteractive({ draggable: true });
            item.setScale(0.8);

            this.input.setDraggable(item);
        }

        // ========= 拖动 =========
        this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
            gameObject.setScale(0.9);
        });

        this.input.on("dragend", (pointer, gameObject) => {

            if (!gameObject.input.enabled) return;

            gameObject.setScale(0.8);

            if (Phaser.Geom.Rectangle.Contains(target.getBounds(), gameObject.x, gameObject.y)) {

                gameObject.disableInteractive();

                this.tweens.add({
                    targets: gameObject,
                    x: width/2,
                    y: height - 160 + Phaser.Math.Between(-30, 30),
                    duration: 300,
                    ease: "Back.out"
                });

                placed++;

                if (placed >= itemCount) {

                    save.currentLevel++;
                    localStorage.setItem("cuteSave", JSON.stringify(save));

                    this.showWinPopup(width, height);
                }

            } else {

                this.tweens.add({
                    targets: gameObject,
                    x: gameObject.x + 10,
                    duration: 60,
                    yoyo: true,
                    repeat: 3,
                    onComplete: () => {
                        this.tweens.add({
                            targets: gameObject,
                            x: Phaser.Math.Between(60, width - 60),
                            y: Phaser.Math.Between(150, height - 320),
                            duration: 300
                        });
                    }
                });
            }
        });

        // ========= 时间系统 =========
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

    // ========= 过关弹窗 =========
    showWinPopup(width, height) {

        let panel = this.add.rectangle(width/2, height/2, 300, 200, 0xFFFFFF, 0.95);
        panel.setStrokeStyle(4, 0xFF69B4);

        this.add.text(width/2, height/2 - 40, "🎉 过关成功！", {
            fontSize: "24px",
            color: "#FF1493"
        }).setOrigin(0.5);

        let btn = this.add.text(width/2, height/2 + 40, "下一关 →", {
            fontSize: "20px",
            backgroundColor: "#FFB6C1",
            padding: { x: 20, y: 10 },
            color: "#FFFFFF"
        }).setOrigin(0.5).setInteractive();

        btn.on("pointerdown", () => {
    this.scene.restart();
        });
    }
}
