import CrateDocManager from "../../crate-manager.js";
import IndexManager from "../../index-manager.js";

class DescShardManager {
    constructor() {
        // A crate -> desc shard map.
        this.descShards = new Map();
    }

    async initDescShards() {
        for (const crate of Object.keys(await CrateDocManager.getCrates())) {
            const descShards = await IndexManager.getDescShards(crate);
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
}

const searchState = new DescShardManager();
export default searchState;