// esbuild content-script-bundle.js --bundle --minify --global-name=rse --target=es2015 --outdir=extension
import storage from "./extension/core/storage.js";
import settings from "./extension/lib/settings.js";
import IndexSetter from "./extension/lib/index-setter.js";
import CrateDocManager from "./extension/lib/crate-manager.js";

export {
    storage,
    settings,
    IndexSetter,
    CrateDocManager,
}