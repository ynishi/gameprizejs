import * as gameprize from "../src/gameprize";
import {mock, anyString, any, anyNumber} from 'jest-mock-extended';

describe('prize', (): void => {
    test('should construct new prize', (): void => {
    const response: gameprize.Prize = new gameprize.Prize(0,"", "desc1", "title1", "http://example.com/prize/1", {"score1": 100}, "memo1");
        expect(response.id).toBe(0);
        expect(response.uri).toBe('http://example.com/prize/1');
    });
});

describe('cru(no support delete) prize', (): void => {
    test('should create new prize', (): void => {
    const mockApi = mock<gameprize.PrizeApi>();
    const prizeService = new gameprize.PrizeService(mockApi);
    mockApi.create.calledWith(anyString(), any(), anyString(),anyString(), anyString()).mockReturnValue(Promise.resolve({id: 0, desc: "desc1"} as gameprize.PrizeData));
    const prize = new gameprize.Prize(gameprize.Prize.emptyId(), "", "desc1", "title1", "http://example.com/prize/2", {"score1": 100}, "memo1");
    prizeService.create(prize).then((prize)  => {
        expect(prize.id).toBe(0);
        });
    });
    test('should read prize by id', (): void => {
        const mockApi = mock<gameprize.PrizeApi>();
        const prizeService = new gameprize.PrizeService(mockApi);
        mockApi.fetch.calledWith(0).mockReturnValue(Promise.resolve({id: 0,desc: "desc1", uri: 'http://example.com/prize/3'} as gameprize.PrizeData))
        prizeService.fetch(0).then((prize) => {
            expect(prize.id).toBe(0);
            expect(prize.uri).toBe('http://example.com/prize/3');
        });
    });
    test('should update prize', (): void => {
        const mockApi = mock<gameprize.PrizeApi>();
        const prizeService = new gameprize.PrizeService(mockApi);
        const inputPrize = new gameprize.Prize(gameprize.Prize.emptyId(), "","desc1", "title1", "http://example.com/prize/4", {"score1": 100}, "memo1");
        inputPrize.id = 0
        mockApi.put.calledWith(any()).mockReturnValue(Promise.resolve(inputPrize));
        prizeService.update(inputPrize).then((response) => {
                expect(response.id).toBe(inputPrize.id);
            }
        );
    });
});

describe('transfer prize', (): void => {
    test('should change owner of prize', (): void => {
        const mockApi = mock<gameprize.PrizeApi>();
        const prizeService = new gameprize.PrizeService(mockApi);
        mockApi.transfer.calledWith(anyNumber(), anyString(), anyString()).mockReturnValue(Promise.resolve(true));
        const inputPrize = new gameprize.Prize(gameprize.Prize.emptyId(), "","desc1", "title1", "http://example.com/prize/5", {"score1": 100}, "memo1");
        inputPrize.id = 0
        prizeService.transfer(inputPrize, "to_user").then((isOk) =>
            {
                expect(isOk).toBeTruthy();
            }
        );

    });
});
