export class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    create() {
        const { width, height } = this.scale;

        this.add.text(width/2, 200, "🌸 可爱收纳闯关 🌸", {
            fontSize: "28px",
            color: "#FF69B4"
        }).setOrigin(0.5);

        // 检查是否已有存档
        let save = localStorage.getItem("cuteSave");

        if (!save) {
            let nickname = prompt("请输入昵称（可留空）");

            if (!nickname) {
                nickname = "游客_" + Math.floor(Math.random()*10000);
            }

            const data = {
                nickname,
                currentLevel: 1
            };

            localStorage.setItem("cuteSave", JSON.stringify(data));
        }

        const button = this.add.text(width/2, height/2, "开始游戏", {
            fontSize: "26px",
            backgroundColor: "#FFB6C1",
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        button.on("pointerdown", () => {
            this.scene.start("GameScene");
        });
    }
}
