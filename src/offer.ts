import Client, { TableIndex } from "./client";
import PrizeService, { Prize } from "./prize";
import { date2Epoch, epoch2date, titleFromDesc } from "./utils";

const ACTION_START_OFFER = "startoffer";
const ACTION_CLOSE_OFFER = "closeoffer";
const ACTION_CHANGE_OFFER = "changeoffer";
const ACTION_BUY_ORDER_OFFER = "buyorder";
const TABLE_OFFERS = "offers";
const INDEX_OFFERS_ID: TableIndex = {
    index_position: 0,
    key_type: "i64t",
};

type Id = number;

// cleos push action $_new startoffer '["alice", "'$_prize_id'", "title1", "desc1", "'$(date --date="+1 day" +%s)'", "1.00000000 PRZ", "0", []]' -p alice@active
// Offer
// Entity
export class Offer {
    id: Id = 0;
    seller: string = "";
    prize: Prize = Prize.empty();
    title: string = "";
    desc: string = "";
    endAt: Date = new Date();
    target: Currency = emptyCurrency;
    options: {} = {};
    purchaseOrders: Array<PurchaseOrder> = [];
    sellingPrices: Array<SellingPrice> = [];
    offerType: number = 0;
    status: number = 0;

    constructor(
        id: Id,
        seller: string,
        prize: Prize,
        desc: string,
        endAt: Date,
        target: Currency,
        title?: string
    ) {
        this.id = id;
        this.seller = seller;
        this.prize = prize;
        this.desc = desc;
        this.title = title ? title : titleFromDesc(desc);
        this.endAt = endAt;
        this.target = target;
    }

    static empty() {
        const offer = new Offer(
            Offer.emptyId(),
            "",
            Prize.empty(),
            "",
            new Date(),
            emptyCurrency
        );
        return offer;
    }

    static emptyId(): number {
        return -1;
    }

    //Received: [{"desc": "desc1", "end_at_epoch": 1593844235, "id": 23, "offer_type": 0, "options": [{"key": "offertoken", "value": "96577"}], "prize_id": 145, "purchase_orders": [], "seller": "alice", "selling_prices": [{"first": "1.00000000 PRZ", "second": 1593840637}], "status": 2, "title": "desc1"}]
    static fromData(data: OfferRespData): Offer {
        const offer = Offer.empty();
        const prizeOnlyId = Prize.empty();
        prizeOnlyId.id = data.prize_id;
        const sellingPrices: Array<SellingPrice> = [];
        for (let i = 0; i < data.selling_prices.length; i++) {
            sellingPrices.push(fromSpd(data.selling_prices[i]));
        }
        const purchaseOrders: Array<PurchaseOrder> = [];
        for (let i = 0; i < data.purchase_orders.length; i++) {
            purchaseOrders.push(fromPod(data.purchase_orders[i]));
        }
        return {
            ...offer,
            id: data.id,
            seller: data.seller,
            prize: prizeOnlyId,
            desc: data.desc,
            endAt: epoch2date(data.end_at_epoch),
            sellingPrices: sellingPrices,
            offerType: data.offer_type,
            purchaseOrders: purchaseOrders,
            status: data.status,
        };
    }
}

export type Currency = {
    symbol: string;
    amount: number;
    digit: number;
};
export const emptyCurrency: Currency = {
    symbol: "",
    amount: 0,
    digit: 1,
};

export const newCurrency = (symbol: string, amount: string): Currency => {
    return fromCurrencyStr(amount.trim() + " " + symbol.trim());
};

export const fromCurrencyStr = (str: CurrencyStr): Currency => {
    const num: string = str.split(" ")[0];
    return {
        symbol: str.split(" ")[1],
        amount: Number(num),
        digit: num.split(".")[1].length,
    };
};

const fromCurrency = (c: Currency): string => {
    return c.amount.toFixed(c.digit) + " " + c.symbol;
};

type UsernameStr = string;
type CurrencyStr = string;
type EpochNum = number;

type SellingPrice = {
    currency: Currency;
    createdAt: Date;
};

type SellingPriceData = {
    first: CurrencyStr;
    second: EpochNum;
};

const fromSpd = (spd: SellingPriceData): SellingPrice => {
    return {
        currency: fromCurrencyStr(spd.first),
        createdAt: epoch2date(spd.second),
    };
};

type PurchaseOrder = {
    buyer: UsernameStr;
    price: Currency;
    orderedAt: Date;
};

type PurchaseOrderData = {
    field_0: UsernameStr;
    field_1: CurrencyStr;
    field_2: EpochNum;
};

const fromPod = (bod: PurchaseOrderData): PurchaseOrder => {
    return {
        buyer: bod.field_0,
        price: fromCurrencyStr(bod.field_1),
        orderedAt: epoch2date(bod.field_2),
    };
};

type OfferReqData = {
    seller: string;
    title: string;
    desc: string;
    price: string;
    prize_id: number;
    end_at_epoch: number;
    offer_type: number;
    options: Array<{}>;
};

type OfferRespData = {
    id: number;
    seller: string;
    title: string;
    desc: string;
    price: string;
    prize_id: number;
    end_at_epoch: number;
    offer_type: number;
    options: Array<{}>;
    purchase_orders: Array<PurchaseOrderData>;
    selling_prices: Array<SellingPriceData>;
    status: number;
};

const toOfferReqData = (offer: Offer): OfferReqData => {
    return {
        seller: offer.seller,
        title: offer.title,
        desc: offer.desc,
        prize_id: offer.prize.id,
        end_at_epoch: date2Epoch(offer.endAt),
        price: fromCurrency(offer.target),
        offer_type: 0,
        options: OfferService.convertMap(offer.options),
    };
};

export type MaybeOffer = Offer | null;

export const maybeOffer = (offer: MaybeOffer) => {
    if (offer == null) {
        return Offer.empty();
    }
    return offer;
};

export class OfferService {
    eos: Client;
    prizeService: PrizeService;

    constructor(eos?: Client) {
        this.eos = eos ? eos : new Client();
        this.prizeService = new PrizeService(null);
    }

    static convertMap(a: any): Array<{}> {
        const acc = [];
        for (let k in a) {
            acc.push({ key: k, value: a[k] });
        }
        return acc;
    }

    async start(
        prize: Prize,
        desc: string,
        endAt: Date,
        target: string
    ): Promise<Offer> {
        const offer = new Offer(
            Offer.emptyId(),
            this.eos.getUser(),
            prize,
            desc,
            endAt,
            fromCurrencyStr(target)
        );

        const setTokenF = (data: any, token: string): any => {
            data.options.push({ key: "offertoken", value: token });
            return data;
        };

        const getTokenF = (data: any): string => {
            const options = data["options"];
            if (!options) {
                return "";
            }
            for (let i = 0; i < options.length; i++) {
                if (options[i].key == "offertoken") {
                    return options[i].value;
                }
            }
            return "";
        };

        const newId = await this.eos.newDataAction(
            ACTION_START_OFFER,
            TABLE_OFFERS,
            "",
            toOfferReqData(offer),
            setTokenF,
            getTokenF
        );

        offer.id = newId;
        return this.setPrize(offer);
    }

    async get(id: number): Promise<MaybeOffer> {
        const gotData = await this.eos.getOne(
            TABLE_OFFERS,
            INDEX_OFFERS_ID,
            id
        );
        if (gotData.length == 0) {
            return Offer.empty();
        }
        const gotOffer = Offer.fromData(gotData[0]);
        return this.setPrize(gotOffer);
    }
    //cleos push action $_new changeoffer '["alice", "'$_offer_id'", "title2", "", "0", "10.00000000 PRZ", []]' -p alice@active
    async update(offer: Offer): Promise<Offer> {
        const reqData = toOfferReqData(offer);
        await this.eos.takeAction(ACTION_CHANGE_OFFER, {
            seller: reqData.seller,
            offer_id: offer.id,
            title: reqData.title,
            desc: reqData.desc,
            end_at_epoch: reqData.end_at_epoch,
            price: reqData.price,
            change_opts: reqData.options,
        });
        const got = await this.get(offer.id);
        if (got == null) {
            return Offer.empty();
        }
        return got;
    }

    async buy(offer: Offer, purchase: Currency): Promise<Offer> {
        await this.eos.takeAction(ACTION_BUY_ORDER_OFFER, {
            buyer: this.eos.getUser(),
            id: offer.id,
            purchase: fromCurrency(purchase),
        });
        const got = await this.get(offer.id);
        if (got == null) {
            return Offer.empty();
        }
        return got;
    }

    /* TODO:
    search(params: any): Array<Offer> {
        return [];
    }

    */
    async close(offer: Offer): Promise<Offer> {
        await this.eos.takeAction(ACTION_CLOSE_OFFER, {
            seller: offer.seller,
            id: offer.id,
        });
        const got = await this.get(offer.id);
        if (got == null) {
            return Offer.empty();
        }
        return got;
    }

    // helper
    async setPrize(offer: Offer): Promise<Offer> {
        const gotPrize = await this.prizeService.fetch(offer.prize.id);
        offer.prize = gotPrize;
        return offer;
    }

    showStatus = (status: number): string => {
        return ["ON_GOING", "END_OK", "END_NG"][status];
    };
}
export default OfferService;
