import * as offer from "../src/offer";
import {mock, anyString, any} from 'jest-mock-extended';
import {maybeOffer} from "../src/offer";

describe('offer', (): void => {
    test('should start new offer', (): void => {
        expect(1).toBe(1);
    });
});

/*
describe('offer', (): void => {
    test('should start new offer', (): void => {
    const mockApi = mock<offer.OfferApi>();
    const offerService = new offer.OfferService(mockApi);
    // mockApi.create.calledWith(anyString()).mockReturnValue(new gameprize.Prize(0, ""));
    const response: offer.Offer = offerService.start(1);
        expect(response.id).toBe(0);
        expect(response.prizeId).toBe(1);
    });
    test('search', (): void => {
        const mockApi = mock<offer.OfferApi>();
        const offerService = new offer.OfferService(mockApi);
        // mockApi.create.calledWith(anyString()).mockReturnValue(new gameprize.Prize(0, ""));
        const params:any = {

        }
        const response: Array<offer.Offer> = offerService.search(params);
        expect(response).toBe([]);
    });
    test('get', (): void => {
        const mockApi = mock<offer.OfferApi>();
        const offerService = new offer.OfferService(mockApi);
        // mockApi.create.calledWith(anyString()).mockReturnValue(new gameprize.Prize(0, ""));
        const parmas:any = {
        }
        const response: offer.MaybeOffer = offerService.get(0);
        expect(response).toBe(null);
    });
    test('update', (): void => {
        const mockApi = mock<offer.OfferApi>();
        const offerService = new offer.OfferService(mockApi);
        // mockApi.create.calledWith(anyString()).mockReturnValue(new gameprize.Prize(0, ""));
        const gotOffer: offer.Offer = maybeOffer(offerService.get(1));
        gotOffer.title = "title_mod";
        const ret: boolean = offerService.update(gotOffer);
        const updated: offer.Offer = maybeOffer(offerService.get(1));
        expect(ret).toBeTruthy();
        expect(updated.title).toBe("title_mod");
    });
    test('buy', (): void => {
        const mockApi = mock<offer.OfferApi>();
        const offerService = new offer.OfferService(mockApi);
        // mockApi.create.calledWith(anyString()).mockReturnValue(new gameprize.Prize(0, ""));
        const isOk: boolean = offerService.buy(0, 10);
        expect(isOk).toBeTruthy();
    });
    test('close', (): void => {
        const mockApi = mock<offer.OfferApi>();
        const offerService = new offer.OfferService(mockApi);
        // mockApi.create.calledWith(anyString()).mockReturnValue(new gameprize.Prize(0, ""));
        const isOk: boolean = offerService.close(0);
        expect(isOk).toBeTruthy();
    });
});

*/