import { Omnibox, Compat } from "./core/index.js";
import { start } from "./main.js";

(async () => {
    const defaultSuggestion = `Search std <match>docs</match>, external <match>docs</match> (~,@), <match>crates</match> (!), <match>attributes</match> (#), <match>books</match> (%), clippy <match>lints</match> (>), and <match>error codes</match>, etc in your address bar instantly!`;
    const omnibox = Omnibox.extension({ defaultSuggestion, maxSuggestionSize: Compat.omniboxPageSize() });
    await start(omnibox);
})();
