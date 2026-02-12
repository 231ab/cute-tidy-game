import { levels } from "./levels.js";

export class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const { width, height } = this.scale;
        this.width = width;
        this.height = height;

        // ===== 初始化存档 =====
        this.initSave();

        // ===== 当前关卡配置 =====
        this.config = levels[this.currentLevel - 1];

        // ===== 初始化变量 =====
        this.placed = 0;
        this.targetCount = 3;

        // ===== 初始化UI =====
        this.initUI();

        // ===== 初始化物品 =====
        this.initItems();

        // ===== 初始化拖拽系统 =====
        this.initDrag();

        // ===== 初始化时间系统 =====
        this.initTimer();

        // ===== 教学 =====
        if (!this.save.tutorialShown) {
            this.showTutorial();
        }
    }

    // ===============================
    // 存档系统
    // ===============================
    initSave() {

        this.save = JSON.parse(localStorage.getItem("cuteSave"));

        if (!this.save) {
            this.save = {
                currentLevel: 1,
                tutorialShown: false
            };
            localStorage.setItem("cuteSave", JSON.stringify(this.save));
        }

        this.currentLevel = this.save.currentLevel;

        if (this.currentLevel > levels.length) {
            this.currentLevel = 1;
            this.save.currentLevel = 1;
            localStorage.setItem("cuteSave", JSON.stringify(this.save));
        }
    }

    // ===============================
    // UI系统
    // ===============================
    initUI() {

        const { width, height } = this;

        this.add.text(width/2, 40, "第 " + this.currentLevel + " 关", {
            fontSize: "24px",
            color: "#FF69B4"
        }).setOrigin(0.5);

        // 规则
        let ruleText = this.config.ruleType === "color"
            ? "整理颜色：" + this.config.ruleValue
            : "整理类型：" + this.config.ruleValue;

        this.add.text(width/2, 110, ruleText, {
            fontSize: "18px",
            color: "#FF1493"
        }).setOrigin(0.5);

        // 整理盒
        this.target = this.add.rectangle(width/2, height - 150, 260, 120, 0xFFD1DC);
        this.target.setStrokeStyle(4, 0xFF69B4);

        this.add.text(width/2, height - 150, "整理盒", {
            fontSize: "20px",
            color: "#ffffff"
        }).setOrigin(0.5);

        // 重开按钮
        let restartBg = this.add.circle(width - 35, 35, 25, 0xFF69B4)
            .setDepth(2000)
            .setInteractive();

        let restartText = this.add.text(width - 35, 35, "↺", {
            fontSize: "22px",
            color: "#ffffff"
        })
        .setOrigin(0.5)
        .setDepth(2001);

        restartBg.on("pointerdown", () => {
            this.scene.restart();
        });

        // 计时文字
        this.timerText = this.add.text(width - 20, 70, "", {
            fontSize: "20px",
            color: "#FF1493"
        })
        .setOrigin(1, 0.5)
        .setDepth(1500);
    }

    // ===============================
    // 物品生成
    // ===============================
    initItems() {

        const types = ["toy", "food", "clothes"];
        const colors = ["pink", "blue", "yellow"];

        this.items = [];

        for (let i = 0; i < this.config.itemCount; i++) {

            let x = Phaser.Math.Between(80, this.width - 80);
            let y = Phaser.Math.Between(150, this.height - 300);

            let type;
            let color;

            if (i < this.targetCount) {
                if (this.config.ruleType === "color") {
                    color = this.config.ruleValue;
                    type = Phaser.Utils.Array.GetRandom(types);
                } else {
                    type = this.config.ruleValue;
                    color = Phaser.Utils.Array.GetRandom(colors);
                }
            } else {
                type = Phaser.Utils.Array.GetRandom(types);
                color = Phaser.Utils.Array.GetRandom(colors);
            }

            let item = this.createCuteItem(x, y, type, color);
            item.itemType = type;
            item.itemColor = color;

            this.items.push(item);
        }
    }

    // ===============================
    // 拖拽系统
    // ===============================
    initDrag() {

        this.input.on("drag", (pointer, obj, dragX, dragY) => {
            obj.x = dragX;
            obj.y = dragY;
        });

        this.input.on("dragend", (pointer, obj) => {

            if (!obj.input || !obj.input.enabled) return;

            let correct = this.config.ruleType === "color"
                ? obj.itemColor === this.config.ruleValue
                : obj.itemType === this.config.ruleValue;

            let inBox = Phaser.Geom.Rectangle.Contains(
                this.target.getBounds(),
                obj.x,
                obj.y
            );

            if (inBox && correct) {

                obj.disableInteractive();

                this.tweens.add({
                    targets: obj,
                    x: this.width/2,
                    y: this.height - 150,
                    scale: 0.6,
                    duration: 200
                });

                this.placed++;

                if (this.placed >= this.targetCount) {
                    this.save.currentLevel++;
                    localStorage.setItem("cuteSave", JSON.stringify(this.save));

                    this.time.delayedCall(800, () => {
                        this.scene.restart();
                    });
                }

            } else {

                // 扣时间
                if (this.config.timeLimit > 0) {
                    this.currentTime -= 2;
                    if (this.currentTime < 0) this.currentTime = 0;
                    this.timerText.setText("剩余: " + this.currentTime);
                    this.cameras.main.flash(200, 255, 100, 100);
                }

                this.tweens.add({
                    targets: obj,
                    x: Phaser.Math.Between(80, this.width - 80),
                    y: Phaser.Math.Between(150, this.height - 300),
                    duration: 300
                });
            }
        });
    }

    // ===============================
    // 时间系统（单一逻辑）
    // ===============================
    initTimer() {

        if (this.config.timeLimit <= 0) {
            this.timerText.setText("剩余: ∞");
            return;
        }

        this.currentTime = this.config.timeLimit;
        this.timerText.setText("剩余: " + this.currentTime);

        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {

                this.currentTime--;

                this.timerText.setText("剩余: " + this.currentTime);

                if (this.currentTime <= 0) {
                    this.scene.restart();
                }
            }
        });
    }

    // ===============================
    // 教学弹窗
    // ===============================
    showTutorial() {

        let overlay = this.add.rectangle(this.width/2, this.height/2,
            this.width, this.height, 0x000000, 0.5)
            .setDepth(9999)
            .setInteractive();

        let bg = this.add.rectangle(this.width/2, this.height/2,
            320, 220, 0xffffff)
            .setStrokeStyle(4, 0xFF69B4)
            .setDepth(10000);

        let tip = this.add.text(this.width/2, this.height/2,
            "拖动符合规则的物品\n到整理盒即可过关\n\n点击关闭",
            {
                fontSize: "18px",
                color: "#FF1493",
                align: "center"
            }
        )
        .setOrigin(0.5)
        .setDepth(10001);

        overlay.on("pointerdown", () => {
            overlay.destroy();
            bg.destroy();
            tip.destroy();
        });

        this.save.tutorialShown = true;
        localStorage.setItem("cuteSave", JSON.stringify(this.save));
    }

    // ===============================
    // 可爱物品绘制
    // ===============================
    createCuteItem(x, y, type, color) {

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
        container.setSize(80, 80);
        container.setInteractive({ draggable: true });
        this.input.setDraggable(container);

        return container;
    }
}
