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

    
