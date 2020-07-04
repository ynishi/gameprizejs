import Client, { TableIndex } from "./client";
import * as utils from "./utils";

const ACTION_REGISTER_PRIZE = "registerprz";
const ACTION_UPDATE_PRIZE = "updateprz";
const ACTION_TRANSFER_PRIZE = "transferprz";

const TABLE_PRIZES = "prizes";
const INDEX_PRIZES_ID: TableIndex = {
    index_position: 0,
    key_type: "i64t",
};

// Entity
export class Prize {
    id: number;
    registerer: string = "";
    uri: string = "";
    score: any = {};
    title: string = "";
    desc: string = "";
    memo: string = "";

    constructor(
        id: number,
        registerer: string,
        desc: string,
        title?: string,
        uri?: string,
        score?: any,
        memo?: string
    ) {
        this.id = id;
        this.registerer = registerer;
        this.uri = uri ? uri : this.uri;
        this.score = score ? score : this.score;
        if (this.uri == "" && this.score == {}) {
            throw "not valid value, uri or score should be exist";
        }
        this.title = Prize.titleFromDesc(desc);
        this.desc = desc;
        this.memo = memo ? memo : "created by gameprizejs";
    }

    static titleFromDesc(desc: string) {
        return utils.titleFromDesc(desc);
    }

    static fromData(data: PrizeData): Prize {
        return new Prize(
            data.id,
            data.registerer,
            data.desc,
            data.title,
            data.uri,
            data.score,
            data.memo
        );
    }

    setDetail(detail: PrizeDetail): Prize {
        detail.desc && (this.desc = detail.desc);
        detail.title && (this.title = detail.title);
        detail.uri && (this.uri = detail.uri);
        detail.score && (this.score = detail.score);
        detail.memo && (this.memo = detail.memo);
        return this;
    }

    static emptyId(): number {
        return -1;
    }
    isEmpty(): boolean {
        return !Prize.isValidId(this.id);
    }
    static isValidId(id: number): boolean {
        return id >= 0;
    }
    static isInvalidId(id: number): boolean {
        return !Prize.isValidId(id);
    }
    static empty(): Prize {
        return new Prize(
            Prize.emptyId(),
            Prize.emptyRegisterer(),
            Prize.emptyDesc()
        );
    }
    static emptyRegisterer(): string {
        return "";
    }
    static emptyDesc(): string {
        return "";
    }
}

// Adapter Data Class
export type PrizeDetail = {
    desc?: string;
    uri?: string;
    score?: any;
    title?: string;
    memo?: string;
};

export type Score = Record<string, number>;

export type PrizeData = {
    id: number;
    registerer: string;
    uri: string;
    score: string;
    title: string;
    desc: string;
    memo: string;
};

// Effective Repository
export interface PrizeApi {
    create(
        uri: string,
        score: Score,
        title: string,
        desc: string,
        memo: string
    ): Promise<PrizeData>;
    fetch(id: number): Promise<PrizeData>;
    put(prize: PrizeData): Promise<PrizeData>;

    transfer(id: number, to: string, cur: string): Promise<boolean>;
}

// It could be reduction this layer. Directory use client by Service.
export class PrizeApiEOS implements PrizeApi {
    eos: Client;
    constructor(client: Client) {
        this.eos = client;
    }

    async create(
        uri: string,
        score: Score,
        title: string,
        desc: string,
        memo: string
    ): Promise<PrizeData> {
        const convertedScore = PrizeApiEOS.convertMap(score);
        const newPrize: Prize = new Prize(
            Prize.emptyId(),
            this.eos.getUser(),
            desc,
            title,
            uri,
            convertedScore,
            memo
        );
        const newId = await this.eos.newDataAction(
            ACTION_REGISTER_PRIZE,
            TABLE_PRIZES,
            "memo",
            newPrize
        );
        newPrize.id = newId;
        return newPrize;
    }

    async fetch(id: number): Promise<PrizeData> {
        const got = await this.eos.getOne(TABLE_PRIZES, INDEX_PRIZES_ID, id);
        if (got.length == 0) {
            return Prize.empty();
        }
        return Prize.fromData(got[0]);
    }

    async put(data: PrizeData): Promise<PrizeData> {
        const got = await this.eos.getOne(
            TABLE_PRIZES,
            INDEX_PRIZES_ID,
            data.id
        );
        let opt = {} as PrizeData;
        if (got.length == 0) {
            opt = data;
        } else {
            const gotData = got[0];
            opt.id = data.id;
            opt.desc = data.desc;
            opt.title = data.title;
            opt.uri = gotData.uri != data.uri ? data.uri : "";
            opt.score = data.score;
            opt.memo = data.memo;
        }
        await this.eos.takeAction(ACTION_UPDATE_PRIZE, {
            ...opt,
            username: this.eos.getUser(),
        });
        const gotAfter = await this.eos.getOne(
            TABLE_PRIZES,
            INDEX_PRIZES_ID,
            data.id
        );
        if (gotAfter.length == 0) {
            throw "cannot got";
        } else {
            return gotAfter[0];
        }
    }

    async transfer(id: number, to: string, current: string): Promise<boolean> {
        return this.eos.takeAction(ACTION_TRANSFER_PRIZE, {
            id: id,
            from: this.eos.getUser(),
            to: to,
            memo: "by gameprizejs",
            current: current,
        });
    }

    // helper
    static convertMap(a: Score): any {
        const acc = [];
        for (let k in a) {
            acc.push({ key: k, value: a[k] });
        }
        return acc;
    }
}

// Usecase
export class PrizeService {
    api: PrizeApi;

    constructor(api: PrizeApi | null) {
        this.api = api ? api : new PrizeApiEOS(new Client());
    }

    newUri(desc: string, uri: string): Prize {
        const prize = this.new(desc);
        prize.uri = uri;
        return prize;
    }

    newScore(desc: string, score: Score): Prize {
        const prize = this.new(desc);
        prize.score = score;
        return prize;
    }

    new(desc: string): Prize {
        const prize = Prize.empty();
        prize.desc = desc;
        return prize;
    }

    async create(prize: Prize): Promise<Prize> {
        const data = await this.api.create(
            prize.uri,
            prize.score,
            prize.title,
            prize.desc,
            prize.memo
        );
        return Prize.fromData({ ...prize, ...data });
    }

    async fetch(id: number): Promise<Prize> {
        if (Prize.isInvalidId(id)) {
            throw "id should be greater or equal 0:" + id;
        }
        const data = await this.api.fetch(id);
        return Prize.fromData(data);
    }

    async update(prize: Prize): Promise<Prize> {
        if (prize.isEmpty()) {
            throw "put prize's id should be greater or equal 0:" + prize.id;
        }
        const data = await this.api.put(prize);
        return Prize.fromData(data);
    }

    async transfer(
        prize: Prize,
        to: string,
        current?: string
    ): Promise<boolean> {
        if (Prize.isInvalidId(prize.id)) {
            throw "put prize's id should be greater or equal 0:" + prize.id;
        }
        const cur = current ? current : "1.0 SYS";
        return this.api.transfer(prize.id, to, cur);
    }
}

export default PrizeService;
