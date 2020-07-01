import * as gameprize from "../src/gameprize";

describe('cru(no support delete) prize',  (): void => {
    test('should create new prize in local', async () => {

        if (typeof localStorage === "undefined" || localStorage === null) {
            const LocalStorage: any = require('node-localstorage').LocalStorage;
            localStorage = new LocalStorage('./scratch');
        }
        localStorage.setItem("gameprize_key",process.env.GAMEPRIZE_TEST_PRIVATE_KEY || "");
        localStorage.setItem("gameprize_user",process.env.GAMEPRIZE_TEST_USER || "");

        const prizeService = new gameprize.PrizeService(null);
        const randomNo = String(Math.random());
        const prize = new gameprize.Prize(gameprize.Prize.emptyId(), "desc1", "title1", "http://example.com/prize/1" + randomNo, {"score1": 100}, "memo1");
        const resp = await prizeService.create(prize);
        expect(resp.desc).toBe("desc1");
    });
});