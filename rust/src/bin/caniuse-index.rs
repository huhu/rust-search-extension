#![cfg(feature = "caniuse-index")]
// Expects one argument, path to caniuse.rs repo
// Optional 2nd argument, path to output

use std::env;
use std::fs;
use std::path::Path;

const INDEX_PATH: &str = "../extension/index/caniuse.js";

struct Feat {
    // Rust version that the feature is stabilized
    version: String,
    // The slug used in caniuse.rs URL
    slug: String,
    // (null-able) The flag needed to use the feature in (unstable) Rust
    flag: Option<String>,
    // (null-able) A title that describes the feature
    title: Option<String>,
    // (null-able) RFC pull request ID
    rfc: Option<u32>,
}

type FeatArray = (String, String, Option<String>, Option<String>, Option<u32>);

impl Feat {
    fn new(version: String, slug: String) -> Self {
        Self {
            version,
            slug,
            flag: None,
            title: None,
            rfc: None,
        }
    }

    fn into_array(self) -> FeatArray {
        (self.version, self.slug, self.flag, self.title, self.rfc)
    }
}

fn main() {
    let mut args = env::args().skip(1);
    let caniuse_repo_str = args.next().expect("Path to caniuse.rs repo required");
    let mut data_dir = Path::new(&caniuse_repo_str).to_path_buf();
    data_dir.push("data");

    let mut feats = vec![];

    for vd in fs::read_dir(data_dir).unwrap() {
        let version_dir = vd.unwrap();
        let version = version_dir.file_name().to_str().unwrap().to_owned();

        for ff in fs::read_dir(version_dir.path()).unwrap() {
            let feat_file = ff.unwrap();
            // Ignore non-markdown files, such as version.toml
            if let Some(file_name) = feat_file
                .file_name()
                .to_str()
                .filter(|f| f.ends_with(".md"))
            {
                let slug = file_name.trim_end_matches(".md").to_owned();

                let mut feat = Feat::new(version.clone(), slug.clone());

                let input = fs::read_to_string(feat_file.path()).unwrap();
                input.lines().skip(1).for_each(|l| {
                    if l.contains('=') {
                        let mut s = l.split('=');
                        let key = s.next().unwrap().trim().trim_matches('"');
                        let val = s.next().unwrap().trim().trim_matches('"');
                        match key {
                            "title" => feat.title = Some(val.to_owned()),
                            "flag" => feat.flag = Some(val.to_owned()),
                            "rfc_id" => feat.rfc = Some(val.parse::<u32>().unwrap()),
                            _ => {}
                        }
                    }
                });

                feats.push(feat.into_array());
            }
        }
    }

    let path = args.next();
    let path = Path::new(path.as_deref().unwrap_or(INDEX_PATH));
    fs::write(
        path,
        format!(
            "var caniuseIndex={};",
            serde_json::to_string(&feats).unwrap()
        ),
    )
    .unwrap();
}
