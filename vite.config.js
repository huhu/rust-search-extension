import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
// import { fileURLToPath } from 'node:url';
// import { viteExternalsPlugin } from 'vite-plugin-externals';


export default defineConfig({
    build: {
        rollupOptions: {
            // Vite bundles external dependencies
            // https://github.com/vitejs/vite/discussions/14813
            external: [
                "querylib",
            ],
            // output: {
            //     // globals: {
            //     //     "querylib": "querylib",
            //     // }
            //     format: "esm",
            //     paths: {
            //         "querylib": "querylib.js",
            //     }
            // }
        }
    },
    plugins: [
        sveltekit(),
        // viteExternalsPlugin({
        //     querylib: 'querylib',
        // }),
    ],
    test: {
        include: ['query.rs/src/**/*.{test,spec}.{js,ts}']
    }
});
