use std::cmp::Reverse;
use std::collections::hash_map::Entry;
use std::collections::HashMap;
use std::fs;
use std::path::Path;

use argh::FromArgs;
use db_dump::crates::CrateId;
use rayon::prelude::*;

use semver::Version;
use serde::Deserialize;
use unicode_segmentation::UnicodeSegmentation;

use crate::frequency::FrequencyWord;
use crate::minify::Minifier;
use crate::tasks::Task;

const MAX_CRATE_SIZE: usize = 20 * 1000;
const CRATES_INDEX_PATH: &str = "../extension/index/crates.js";
// A prefix to filter out auto-generated google api crates.
// See https://github.com/huhu/rust-search-extension/issues/138
const GOOGLE_API_CRATES_FILTER_PREFIX: &str = "A complete library to interact with";

/// Crates task
#[derive(FromArgs)]
#[argh(subcommand, name = "crates")]
pub struct CratesTask {
    /// destination path
    #[argh(option, short = 'd', default = "CRATES_INDEX_PATH.to_string()")]
    dest_path: String,
    /// CSV path
    #[argh(option, short = 'p')]
    db_dump_path: String,
}

#[derive(Deserialize, Debug)]
struct Crate {
    name: String,
    description: String,
    #[serde(skip_deserializing, default = "default_version")]
    version: Version,
}

#[derive(Debug)]
struct WordCollector {
    words: Vec<String>,
}

impl WordCollector {
    fn new() -> Self {
        WordCollector { words: vec![] }
    }

    fn collect_crate_name(&mut self, name: &str) {
        self.words.extend(
            name.split(|c| c == '_' || c == '-')
                .filter(|c| c.len() >= 3)
                .map(String::from)
                .collect::<Vec<_>>(),
        )
    }

    fn collect_crate_description(&mut self, description: &str) {
        self.words.extend(
            description
                .trim()
                .unicode_words() // Tokenize the description into words.
                .filter(|word| word.len() >= 3)
                .take(100)
                .map(String::from)
                .collect::<Vec<_>>(),
        );
    }

    // Get the most frequent words.
    fn get_frequency_words(self) -> Vec<FrequencyWord> {
        // A word to frequency mapping. Such as <"cargo", 100>.
        let mut frequency_mapping: HashMap<String, usize> = HashMap::new();
        self.words.into_iter().for_each(|word| {
            let count = frequency_mapping.entry(word).or_insert(0);
            *count += 1;
        });
        let mut frequency_words = frequency_mapping
            .into_par_iter()
            .map(|(word, frequency)| FrequencyWord { word, frequency })
            .collect::<Vec<FrequencyWord>>();
        frequency_words.par_sort_by_key(|b| Reverse(b.score()));
        frequency_words
    }
}

fn default_version() -> Version {
    Version::parse("0.0.0").unwrap()
}

fn generate_javascript_crates_index(crates: &[Crate], minifier: &Minifier) -> String {
    let mut contents = String::from("var N=null;");
    // <name, [optional description, version]>
    let crates_map: HashMap<String, (String, &Version)> = crates
        .into_par_iter()
        .map(|item| {
            (
                minifier.minify_crate_name(&item.name),
                (
                    minifier.minify_description(item.description.replace('\n', " ").trim()),
                    &item.version,
                ),
            )
        })
        .collect();
    let crate_index = format!(
        "const crateIndex={};export default crateIndex;",
        serde_json::to_string(&crates_map).unwrap()
    );
    contents.push_str(&Minifier::minify_js(&crate_index));
    contents
}

impl Task for CratesTask {
    fn execute(&self) -> crate::Result<()> {
        let mut crates: Vec<Crate> = Vec::new();
        let mut crate_downloads = Vec::new();
        let mut latest_versions = HashMap::new();

        db_dump::Loader::new()
            .crate_downloads(|row| {
                crate_downloads.push(row);
            })
            .versions(|row| match latest_versions.entry(row.crate_id) {
                Entry::Vacant(entry) => {
                    entry.insert(row);
                }
                Entry::Occupied(mut entry) => {
                    if row.created_at > entry.get().created_at {
                        entry.insert(row);
                    }
                }
            })
            .load(&self.db_dump_path)?;

        // get top 20K of top downloaded crates
        crate_downloads.sort_by(|a, b| b.downloads.cmp(&a.downloads));
        let top_crates_id: Vec<CrateId> = crate_downloads
            .iter()
            .map(|row| row.crate_id)
            .take(MAX_CRATE_SIZE + 1000)
            .collect();

        db_dump::Loader::new()
            .crates(|row| {
                if !top_crates_id.contains(&row.id) {
                    return;
                }
                // Filter out auto-generated google api crates.
                if row.description.starts_with(GOOGLE_API_CRATES_FILTER_PREFIX) {
                    return;
                }
                crates.push(Crate {
                    name: row.name,
                    description: row.description,
                    version: latest_versions.get(&row.id).unwrap().num.clone(),
                });
            })
            .load(&self.db_dump_path)?;

        let mut collector = WordCollector::new();
        crates.iter().for_each(|item: &Crate| {
            collector.collect_crate_description(&item.description);
            collector.collect_crate_name(&item.name);
        });

        // Extract frequency word mapping
        let frequency_words = collector.get_frequency_words();
        let minifier = Minifier::new(&frequency_words);
        let mapping = minifier.get_key_to_word_mapping();
        let mut contents = format!(
            "let mapping=JSON.parse('{}');",
            serde_json::to_string(&mapping)?
        );
        contents.push_str(&generate_javascript_crates_index(&crates, &minifier));
        let path = Path::new(&self.dest_path);
        fs::write(path, &contents)?;
        println!("\nGenerate javascript crates index successful!");
        Ok(())
    }
}
