export class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    create() {
        const { width, height } = this.scale;

        let levelData = JSON.parse(localStorage.getItem("cuteSave"));
        let level = levelData.currentLevel;

        this.add.text(width/2, 50, "第 " + level + " 关", {
            fontSize: "22px",
            color: "#FF69B4"
        }).setOrigin(0.5);

        // 生成目标区域
        let target = this.add.rectangle(width/2, height-150, 200, 100, 0xFFB6C1);
        target.setStrokeStyle(4, 0xFF69B4);

        // 生成可拖动物品
        let item = this.add.image(width/2, 300, "box");
        item.setTint(0xFF69B4);
        item.setInteractive({ draggable: true });

        this.input.setDraggable(item);

        this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on("dragend", (pointer, gameObject) => {
            if (Phaser.Geom.Rectangle.Contains(target.getBounds(), gameObject.x, gameObject.y)) {

                // 过关
                levelData.currentLevel++;
                localStorage.setItem("cuteSave", JSON.stringify(levelData));

                this.scene.restart();
            } else {
                gameObject.x = width/2;
                gameObject.y = 300;
            }
        });
    }
}
