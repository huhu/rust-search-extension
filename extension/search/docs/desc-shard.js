import IndexManager from "../../index-manager.js";

export default class DescShardManager {
    constructor() {
        // A dummy descShards map to allow interact in librustdoc's DocSearch js
        this.descShards = new DummyMap();
        // The real crate -> desc shard map.
        this._descShards = new Map();
    }

    static async create(...createNames) {
        const descShardManager = new DescShardManager();
        for (const name of createNames) {
            await descShardManager.addCrateDescShards(name);
        }
        return descShardManager;
    }

    async addCrateDescShards(crateName) {
        const descShards = await IndexManager.getDescShards(crateName);
        this._descShards = new Map([...this._descShards, ...descShards]);
    }

    // Load a single desc shard.
    // Compatible with librustdoc main.js.
    async loadDesc({ descShard, descIndex }) {
        let crateDescShard = this._descShards.get(descShard.crate);
        if (!crateDescShard || crateDescShard.length === 0) {
            return null;
        }
        return crateDescShard[descShard.shard][descIndex];
    }
}

class DummyMap {
    set(_ke, _value) { }
}
