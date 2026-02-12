// 30关完整规则版

export const levels = [];

const colors = ["pink", "blue", "yellow"];
const types = ["toy", "food", "clothes"];

for (let i = 1; i <= 30; i++) {

    let itemCount;
    let timeLimit;
    let ruleType;
    let ruleValue;

    // ====== 难度设置 ======

    if (i <= 10) {
        // 简单：按颜色分类
        itemCount = 4 + i;         // 5-14个
        timeLimit = 0;             // 无时间限制
        ruleType = "color";
        ruleValue = colors[i % colors.length];

    } else if (i <= 20) {
        // 中等：按类型分类
        itemCount = 6 + i;         // 增加数量
        timeLimit = 30;            // 有时间限制
        ruleType = "type";
        ruleValue = types[i % types.length];

    } else {
        // 困难：混合规则
        itemCount = 8 + i;
        timeLimit = 25;
        ruleType = (i % 2 === 0) ? "color" : "type";
        ruleValue = ruleType === "color"
            ? colors[i % colors.length]
            : types[i % types.length];
    }

    levels.push({
        level: i,
        itemCount,
        timeLimit,
        ruleType,
        ruleValue
    });
}
