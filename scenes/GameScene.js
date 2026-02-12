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
                currentLevel: 1,
                tutorialShown: false   // 是否已显示教学
            };
            localStorage.setItem("cuteSave", JSON.stringify(save));
        }

        let currentLevel = save.currentLevel;

        if (currentLevel > levels.length) {
            currentLevel = 1;
            save.currentLevel = 1;
            localStorage.setItem("cuteSave", JSON.stringify(save));
        }

        let config = levels[currentLevel - 1];

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

        this.add.text(width/2, 110, ruleText, {
            fontSize: "18px",
            color: "#FF1493"
        }).setOrigin(0.5);

        // ===== 首次教学提示 =====
        if (!save.tutorialShown) {

    // 半透明遮罩（锁住底层）
    let overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.5)
        .setDepth(1999);

    let bg = this.add.rectangle(width/2, height/2, 320, 220, 0xffffff)
        .setStrokeStyle(4, 0xFF69B4)
        .setDepth(2000);

    let tip = this.add.text(width/2, height/2,
        "拖动符合规则的物品\n到下方整理盒即可过关\n\n点击关闭",
        {
            fontSize: "18px",
            color: "#FF1493",
            align: "center"
        }
    )
    .setOrigin(0.5)
    .setDepth(2001);

    // 让整个弹窗可点击关闭
    overlay.setInteractive();
    bg.setInteractive();

    overlay.on("pointerdown", closeTutorial);
    bg.on("pointerdown", closeTutorial);

    function closeTutorial() {
        overlay.destroy();
        bg.destroy();
        tip.destroy();
    }

    save.tutorialShown = true;
    localStorage.setItem("cuteSave", JSON.stringify(save));
        }


        // ===== 计时器 =====
        let timerText = this.add.text(width - 20, 40, "", {
            fontSize: "18px",
            color: "#FF1493"
        }).setOrigin(1, 0.5);

        // ===== 整理盒 =====
        let target = this.add.rectangle(width/2, height - 150, 260, 120, 0xFFD1DC);
        target.setStrokeStyle(4, 0xFF69B4);

        this.add.text(width/2, height - 150, "整理盒", {
            fontSize: "20px",
            color: "#ffffff"
        }).setOrigin(0.5);

        // ===== 重开按钮（右上角小圆按钮） =====

let restartBg = this.add.circle(width - 35, 35, 25, 0xFF69B4)
    .setDepth(1000);

let restartText = this.add.text(width - 35, 35, "↺", {
    fontSize: "22px",
    color: "#ffffff"
})
.setOrigin(0.5)
.setDepth(1001);

restartBg.setInteractive();

restartBg.on("pointerdown", () => {
    this.scene.restart();
});

        // ===== 生成物品 =====

        const types = ["toy", "food", "clothes"];
        const colors = ["pink", "blue", "yellow"];

        let items = [];

        // ⭐ 强制生成至少3个符合规则的物品
        let targetCount = 3;

        for (let i = 0; i < itemCount; i++) {

            let x = Phaser.Math.Between(80, width - 80);
            let y = Phaser.Math.Between(150, height - 300);

            let type;
            let color;

            if (i < targetCount) {
                // 前几个强制符合规则
                if (config.ruleType === "color") {
                    color = config.ruleValue;
                    type = types[Phaser.Math.Between(0, 2)];
                } else {
                    type = config.ruleValue;
                    color = colors[Phaser.Math.Between(0, 2)];
                }
            } else {
                // 其他随机
                type = types[Phaser.Math.Between(0, 2)];
                color = colors[Phaser.Math.Between(0, 2)];
            }

            let item = this.createCuteItem(x, y, type, color);
            item.itemType = type;
            item.itemColor = color;

            items.push(item);
        }
        // ===== 拖动逻辑 =====
        this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

       this.input.on("dragend", (pointer, gameObject) => {

    if (!gameObject.input || !gameObject.input.enabled) return;

    let correct = false;

    // ===== 判断是否符合规则 =====
    if (config.ruleType === "color") {
        correct = (gameObject.itemColor === config.ruleValue);
    } else {
        correct = (gameObject.itemType === config.ruleValue);
    }

    let inBox = Phaser.Geom.Rectangle.Contains(
        target.getBounds(),
        gameObject.x,
        gameObject.y
    );

    if (inBox && correct) {

        // ✅ 正确放置
        gameObject.disableInteractive();

        this.tweens.add({
            targets: gameObject,
            x: width / 2,
            y: height - 150 + Phaser.Math.Between(-30, 30),
            scale: 0.6,
            duration: 200
        });

        placed++;

        if (placed >= targetCount) {

            save.currentLevel++;
            localStorage.setItem("cuteSave", JSON.stringify(save));

            this.time.delayedCall(800, () => {
                this.scene.restart();
            });
        }

    } else {

        // ❌ 放错 —— 扣时间 2 秒
        if (timeLimit > 0) {
            startTime += 2000; // 时间流逝加快2秒
        this.cameras.main.flash(200, 255, 100, 100);
        }

        this.tweens.add({
            targets: gameObject,
            x: Phaser.Math.Between(80, width - 80),
            y: Phaser.Math.Between(150, height - 300),
            duration: 300
        });
        
    }
}); 

        // ===== 时间限制 =====
        // ===== 时间系统 =====

let currentTime = timeLimit > 0 ? timeLimit : 999;  // 无限制关卡给大值

let timerText = this.add.text(width - 20, 40, "", {
    fontSize: "20px",
    color: "#FF1493"
})
.setOrigin(1, 0.5)
.setDepth(1500);   // 确保在上层

timerText.setText("剩余: " + (timeLimit > 0 ? currentTime : "∞"));

if (timeLimit > 0) {

    this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => {

            currentTime--;

            timerText.setText("剩余: " + currentTime);

            if (currentTime <= 0) {
                this.scene.restart();
            }
        }
    });
}

    // ===== 可爱物品绘制 =====
    createCuteItem(x, y, type, color) {

        const container = this.add.container(x, y);
        const g = this.add.graphics();

        const colorMap = {
            pink: 0xffa6c9,
            blue: 0xa6d8ff,
            yellow: 0xfff3a6
        };

        const fillColor = colorMap[color];

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

        else if (type === "food") {

            g.fillStyle(fillColor, 1);
            g.fillRoundedRect(-35, -25, 70, 50, 12);

            g.fillStyle(0xffffff);
            g.fillCircle(0, -20, 10);

            g.fillStyle(0xff0000);
            g.fillCircle(0, -30, 6);
        }

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
