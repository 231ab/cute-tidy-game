import { levels } from "./levels.js";

export class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const { width, height } = this.scale;

        // ==============================
        // 🌈 渐变背景（不会单调）
        // ==============================
        const bg = this.add.graphics();
        bg.fillGradientStyle(
            0xFFF0F5, 0xFFE4F2,
            0xFFF8DC, 0xFFE4E1
        );
        bg.fillRect(0, 0, width, height);

        // ==============================
        // 💾 读取存档
        // ==============================
        let save = JSON.parse(localStorage.getItem("cuteSave"));
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

        // ==============================
        // 🎀 标题
        // ==============================
        this.add.text(width/2, 50, "🌸 第 " + currentLevel + " 关 🌸", {
            fontSize: "26px",
            fontStyle: "bold",
            color: "#FF69B4"
        }).setOrigin(0.5);

        // 计时
        let timerText = this.add.text(width - 20, 50, "", {
            fontSize: "18px",
            color: "#FF1493"
        }).setOrigin(1, 0.5);

        // ==============================
        // 🎯 目标区域（可爱风格）
        // ==============================
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

        // ==============================
        // 🎁 创建物品
        // ==============================
        let items = [];

        for (let i = 0; i < itemCount; i++) {

            let x = Phaser.Math.Between(60, width - 60);
            let y = Phaser.Math.Between(150, height - 320);

            let item = this.add.image(x, y, "box");
            item.setTint(Phaser.Display.Color.RandomRGB().color);
            item.setInteractive({ draggable: true });
            item.setScale(0.8);

            this.input.setDraggable(item);
            items.push(item);
        }

        // ==============================
        // 🖐 拖动中
        // ==============================
        this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
            gameObject.setScale(0.9); // 拖动放大
        });

        // ==============================
        // 🧲 拖动结束
        // ==============================
        this.input.on("dragend", (pointer, gameObject) => {

            if (!gameObject.input.enabled) return;

            gameObject.setScale(0.8);

            if (Phaser.Geom.Rectangle.Contains(target.getBounds(), gameObject.x, gameObject.y)) {

                // =====================
                // ✅ 成功效果
                // =====================

                gameObject.disableInteractive();

                this.tweens.add({
                    targets: gameObject,
                    x: width/2,
                    y: height - 160 + Phaser.Math.Between(-30, 30),
                    duration: 300,
                    ease: "Back.out"
                });

                // ✨ 粒子特效
                let particles = this.add.particles(0, 0, "box", {
                    speed: { min: 50, max: 120 },
                    scale: { start: 0.3, end: 0 },
                    lifespan: 500,
                    quantity: 10
                });

                particles.explode(15, gameObject.x, gameObject.y);

                placed++;

                if (placed >= itemCount) {

                    save.currentLevel++;
                    localStorage.setItem("cuteSave", JSON.stringify(save));

                    this.showWinPopup(width, height);
                }

            } else {

                // =====================
                // ❌ 放错反馈（抖动）
                // =====================
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

   
