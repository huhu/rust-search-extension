extern crate built;

use std::env;
use std::path;

fn main() {
    let mut opts = built::Options::default();
    opts.set_dependencies(true);

    let src = env::var("CARGO_MANIFEST_DIR").unwrap();
    let dst = path::Path::new(&env::var("OUT_DIR").unwrap()).join("built.rs");
    built::write_built_file_with_opts(&opts, src.as_ref(), &dst)
        .expect("Failed to acquire build-time information.");
}
