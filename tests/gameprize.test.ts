import GamePrize, {Prize, Offer} from "../src/gameprize";
import dotenv from 'dotenv';
const testConfig = dotenv.config({path:"./.env.test"}).parsed || {};

describe('gameprize', (): void => {
    test('should export GamePrize', (): void => {
        expect(typeof(GamePrize)).toBe("function");
    });
    test('should export prize', (): void => {
        expect(typeof(Prize)).toBe("function");
    });
    test('should export offer', (): void => {
        expect(typeof(Offer)).toBe("function");
    });
});

describe('configuration', (): void => {
    test('should load default .env', (): void => {
        expect(process.env.GAMEPRIZE_VERSION||"").toBe("1.0.0");
    });
    test('should parse GAMEPRIZE_LIB_CONTRACT_NAME', (): void => {
        expect(testConfig["GAMEPRIZE_LIB_CONTRACT_NAME"]).toBe("testgameprize");
    });
});