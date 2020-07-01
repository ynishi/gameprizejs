import * as client from "./client";
import Client, { TableIndex } from "./client";

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
    uri: string = "";
    score: any = {};
    title: string = "";
    desc: string = "";
    memo: string = "";

    constructor(
        id: number,
        desc: string,
        title?: string,
        uri?: string,
        score?: any,
        memo?: string
    ) {
        this.id = id;
        this.uri = uri ? uri : this.uri;
        this.score = score ? score : this.score;
        if (this.uri == "" && this.score == {}) {
            throw "not valid value, uri or score should be exist";
        }
        this.title = Prize.titleFromDesc(desc);
        this.desc = desc;
        this.memo = memo ? memo : "created by gameprizejs";
    }

    static titleFromDesc(desc: string): string {
        if (!desc) {
            return "";
        }
        const sliced = desc.slice(0, 10);
        const suffix = desc.length >= 10 ? "..." : "";
        return sliced + suffix;
    }

    static fromData(data: PrizeData): Prize {
        return new Prize(
            data.id,
            data.desc,
            data.title,
            data.uri,
            data.score,
            data.memo
        );
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
    static empty(): Prize {
        return new Prize(-1, "");
    }
}

// Adapter Data Class
export type PrizeData = {
    id: number;
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
        score: any,
        title: string,
        desc: string,
        memo: string
    ): Promise<PrizeData>;
    fetch(id: number): Promise<PrizeData>;
    put(prize: PrizeData): Promise<number>;
    transfer(id: number, to: string): Promise<boolean>;
}

// It could be reduction this layer. Directory use client by Service.
export class PrizeApiEOS implements PrizeApi {
    eos: Client;
    constructor(client: Client) {
        this.eos = client;
    }

    async create(
        uri: string,
        score: any,
        title: string,
        desc: string,
        memo: string
    ): Promise<PrizeData> {
        const convertedScore = PrizeApiEOS.convertMap(score);
        const fetched = await this.eos.getData(
            TABLE_PRIZES,
            INDEX_PRIZES_ID,
            {}
        );
        return this.eos.takeAction(ACTION_REGISTER_PRIZE, {
            registerer: this.eos.getUser(),
            memo,
            uri,
            score: convertedScore,
            title,
            desc,
        });
    }

    async fetch(id: number): Promise<PrizeData> {
        return this.eos.getOne(TABLE_PRIZES, INDEX_PRIZES_ID, id);
    }

    async put(prizeData: PrizeData): Promise<number> {
        return this.eos.takeAction(ACTION_UPDATE_PRIZE, prizeData);
    }

    async transfer(id: number, to: string): Promise<boolean> {
        return this.eos.takeAction(ACTION_TRANSFER_PRIZE, { id: id, to: to });
    }

    // helper
    static convertMap(a: any): any {
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

    async create(prize: Prize): Promise<Prize> {
        const data = await this.api.create(
            prize.uri,
            prize.score,
            prize.title,
            prize.desc,
            prize.memo
        );
        // TODO: find added prize and return id.
        return prize;
    }

    async fetch(id: number): Promise<Prize> {
        if (Prize.isValidId(id)) {
            throw "id should be greater or equal 0:" + id;
        }
        const data = await this.api.fetch(id);
        return Prize.fromData(data);
    }

    async update(prize: Prize): Promise<number> {
        if (prize.isEmpty()) {
            throw "put prize's id should be greater or equal 0:" + prize.id;
        }
        return this.api.put(prize);
    }

    async transfer(id: number, to: string): Promise<boolean> {
        if (Prize.isValidId(id)) {
            throw "put prize's id should be greater or equal 0:" + id;
        }
        return this.api.transfer(id, to);
    }
}

export default PrizeService;
