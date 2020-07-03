import * as client from "../src/client";
import {mock, anyString, any} from 'jest-mock-extended';
import {TableIndex} from "../src/client";

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

describe('client', (): void => {
    test('should be exists',  () : void => {
        expect(typeof client.Client).toBe("function");
    });
    test('should getData Last', async () => {
        const TABLE_PRIZES = "prizes";
        const cli = new client.Client();
        const data = await cli.getLast(TABLE_PRIZES);
        expect(data.length > 0).toBeTruthy();
    });
    test('should do newDataAction', async () => {
        const TABLE_PRIZES = "prizes";
        const cli = new client.Client();
        const data = await cli.newDataAction("registerprz",TABLE_PRIZES, "memo", {
            registerer: "alice",
            memo: "memo",
            uri: getUri(),
            score: [],
            title: "title",
            desc: "desc"});
        expect(data > 0).toBeTruthy();
    });
});
