import { JsonRpc, Api } from "eosjs";
import { JsSignatureProvider } from "eosjs/dist/eosjs-jssig";

export type ActionName = string;

export type TableIndex = {
    index_position: number;
    key_type: string;
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

        const privateKey = localStorage.getItem("gameprize_key") || "";
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
        return localStorage.getItem("gameprize_account") || "";
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
        index: TableIndex,
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
                return [data];
            }
            return [];
        } catch (err) {
            throw err;
        }
    }

    // fetch last, insert, fetch over last and find insert by this.
    async newDataAction(action: ActionName, dataValue: any): Promise<any> {
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
