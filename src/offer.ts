// Offer
// Entity
export class Offer {
    id: number = 0;
    prizeId: number = -1; //initial, invalid
    title: string = "";

    constructor(id: number, prizeId: number) {
        this.id = id;
        this.prizeId = prizeId;
    }
}

export interface OfferApi {
    create(prizeId: number): Offer;
}

export type id_t = number;
export type prize_id_t = number;

export type MaybeOffer = Offer | null;

export const maybeOffer = (offer: MaybeOffer) => {
    if (offer == null) {
        return new Offer(-1, -1);
    }
    return offer;
};

export class OfferService {
    api: OfferApi;
    constructor(api: OfferApi) {
        this.api = api;
    }
    start(prizeId: prize_id_t): Offer {
        const offer = this.api.create(prizeId);
        return offer;
    }
    search(params: any): Array<Offer> {
        return [];
    }
    get(id: id_t): MaybeOffer {
        return null;
    }
    update(offer: Offer): boolean {
        return true;
    }
    buy(id: id_t, price: number): boolean {
        return true;
    }
    close(id: id_t): boolean {
        return true;
    }
}
export default OfferService;
