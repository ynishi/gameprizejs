import * as gameprize from "../src/gameprize";
import {Prize} from "../src/prize";

const service = new gameprize.OfferService();
const prizeService = new gameprize.PrizeService(null);

const getUri = () => {
    return "http://example.com/gameprize" + String(Math.random()).substr(3, 10);
}

const getAfter =  (hour: number): Date => {
    const d = new Date();
    d.setTime(d.getTime() + (hour * 60 * 60 * 1000));
    return d;
}

let prize : Prize = {} as Prize;

beforeAll(async () => {
    if (typeof localStorage === "undefined" || localStorage === null) {
        const LocalStorage: any = require('node-localstorage').LocalStorage;
        localStorage = new LocalStorage('./scratch');
    }
    localStorage.setItem(process.env.GAMEPRIZE_LIB_STORAGE_PRI_KEY || "",process.env.GAMEPRIZE_TEST_PRIVATE_KEY || "");
    localStorage.setItem(process.env.GAMEPRIZE_LIB_STORAGE_USR_KEY || "",process.env.GAMEPRIZE_TEST_USER || "");

    const newPrize = prizeService.new("desc1").setDetail({
        title: "title1",
        uri: getUri(),
        score: {"score1": 100},
        memo: "memo1"
    });
    prize = await prizeService.create(newPrize);
});

describe('action offer',  (): void => {
    test('should start offer', async () => {
        const offer = await service.start(prize, "desc1", getAfter(1), "1.00000000 PRZ");
        expect(offer.desc).toBe("desc1");
    });

    test("should update offer", async () => {
        const offer = await service.start(prize, "desc1", getAfter(1), "1.00000000 PRZ");
        offer.desc = "desc2";
        const updated = await service.update(offer);
        expect (updated.desc).toBe("desc2");
    });

    test("should buy order for offer", async () => {
        const offer = await service.start(prize, "desc1", getAfter(1), "10.00000000 PRZ");
        offer.desc = "desc2";
        const before = localStorage.getItem(process.env.GAMEPRIZE_LIB_STORAGE_USR_KEY || "") || "";
        localStorage.setItem(process.env.GAMEPRIZE_LIB_STORAGE_USR_KEY || "", "bob");
        const bought = await service.buy(offer, gameprize.newCurrency("PRZ", "1.00000000"));
        localStorage.setItem(process.env.GAMEPRIZE_LIB_STORAGE_USR_KEY || "", before);
        expect (bought.purchaseOrders[0].buyer).toBe("bob");
    });

    test("should close offer", async () => {
        const offer = await service.start(prize, "desc1", getAfter(1), "1.00000000 PRZ");
        const closed = await service.close(offer);
        expect (service.showStatus(closed.status)).toBe("END_NG");
    })

});