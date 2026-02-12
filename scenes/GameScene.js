import { levels } from "./levels.js";

export class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const { width, height } = this.scale;

        // ===== 读取存档 =====
        let save = JSON.parse(localStorage.getItem("cuteSave"));
        if (!save) {
            save = { currentLevel: 1, tutorialShown: false };
            localStorage.setItem("cuteSave", JSON.stringify(save));
        }

        let levelIndex = save.currentLevel - 1;
        if (levelIndex >= levels.length) levelIndex = 0;

        const config = levels[levelIndex];

        let ruleType = config.ruleType;
        let ruleValue = config.ruleValue;

        let placed = 0;
        let targetCount = 0;
        let timeLeft = config.timeLimit;

        // ===== 背景 =====
        this.add.rectangle(width/2, height/2, width, height, 0xfff6fb);

        // ===== UI 层 =====
        const uiDepth = 1000;

        this.add.text(width/2, 40,
            "第 " + config.level + " 关",
            { fontSize: "26px", color: "#ff69b4" }
        ).setOrigin(0.5).setDepth(uiDepth);

        const ruleText = ruleType === "color"
            ? "整理颜色：" + ruleValue
            : "整理类型：" + ruleValue;

        this.add.text(width/2, 90,
            ruleText,
            { fontSize: "20px", color: "#555" }
        ).setOrigin(0.5).setDepth(uiDepth);

        // ===== 倒计时 =====
        const timerText = this.add.text(width - 20, 40,
            "⏳ " + timeLeft,
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
        ).setStrokeStyle(3, 0xffb6c1);

        this.add.text(width/2, height - 120,
            "收纳盒",
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

            let item = this.createItem(x, y, type, color);
            item.itemType = type;
            item.itemColor = color;

            items.push(item);
        }

        // 如果没有符合规则的，强制一个
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
                placed++;

                if (placed >= targetCount) {

                    save.currentLevel++;
                    localStorage.setItem("cuteSave", JSON.stringify(save));

                    this.time.delayedCall(800, () => {
                        this.scene.restart();
                    });
                }

            } else {

                obj.x = Phaser.Math.Between(80, width - 80);
                obj.y = Phaser.Math.Between(150, height - 300);
            }
        });

        //// ===== 教学提示 =====
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
                "拖动符合规则的物品\n放入收纳盒即可过关\n\n点击关闭",
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

    createItem(x, y, type, color) {

        const container = this.add.container(x, y);
        const g = this.add.graphics();

        const colorMap = {
            pink: 0xffa6c9,
            blue: 0xa6d8ff,
            yellow: 0xfff3a6
        };

        g.fillStyle(colorMap[color], 1);
        g.fillCircle(0, 0, 35);

        container.add(g);
        container.setSize(70, 70);
        container.setInteractive({ draggable: true });
        this.input.setDraggable(container);

        return container;
    }
}
   
