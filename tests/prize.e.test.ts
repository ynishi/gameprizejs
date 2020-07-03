import * as gameprize from "../src/gameprize";

const service = new gameprize.PrizeService(null);

export const getUri = () => {
    return "http://example.com/gameprize" + String(Math.random()).substr(3, 10);
}

beforeAll(() => {
    if (typeof localStorage === "undefined" || localStorage === null) {
        const LocalStorage: any = require('node-localstorage').LocalStorage;
        localStorage = new LocalStorage('./scratch');
    }
    localStorage.setItem(process.env.GAMEPRIZE_LIB_STORAGE_PRI_KEY || "",process.env.GAMEPRIZE_TEST_PRIVATE_KEY || "");
    localStorage.setItem(process.env.GAMEPRIZE_LIB_STORAGE_USR_KEY || "",process.env.GAMEPRIZE_TEST_USER || "");
});

describe('cru(no support delete) prize',  (): void => {
    test('should create prize', async () => {
        console.log(getUri());
        const prize = service.new("desc1").setDetail({
            title: "title1",
            uri: getUri(),
            score: {"score1": 100},
            memo: "memo1"
        });
        const created = await service.create(prize);
        expect(created.desc).toBe("desc1");
    });
    test('should fetch prize', async () => {
        const prize = service.newUri("desc1", getUri()).setDetail({
            title: "title1",
            score: {"score1": 100},
            memo: "memo1"
        });
        const created = await service.create(prize);
        const ret = await service.fetch(created.id);
        expect(ret.desc).toBe("desc1");
    });
    test('should update prize', async () => {
        const prize = service.newUri("desc1", getUri()).setDetail({
            title: "title1",
            score: {"score1": 100},
            memo: "memo1"
        });
        const created = await service.create(prize);
        created.setDetail({desc: 'desc2'});
        const updated = await service.update(created);
        expect(updated.desc).toBe("desc2");
    });
});

describe('transfer prize',  (): void => {
    test('should transfer prize', async () => {
        const prize = service.newUri("desc1", getUri()).setDetail({title: "title1", score: {"score1": 100}, memo: "memo1"});
        const created = await service.create(prize);
        const ret = await service.transfer(created, "bob");
        expect(ret).toBeTruthy();
    });
});