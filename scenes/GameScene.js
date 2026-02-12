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
            save = {
                currentLevel: 1
            };
            localStorage.setItem("cuteSave", JSON.stringify(save));
        }

        let currentLevel = save.currentLevel;

        // 防止超出关卡范围
        if (currentLevel > levels.length) {
            currentLevel = 1;
            save.currentLevel = 1;
            localStorage.setItem("cuteSave", JSON.stringify(save));
        }

        let config = levels[currentLevel - 1];

        // 再次安全判断
        if (!config) {
            console.warn("关卡不存在，重置");
            this.scene.restart();
            return;
        }

        let itemCount = config.itemCount;
        let timeLimit = config.timeLimit;

        let placed = 0;
        let startTime = Date.now();

        // ===== 标题 =====
        this.add.text(width/2, 40, "第 " + currentLevel + " 关", {
            fontSize: "24px",
            color: "#FF69B4"
        }).setOrigin(0.5);

        // ===== 规则显示 =====
        let ruleText = "";

        if (config.ruleType === "color") {
            ruleText = "请整理颜色为：" + config.ruleValue;
        } else {
            ruleText = "请整理类型为：" + config.ruleValue;
        }

        this.add.text(width/2, 80, ruleText, {
            fontSize: "18px",
            color: "#FF1493"
        }).setOrigin(0.5);

        // ===== 计时器 =====
        let timerText = this.add.text(width - 20, 40, "", {
            fontSize: "18px",
            color: "#FF1493"
        }).setOrigin(1, 0.5);

        // ===== 整理区域 =====
        let target = this.add.rectangle(width/2, height - 150, 260, 120, 0xFFD1DC);
        target.setStrokeStyle(4, 0xFF69B4);

        this.add.text(width/2, height - 150, "整理盒", {
            fontSize: "20px",
            color: "#ffffff"
        }).setOrigin(0.5);

        // ===== 创建物品 =====
        let items = [];

        const types = ["toy", "food", "clothes"];
        const colors = ["pink", "blue", "yellow"];

        for (let i = 0; i < itemCount; i++) {

            let x = Phaser.Math.Between(80, width - 80);
            let y = Phaser.Math.Between(150, height - 300);

            let type = types[Phaser.Math.Between(0, 2)];
            let color = colors[Phaser.Math.Between(0, 2)];

            let item = this.createCuteItem(x, y, type, color);

            item.itemType = type;
            item.itemColor = color;

            items.push(item);
        }

        // ===== 拖动 =====
        this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on("dragend", (pointer, gameObject) => {

            if (!gameObject.input || !gameObject.input.enabled) return;

            let correct = false;

            if (config.ruleType === "color") {
                correct = (gameObject.itemColor === config.ruleValue);
            } else if (config.ruleType === "type") {
                correct = (gameObject.itemType === config.ruleValue);
            }

            let inBox = Phaser.Geom.Rectangle.Contains(
                target.getBounds(),
                gameObject.x,
                gameObject.y
            );

            if (inBox && correct) {

                gameObject.disableInteractive();

                this.tweens.add({
                    targets: gameObject,
                    x: width/2,
                    y: height - 150 + Phaser.Math.Between(-30, 30),
                    scale: 0.6,
                    duration: 200
                });

                placed++;

                if (placed >= itemCount) {

                    save.currentLevel++;
                    localStorage.setItem("cuteSave", JSON.stringify(save));

                    this.time.delayedCall(800, () => {
                        this.scene.restart();
                    });
                }

            } else {

                // 错误回弹
                this.tweens.add({
                    targets: gameObject,
                    x: Phaser.Math.Between(80, width - 80),
                    y: Phaser.Math.Between(150, height - 300),
                    duration: 300
                });
            }
        });

        // ===== 时间限制 =====
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
// ===============================
    // ⭐ 可爱物品绘制函数
    // ===============================
    createCuteItem(x, y, type, color) {

        const container = this.add.container(x, y);
        const g = this.add.graphics();

        const colorMap = {
            pink: 0xffa6c9,
            blue: 0xa6d8ff,
            yellow: 0xfff3a6
        };

        const fillColor = colorMap[color] || 0xffc0cb;

        // ===== 玩具 =====
        if (type === "toy") {

            g.fillStyle(fillColor, 1);
            g.fillCircle(0, 0, 35);

            g.fillStyle(0x000000);
            g.fillCircle(-10, -5, 4);
            g.fillCircle(10, -5, 4);

            g.fillStyle(0xff7f7f);
            g.fillCircle(-18, 10, 5);
            g.fillCircle(18, 10, 5);
        }

        // ===== 食物 =====
        else if (type === "food") {

            g.fillStyle(fillColor, 1);
            g.fillRoundedRect(-35, -25, 70, 50, 12);

            g.fillStyle(0xffffff);
            g.fillCircle(0, -20, 10);

            g.fillStyle(0xff0000);
            g.fillCircle(0, -30, 6);
        }

        // ===== 衣服 =====
        else {

            g.fillStyle(fillColor, 1);
            g.fillRoundedRect(-40, -30, 80, 60, 15);

            g.fillStyle(0xffffff);
            g.fillCircle(0, -20, 8);
        }

        container.add(g);

        container.setSize(80, 80);
        container.setInteractive({ draggable: true });

        this.input.setDraggable(container);

        return container;
    }
}
    
