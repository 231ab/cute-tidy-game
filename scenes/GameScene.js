import { levels } from "./levels.js";

export class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const { width, height } = this.scale;

        // ===== 存档 =====
        let save = JSON.parse(localStorage.getItem("cuteSave"));
        if (!save) {
            save = { currentLevel: 1, tutorialShown: false };
            localStorage.setItem("cuteSave", JSON.stringify(save));
        }

        let levelIndex = save.currentLevel - 1;
        if (levelIndex >= levels.length) levelIndex = 0;

        const config = levels[levelIndex];

        let placed = 0;
        let targetCount = 0;
        let timeLeft = config.timeLimit;

        const ruleType = config.ruleType;
        const ruleValue = config.ruleValue;

        // ===== 背景 =====
        this.add.rectangle(width/2, height/2, width, height, 0xfff6fb);

        const uiDepth = 1000;

        // ===== 标题 =====
        this.add.text(width/2, 40,
            "第 " + config.level + " 关",
            { fontSize: "26px", color: "#ff69b4" }
        ).setOrigin(0.5).setDepth(uiDepth);

        // ===== 规则UI =====
        let ruleLabel = ruleType === "color" ? "🎨 颜色分类" : "🧸 类型分类";

        this.add.rectangle(width/2, 90, 260, 50, 0xffffff)
            .setStrokeStyle(3, 0xffb6c1)
            .setDepth(uiDepth - 1);

        this.add.text(width/2, 90,
            ruleLabel + "：" + ruleValue,
            { fontSize: "20px", color: "#555" }
        ).setOrigin(0.5).setDepth(uiDepth);

        // ===== 倒计时 =====
        const timerText = this.add.text(width - 20, 40,
            timeLeft > 0 ? "⏳ " + timeLeft : "∞",
            { fontSize: "20px", color: "#ff4d4d" }
        ).setOrigin(1, 0.5).setDepth(uiDepth);

        if (timeLeft > 0) {
            this.time.addEvent({
                delay: 1000,
                loop: true,
                callback: () => {
                    timeLeft--;
                    timerText.setText("⏳ " + timeLeft);
                    if (timeLeft <= 0) this.scene.restart();
                }
            });
        }

        // ===== 重开按钮 =====
        const restartBtn = this.add.rectangle(
            width - 50, 90, 90, 36, 0xff69b4
        ).setInteractive().setDepth(uiDepth);

        this.add.text(width - 50, 90, "重开",
            { fontSize: "18px", color: "#fff" }
        ).setOrigin(0.5).setDepth(uiDepth + 1);

        restartBtn.on("pointerdown", () => {
            this.scene.restart();
        });

        // ===== 收纳盒 =====
        const target = this.add.rectangle(
            width/2, height - 120,
            240, 120,
            0xffffff
        ).setStrokeStyle(4, 0xff69b4);

        this.add.text(width/2, height - 120,
            "放这里 💕",
            { fontSize: "20px", color: "#ff69b4" }
        ).setOrigin(0.5);

        // ===== 生成物品 =====
        const types = ["toy", "food", "clothes"];
        const colors = ["pink", "blue", "yellow"];

        let items = [];

        for (let i = 0; i < config.itemCount; i++) {

            let type = types[Phaser.Math.Between(0, 2)];
            let color = colors[Phaser.Math.Between(0, 2)];

            if ((ruleType === "color" && color === ruleValue) ||
                (ruleType === "type" && type === ruleValue)) {
                targetCount++;
            }

            let x = Phaser.Math.Between(80, width - 80);
            let y = Phaser.Math.Between(150, height - 300);

            let item = this.createCuteItem(x, y, type, color);
            item.itemType = type;
            item.itemColor = color;

            items.push(item);
        }

        // 防止无可放物品卡关
        if (targetCount === 0) {
            items[0].itemType = ruleValue;
            targetCount = 1;
        }

        // ===== 拖动监听（只注册一次）=====
        this.input.on("drag", (pointer, obj, dragX, dragY) => {
            obj.x = dragX;
            obj.y = dragY;
        });

        this.input.on("dragend", (pointer, obj) => {

            if (!obj.itemType) return;

            let correct = ruleType === "color"
                ? obj.itemColor === ruleValue
                : obj.itemType === ruleValue;

            let inBox = Phaser.Geom.Rectangle.Contains(
                target.getBounds(),
                obj.x,
                obj.y
            );

            if (inBox && correct) {

                obj.disableInteractive();
                placed++;

                this.tweens.add({
                    targets: obj,
                    scale: 0.5,
                    alpha: 0,
                    duration: 300
                });

                if (placed >= targetCount) {
                    this.showNextPopup(save);
                }

            } else {

                obj.x = Phaser.Math.Between(80, width - 80);
                obj.y = Phaser.Math.Between(150, height - 300);
            }
        });
// ===== 教学 =====
        if (!save.tutorialShown) {

            const overlay = this.add.rectangle(
                width/2, height/2,
                width, height,
                0x000000, 0.6
            ).setDepth(5000);

            const box = this.add.rectangle(
                width/2, height/2,
                300, 200,
                0xffffff
            ).setDepth(5001);

            const tip = this.add.text(
                width/2, height/2,
                "拖动符合规则的物品\n放入下方区域即可过关\n\n点击关闭",
                { fontSize: "18px", color: "#ff69b4", align: "center" }
            ).setOrigin(0.5).setDepth(5002);

            overlay.setInteractive();
            overlay.on("pointerdown", () => {
                overlay.destroy();
                box.destroy();
                tip.destroy();
            });

            save.tutorialShown = true;
            localStorage.setItem("cuteSave", JSON.stringify(save));
        }
    }

    // ===== 可区分类型的可爱物品 =====
    createCuteItem(x, y, type, color) {

        const container = this.add.container(x, y);
        const g = this.add.graphics();

        const colorMap = {
            pink: 0xffa6c9,
            blue: 0xa6d8ff,
            yellow: 0xfff3a6
        };

        const fillColor = colorMap[color];

        // 白底
        g.fillStyle(0xffffff, 1);
        g.fillCircle(0, 0, 42);

        // 彩色边
        g.lineStyle(4, fillColor);
        g.strokeCircle(0, 0, 42);

        g.fillStyle(fillColor, 1);

        if (type === "toy") {
            g.fillCircle(0, 5, 22);
            g.fillCircle(-18, -12, 10);
            g.fillCircle(18, -12, 10);
        }
        else if (type === "food") {
            g.fillRoundedRect(-22, -5, 44, 25, 8);
            g.fillCircle(0, -20, 15);
        }
        else if (type === "clothes") {
            g.fillTriangle(-25, -10, 25, -10, 0, 30);
            g.fillRect(-15, -25, 30, 15);
        }

        container.add(g);

        container.setSize(90, 90);
        container.setInteractive({ draggable: true });
        this.input.setDraggable(container);

        this.tweens.add({
            targets: container,
            scale: 1.06,
            duration: 900,
            yoyo: true,
            repeat: -1
        });

        return container;
    }

    // ===== 下一关弹窗 =====
    showNextPopup(save) {

        const { width, height } = this.scale;

        const overlay = this.add.rectangle(
            width/2, height/2,
            width, height,
            0x000000, 0.5
        ).setDepth(4000);

        const box = this.add.rectangle(
            width/2, height/2,
            280, 180,
            0xffffff
        ).setStrokeStyle(4, 0xff69b4)
         .setDepth(4001)
         .setScale(0);

        this.tweens.add({
            targets: box,
            scale: 1,
            duration: 300,
            ease: "Back.Out"
        });

        this.add.text(width/2, height/2 - 30,
            "✨ 太棒啦！",
            { fontSize: "24px", color: "#ff69b4" }
        ).setOrigin(0.5).setDepth(4002);

        this.add.text(width/2, height/2 + 20,
            "进入下一关...",
            { fontSize: "18px", color: "#666" }
        ).setOrigin(0.5).setDepth(4002);

        save.currentLevel++;
        localStorage.setItem("cuteSave", JSON.stringify(save));

        this.time.delayedCall(1200, () => {
            this.scene.restart();
        });
    }
}
