// 30关配置
export const levels = [];

for (let i = 1; i <= 30; i++) {

    let itemCount;
    let timeLimit;

    if (i <= 10) {
        itemCount = 3 + i;     // 4-13个
        timeLimit = 0;         // 无时间限制
    } else {
        itemCount = 5 + i;     // 难度增加
        timeLimit = 40 - i;    // 时间减少
    }

    levels.push({
        level: i,
        itemCount,
        timeLimit: timeLimit < 15 ? 15 : timeLimit
    });
}
