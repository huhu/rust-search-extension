use std::fs;
use std::path::Path;

use argh::FromArgs;
use regex::Regex;

use crate::tasks::Task;

const INDEX_PATH: &str = "../extension/index/caniuse.js";

/// Caniuse task
///
/// Expects one argument, path to caniuse.rs repo
/// Optional 2nd argument, path to output
#[derive(FromArgs)]
#[argh(subcommand, name = "caniuse")]
pub struct CaniuseTask {
    /// caniuse.rs repository path
    #[argh(option, short = 'r')]
    repo_path: String,
    /// destination path
    #[argh(option, short = 'd', default = "INDEX_PATH.to_string()")]
    dest_path: String,
}

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

impl Task for CaniuseTask {
    fn execute(&self) -> crate::Result<()> {
        let mut data_dir = Path::new(&self.repo_path).to_path_buf();
        data_dir.push("data");

        // Use regex to match key and value.
        let regex = Regex::new(r"(?P<key>[_a-z0-9]*)\s*=\s*(?P<value>.*)")?;
        let mut feats = vec![];

        for vd in fs::read_dir(data_dir)? {
            let version_dir = vd?;
            let version = version_dir.file_name().to_str().unwrap().to_owned();
            if version_dir.path().is_file() {
                // Skip files
                continue;
            }

            for ff in fs::read_dir(version_dir.path())? {
                let feat_file = ff?;
                // Ignore non-markdown files, such as version.toml
                if let Some(file_name) = feat_file
                    .file_name()
                    .to_str()
                    .filter(|f| f.ends_with(".toml"))
                {
                    let slug = file_name.trim_end_matches(".toml").to_owned();

                    let mut feat = Feat::new(version.clone(), slug.clone());

                    let input = fs::read_to_string(feat_file.path())?;
                    input.lines().for_each(|l| {
                        if let Some(c) = regex.captures(l) {
                            let key = c.name("key").unwrap().as_str().trim().trim_matches('"');
                            let value = c.name("value").unwrap().as_str().trim().trim_matches('"');

                            match key {
                                "title" => feat.title = Some(value.replace("\\\"", "\"")),
                                "flag" => feat.flag = Some(value.to_owned()),
                                "rfc_id" => feat.rfc = value.parse::<u32>().ok(),
                                _ => {}
                            }
                        }
                    });

                    feats.push(feat.into_array());
                }
            }
        }

        let path = Path::new(&self.dest_path);
        fs::write(
            path,
            format!("var caniuseIndex={};", serde_json::to_string(&feats)?),
        )?;
        Ok(())
    }
}
