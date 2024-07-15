// import adapter from "sveltekit-adapter-chrome-extension";
import adapter from 'sveltekit-adapter-browser-extension';
export default {
    kit: {
        // adapter: adapter({
        //     // default options are shown
        //     pages: "../extension/manage",
        //     assets: "../extension/manage",
        //     fallback: null,
        //     precompress: false,
        //     manifest: "../extension/manifest.json",
        //     strict: false,
        // }),
        adapter: adapter({
            // default options are shown
            pages: "../extension/manage",
            assets: "../extension/manage",
            fallback:  true, // set to true to output an SPA-like extension
            manifestVersion: 3 // the version of the automatically generated manifest (Version 3 is required by Chrome).
        }),
        appDir: 'ext', // This is important - chrome extensions can't handle the default _app directory name.
    },
};
