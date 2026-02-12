import { levels } from "./levels.js";

export class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");
    }

    create() {

        const { width, height } = this.scale;

        // ========= 安全存档 =========
        let save = JSON.parse(localStorage.getItem("cuteSave"));
        if (!save) {
            save = { currentLevel: 1 };
            localStorage.setItem("cuteSave", JSON.stringify(save));
        }

        let currentLevel = save.currentLevel;
        if (currentLevel > levels.length) currentLevel = 1;

        let config = levels[currentLevel - 1];

        let placed = 0;
        let startTime = Date.now();

        // ========= 背景 =========
        this.add.rectangle(width/2, height/2, width, height, 0xFFF0F5);

        // ========= 规则提示 =========
        let ruleText = "";

        if (config.ruleType === "color") {
            ruleText = "🎨 整理所有 " + config.ruleValue + " 颜色物品";
        } else {
            ruleText = "🧺 整理所有 " + config.ruleValue + " 类型物品";
        }

        this.add.text(width/2, 80, ruleText, {
            fontSize: "22px",
            color: "#FF69B4",
            align: "center",
            wordWrap: { width: width - 40 }
        }).setOrigin(0.5);

        // ========= 目标区域 =========
        let target = this.add.rectangle(width/2, height - 160, 280, 130, 0xFFB6C1);
        target.setStrokeStyle(4, 0xFF69B4);

        // ========= 物品库 =========
        const ITEM_POOL = [
            { type: "cosmetic", color: "pink" },
            { type: "cosmetic", color: "blue" },
            { type: "toy", color: "brown" },
            { type: "food", color: "pink" },
            { type: "study", color: "blue" },
            { type: "clothes", color: "pink" }
        ];

        // ========= 创建物品 =========
        for (let i = 0; i < config.itemCount; i++) {

            let data = Phaser.Utils.Array.GetRandom(ITEM_POOL);

            let x = Phaser.Math.Between(60, width - 60);
            let y = Phaser.Math.Between(150, height - 320);

            let item = this.add.rectangle(x, y, 60, 60, 0xffffff);
            item.setStrokeStyle(3, 0xFF69B4);

            // 根据颜色设置填充
            if (data.color === "pink") item.fillColor = 0xFFC0CB;
            if (data.color === "blue") item.fillColor = 0x87CEFA;
            if (data.color === "brown") item.fillColor = 0xDEB887;

            item.type = data.type;
            item.colorTag = data.color;

            item.setInteractive({ draggable: true });
            this.input.setDraggable(item);
        }

        // ========= 拖动 =========
        this.input.on("drag", (pointer, obj, dragX, dragY) => {
            obj.x = dragX;
            obj.y = dragY;
        });

        this.input.on("dragend", (pointer, obj) => {

            let correct = false;

            if (config.ruleType === "color") {
                correct = (obj.colorTag === config.ruleValue);
            } else {
                correct = (obj.type === config.ruleValue);
            }

            if (Phaser.Geom.Rectangle.Contains(target.getBounds(), obj.x, obj.y) && correct) {

                obj.disableInteractive();
                obj.x = width/2;
                obj.y = height - 160 + Phaser.Math.Between(-20, 20);

                placed++;

                if (placed >= config.itemCount) {
                    save.currentLevel++;
                    localStorage.setItem("cuteSave", JSON.stringify(save));
                    this.scene.restart();
                }

            } else {
                this.tweens.add({
                    targets: obj,
                    x: Phaser.Math.Between(60, width - 60),
                    y: Phaser.Math.Between(150, height - 320),
                    duration: 300
                });
            }

        });
    }
}
