import CrateDocManager from "../../crate-manager.js";
import storage from "../../core/storage.js";

export function convertToIndexJS(shards) {
    let array = new Array();
    for (let [crate, shard] of Object.entries(shards)) {
        array.push([crate, shard]);
    }
    return `new Map(JSON.parse('${JSON.stringify(array)}'));`;
}

export class DescShardManager {
    constructor() {
        // A crate -> desc shard map.
        this.descShards = new Map();
        this.initDescShards();
    }

    async initDescShards() {
        const stdDescShards = await DescShardManager.getDescShards('std-stable');
        this.descShards = new Map(Object.entries(stdDescShards));
        for (const crate of Object.keys(await CrateDocManager.getCrates())) {
            const descShards = await DescShardManager.getDescShards(crate);
            this.descShards.set(crate, descShards);
        }
    }


    // Load a single desc shard.
    // Compatible with librustdoc main.js.
    async loadDesc({ descShard, descIndex }) {
        let crateDescShard = this.descShards.get(descShard.crate);
        if (!crateDescShard || crateDescShard.length === 0) {
            return null;
        }
        return crateDescShard[descShard.shard][descIndex];
    }

    static setDescShards(crate, shards) {
        if (shards) {
            storage.setItem(`desc-shards-${crate}`, shards);
        }
    }

    static async getDescShards(crate) {
        return await storage.getItem(`desc-shards-${crate}`) || {};
    }
}

const searchState = new DescShardManager();
export default searchState;