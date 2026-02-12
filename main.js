import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
//import { levels } from './scenes/levels.js';

const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    width: 390,
    height: 844,
    backgroundColor: "#FFF0F5",
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, GameScene]
};

new Phaser.Game(config);
