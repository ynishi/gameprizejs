import { JsonRpc, Api } from "eosjs";
import { JsSignatureProvider } from "eosjs/dist/eosjs-jssig";

export type ActionName = string;
export type TableName = string;

export type TableIndex = {
    index_position: number;
    key_type: string;
};

export const defaultTableIndex: TableIndex = {
    index_position: 0,
    key_type: "i64t",
};

export interface ApiProvider {
    api(): any;
    user(): string;
}

export class DefaultApiProvider {
    rpc: any;

    constructor(rpc: any) {
        this.rpc = rpc;

        if (typeof localStorage === "undefined" || localStorage === null) {
            const LocalStorage = require("node-localstorage").LocalStorage;
            localStorage = new LocalStorage("./scratch");
        }
    }

    api(): any {
        const { TextDecoder, TextEncoder } = require("util");
        // TODO: make mock

        const privateKey =
            localStorage.getItem(
                process.env.GAMEPRIZE_LIB_STORAGE_PRI_KEY || ""
            ) || "";
        const signatureProvider = new JsSignatureProvider([privateKey]);
        return new Api({
            rpc: this.rpc,
            signatureProvider: signatureProvider,
            textDecoder: new TextDecoder(),
            textEncoder: new TextEncoder(),
        });
    }

    user(): string {
        // TODO: make mock
        return (
            localStorage.getItem(
                process.env.GAMEPRIZE_LIB_STORAGE_USR_KEY || ""
            ) || ""
        );
    }
}

export class Client {
    apiProvider: ApiProvider;
    contract: string;
    rpc: any;

    constructor(contract?: string, apiProvider?: ApiProvider) {
        let _fetch;
        if (typeof fetch != "function") {
            _fetch = require("node-fetch");
        } else {
            _fetch = fetch;
        }
        this.rpc = new JsonRpc(
            process.env.GAMEPRIZE_LIB_EOS_HTTP_ENDPOINT || "",
            { fetch: _fetch }
        );
        this.apiProvider = apiProvider || new DefaultApiProvider(this.rpc);
        this.contract =
            contract || process.env.GAMEPRIZE_LIB_CONTRACT_NAME || "";
    }

    getUser(): string {
        return this.apiProvider.user();
    }

    async takeAction(action: ActionName, dataValue: any): Promise<any> {
        try {
            const api = this.apiProvider.api();
            const user = this.apiProvider.user();
            const resultWithConfig = await api.transact(
                {
                    actions: [
                        {
                            account: this.contract,
                            name: action,
                            authorization: [
                                {
                                    actor: user,
                                    permission: "active",
                                },
                            ],
                            data: dataValue,
                        },
                    ],
                },
                {
                    blocksBehind: 3,
                    expireSeconds: 30,
                }
            );
            return resultWithConfig;
        } catch (err) {
            throw err;
        }
    }

    async getOne(
        table: string,
        index: TableIndex,
        id: any,
        options: any = {}
    ): Promise<any> {
        try {
            const result = await this.getData(table, index, {
                ...options,
                lower_bound: id,
                limit: 1,
            });
            if (result != []) {
                return result;
            }
            throw "not exists with id:" + id;
        } catch (err) {
            throw err;
        }
    }

    // return Array presents optional
    async getLast(
        table: string,
        index: TableIndex = defaultTableIndex,
        options: any = {}
    ): Promise<Array<any>> {
        try {
            const data = await this.getData(table, index, {
                ...options,
                lower_bound: 0,
                reverse: true,
                limit: 1,
            });
            if (data != []) {
                return data;
            }
            return [];
        } catch (err) {
            throw err;
        }
    }

    async sleep(time: any) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, time);
        });
    }

    // fetch last, insert, fetch over last and find insert by this.
    async newDataAction(
        action: ActionName,
        table: TableName,
        tokenKey: string,
        dataValue: any
    ): Promise<any> {
        try {
            const latest = await this.getLast(table);
            const latestId = latest.length > 0 ? latest[0].id : 0;
            const token = String(Math.random()).substr(3, 5);
            dataValue[tokenKey] = dataValue[tokenKey] + token;
            await this.takeAction(action, dataValue);
            for (let i = 0; i < 5; i++) {
                const fetched = await this.getData(table, defaultTableIndex, {
                    lower_bound: latestId,
                    limit: 20,
                });
                for (let j = 0; j < fetched.length; j++) {
                    if (fetched[j] && fetched[j][tokenKey].search(token) > -1) {
                        return fetched[j].id;
                    }
                }
                await this.sleep(2000);
            }
            throw "not found valid id";
        } catch (err) {
            throw err;
        }
    }

    async getData(
        table: string,
        index: TableIndex,
        options: any = {}
    ): Promise<any> {
        try {
            const result = await this.rpc.get_table_rows({
                // default options
                code: process.env.GAMEPRIZE_LIB_CONTRACT_NAME, // contract who owns the table
                scope: process.env.GAMEPRIZE_LIB_CONTRACT_NAME, // scope of the table
                lower_bound: 0,
                limit: 1,
                // merge options
                ...options,
                // force set options
                json: true,
                table: table,
                ...index,
            });
            return result.rows[0] ? result.rows : [];
        } catch (err) {
            console.error(err);
            throw err;
        }
    }
}

export default Client;
