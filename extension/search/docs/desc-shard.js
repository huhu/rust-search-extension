import CrateDocManager from "../../crate-manager.js";
import IndexManager from "../../index-manager.js";

export function convertToIndexJS(shards) {
    let array = new Array();
    for (let [crate, shard] of Object.entries(shards)) {
        array.push([crate, shard]);
    }
    return `new Map(JSON.parse('${JSON.stringify(array)}'));`;
}

class DescShardManager {
    constructor() {
        // A dummy descShards map to allow interact in librustdoc's DocSearch js
        this.descShards = new DummyMap();
        // The real crate -> desc shard map.
        this._descShards = new Map();
        this.initDescShards();
    }

    async initDescShards() {
        this._descShards = await IndexManager.getDescShards('std-stable');
        for (const crate of Object.keys(await CrateDocManager.getCrates())) {
            const descShards = await DescShardManager.getDescShards(crate);
            this._descShards.set(crate, descShards);
        }
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


const searchState = new DescShardManager();
export default searchState;