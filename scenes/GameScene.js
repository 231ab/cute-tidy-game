import { levels } from "./levels.js";

export class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const { width, height } = this.scale;

        // ===== 渐变天空背景 =====
        const bg = this.add.graphics();
        bg.fillGradientStyle(0xfff0f6, 0xfff0f6, 0xd6f0ff, 0xd6f0ff, 1);
        bg.fillRect(0, 0, width, height);

        // ===== 读取存档 =====
        const save = JSON.parse(localStorage.getItem("cuteSave")) || {
            currentLevel: 1
        };

        let levelIndex = save.currentLevel - 1;
        if (levelIndex >= levels.length) levelIndex = 0;

        const config = levels[levelIndex];

        // ===== 顶部卡片栏 =====
        const topCard = this.add.rectangle(
            width / 2,
            90,
            width - 40,
            110,
            0xffffff
        ).setStrokeStyle(2, 0xffcce6);

        topCard.setDepth(1);

        this.add.text(width / 2, 55,
            "第 " + config.level + " 关",
            { fontSize: "26px", color: "#ff69b4" }
        ).setOrigin(0.5).setDepth(2);

        // ===== 规则 =====
        const types = ["🐻", "🍰", "👗", "🧁", "🎀"];
        const colors = [0xffb6c1, 0xadd8e6, 0xfff5ba, 0xd8bfd8];

        const ruleType = Phaser.Math.Between(0, 1) === 0 ? "color" : "type";
        const ruleValue = ruleType === "color"
            ? Phaser.Utils.Array.GetRandom(colors)
            : Phaser.Utils.Array.GetRandom(types);

        let ruleText = ruleType === "color"
            ? "整理这个颜色的物品"
            : "整理这个物品：" + ruleValue;

        this.add.text(width / 2, 100,
            ruleText,
            { fontSize: "20px", color: "#555" }
        ).setOrigin(0.5).setDepth(2);

        // ===== 倒计时 =====
        let timeLeft = config.timeLimit;

        const timerBg = this.add.rectangle(width - 60, 50, 80, 36, 0xffffff)
            .setStrokeStyle(2, 0xffb6c1);

        const timerText = this.add.text(width - 60, 50, "⏳ " + timeLeft,
            { fontSize: "18px", color: "#ff4d4d" }
        ).setOrigin(0.5);

        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                timeLeft--;
                timerText.setText("⏳ " + timeLeft);
                if (timeLeft <= 0) this.scene.restart();
            }
        });

        // ===== 收纳盒（立体风）=====
        const targetShadow = this.add.rectangle(
            width / 2,
            height - 145,
            240,
            130,
            0x000000,
            0.15
        );

        const target = this.add.rectangle(
            width / 2,
            height - 150,
            240,
            130,
            0xffffff
        ).setStrokeStyle(3, 0xffb6c1);

        this.add.text(width / 2, height - 150,
            "收纳盒",
            { fontSize: "22px", color: "#ff69b4" }
        ).setOrigin(0.5);

        // ===== 生成物品 =====
        let placed = 0;
        let targetCount = 0;

        for (let i = 0; i < config.itemCount; i++) {

            let x = Phaser.Math.Between(80, width - 80);
            let y = Phaser.Math.Between(180, height - 350);

            let color = Phaser.Utils.Array.GetRandom(colors);
            let type = Phaser.Utils.Array.GetRandom(types);

            if (i < 2) {
                if (ruleType === "color") color = ruleValue;
                else type = ruleValue;
            }

            if ((ruleType === "color" && color === ruleValue) ||
                (ruleType === "type" && type === ruleValue)) {
                targetCount++;
            }

            const circleShadow = this.add.circle(x + 4, y + 6, 46, 0x000000, 0.15);
            const circle = this.add.circle(x, y, 46, color)
                .setStrokeStyle(3, 0xffffff);

            const icon = this.add.text(x, y, type, {
                fontSize: "42px"
            }).setOrigin(0.5);

            const container = this.add.container(0, 0, [circleShadow, circle, icon]);
            container.setSize(90, 90);
            container.setInteractive();
            this.input.setDraggable(container);

            container.itemColor = color;
            container.itemType = type;

            // 呼吸动画
            this.tweens.add({
                targets: container,
                scale: 1.06,
                duration: 1000,
                yoyo: true,
                repeat: -1
            });

            this.input.on("drag", (pointer, obj, dragX, dragY) => {
                if (obj === container) {
                    obj.x = dragX;
                    obj.y = dragY;
                }
            });

            this.input.on("dragend", (pointer, obj) => {

                if (obj !== container) return;

                timeLeft = Math.max(0, timeLeft - 1);
                timerText.setText("⏳ " + timeLeft);

                let correct = false;

                 if (ruleType === "color") {
                    correct = obj.itemColor === ruleValue;
                } else {
                    correct = obj.itemType === ruleValue;
                }

                let inBox = Phaser.Geom.Rectangle.Contains(
                    target.getBounds(),
                    obj.x,
                    obj.y
                );

                if (inBox && correct) {

                    obj.disableInteractive();

                    this.tweens.add({
                        targets: obj,
                        x: width / 2,
                        y: height - 150 + Phaser.Math.Between(-30, 30),
                        scale: 0.6,
                        duration: 250,
                        ease: "Back.easeOut"
                    });

                    // ✨ 爱心粒子
                    for (let i = 0; i < 6; i++) {
                        let heart = this.add.text(
                            obj.x,
                            obj.y,
                            "💖",
                            { fontSize: "20px" }
                        );

                        this.tweens.add({
                            targets: heart,
                            y: heart.y - 60,
                            alpha: 0,
                            duration: 800,
                            onComplete: () => heart.destroy()
                        });
                    }

                    placed++;

                    if (placed >= targetCount) {

                        const nextText = this.add.text(
                            width / 2,
                            height / 2,
                            "✨ 即将进入下一关 ✨",
                            {
                                fontSize: "28px",
                                color: "#ff69b4"
                            }
                        ).setOrigin(0.5);

                        save.currentLevel++;
                        localStorage.setItem("cuteSave", JSON.stringify(save));

                        this.time.delayedCall(1200, () => {
                            this.scene.restart();
                        });
                    }

                } else {

                    this.tweens.add({
                        targets: obj,
                        x: Phaser.Math.Between(80, width - 80),
                        y: Phaser.Math.Between(180, height - 350),
                        duration: 300
                    });
                }
            });
        }

        // ===== 重开按钮（立体渐变）=====
        const restartBtn = this.add.rectangle(
            width - 60,
            100,
            100,
            40,
            0xffb6c1
        ).setStrokeStyle(2, 0xffffff)
         .setInteractive();

        const restartText = this.add.text(
            width - 60,
            100,
            "重开",
            { fontSize: "18px", color: "#ffffff" }
        ).setOrigin(0.5);

        restartBtn.on("pointerdown", () => {
            this.scene.restart();
        });
    }
}
                  
