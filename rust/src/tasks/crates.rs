use std::cmp::{Ordering, Reverse};
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{BufReader, Read};
use std::path::Path;

use argh::FromArgs;
use csv::ReaderBuilder;
use libflate::gzip::Decoder;
use rayon::prelude::*;
use semver::Version;
use serde::de::DeserializeOwned;
use serde::Deserialize;
use tar::Archive;
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
    csv_path: String,
}

#[derive(Deserialize, Debug)]
struct Crate {
    #[serde(rename = "id")]
    crate_id: u64,
    name: String,
    downloads: u64,
    description: Option<String>,
    #[serde(skip_deserializing, default = "default_version")]
    version: Version,
}

#[derive(Deserialize, Debug)]
struct CrateVersion {
    crate_id: u64,
    num: Version,
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

fn read_csv<D: DeserializeOwned>(file: impl Read) -> crate::Result<Vec<D>> {
    let mut reader = ReaderBuilder::new().has_headers(true).from_reader(file);
    Ok(reader
        .deserialize()
        .filter_map(|record| match record {
            Ok(record) => Some(record),
            Err(err) => {
                println!("Deserialize csv record failed: {:?}", err);
                None
            }
        })
        .collect())
}

fn generate_javascript_crates_index(crates: &[Crate], minifier: &Minifier) -> String {
    let mut contents = String::from("var N=null;");
    // <name, [optional description, version]>
    let crates_map: HashMap<String, (Option<String>, &Version)> = crates
        .into_par_iter()
        .map(|item| {
            (
                minifier.minify_crate_name(&item.name),
                (
                    item.description.as_ref().map(|value| {
                        minifier.minify_description(value.replace('\n', " ").trim())
                    }),
                    &item.version,
                ),
            )
        })
        .collect();
    let crate_index = format!(
        "var crateIndex={};",
        serde_json::to_string(&crates_map).unwrap()
    );
    contents.push_str(&Minifier::minify_js(&crate_index));
    contents
}

impl Task for CratesTask {
    fn execute(&self) -> crate::Result<()> {
        let mut crates: Vec<Crate> = Vec::new();
        let mut versions: Vec<CrateVersion> = Vec::new();

        let mut archive = Archive::new(Decoder::new(BufReader::new(File::open(&self.csv_path)?))?);
        for file in archive.entries()? {
            let file = file?;

            if let Some(filename) = file.path()?.file_name().and_then(|f| f.to_str()) {
                match filename {
                    "crates.csv" => {
                        println!("{:?}", file.path()?);
                        crates = read_csv(file)?;
                    }
                    "versions.csv" => {
                        println!("{:?}", file.path()?);
                        versions = read_csv(file)?;
                    }
                    _ => {}
                }
            }
        }
        crates.retain(|c| {
            // Filter out auto-generated google api crates.
            c.description.is_none() || matches!(c.description.as_ref(), Some(d) if !d.starts_with(GOOGLE_API_CRATES_FILTER_PREFIX))
        });
        crates.par_sort_unstable_by(|a, b| b.downloads.cmp(&a.downloads));
        crates = crates.into_iter().take(MAX_CRATE_SIZE).collect();

        // A <crate_id, latest_version> map to store the latest version of each crate.
        let mut latest_versions = HashMap::<u64, Version>::with_capacity(versions.len());
        versions.into_iter().for_each(|cv| {
            let num = cv.num;
            latest_versions
                .entry(cv.crate_id)
                .and_modify(|v| {
                    if (*v).cmp(&num) == Ordering::Less {
                        *v = num.clone();
                    }
                })
                .or_insert(num);
        });

        let mut collector = WordCollector::new();
        crates.iter_mut().for_each(|item: &mut Crate| {
            if let Some(version) = latest_versions.remove(&item.crate_id) {
                // Update the latest version of the crate.
                item.version = version;
            }

            if let Some(description) = &item.description {
                collector.collect_crate_description(description);
            }
            collector.collect_crate_name(&item.name);
        });

        // Extract frequency word mapping
        let frequency_words = collector.get_frequency_words();
        let minifier = Minifier::new(&frequency_words);
        let mapping = minifier.get_key_to_word_mapping();
        let mut contents = format!(
            "var mapping=JSON.parse('{}');",
            serde_json::to_string(&mapping)?
        );
        contents.push_str(&generate_javascript_crates_index(&crates, &minifier));
        let path = Path::new(&self.dest_path);
        fs::write(path, &contents)?;
        println!("\nGenerate javascript crates index successful!");
        Ok(())
    }
}
