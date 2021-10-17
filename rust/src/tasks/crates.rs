use std::collections::HashMap;
use std::collections::HashSet;
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

use crate::minify::Minifier;
use crate::tasks::Task;

const MAX_CRATE_SIZE: usize = 20 * 1000;
const CRATES_INDEX_PATH: &str = "../extension/index/crates.js";

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
    id: u64,
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

    #[inline]
    fn collect_crate_id(&mut self, value: &str) {
        let id = value.replace("-", "_");
        for word in id
            .to_lowercase()
            .split(|c| c == '_')
            .filter(|c| c.len() >= 3)
            .collect::<Vec<_>>()
        {
            self.words.push(word.to_string());
        }
    }

    #[inline]
    fn collect_crate_description(&mut self, value: &str) {
        let mut description = value.trim().to_string();
        // Check char boundary to prevent panic
        if description.is_char_boundary(100) {
            description.truncate(100);
        }
        self.words.push(description);
    }
}

fn default_version() -> Version {
    Version::parse("0.0.0").unwrap()
}

fn read_csv<D: DeserializeOwned>(file: impl Read) -> crate::Result<Vec<D>> {
    let mut reader = ReaderBuilder::new().has_headers(true).from_reader(file);
    Ok(reader.deserialize().map(|record| record.unwrap()).collect())
}

fn generate_javascript_crates_index(crates: Vec<Crate>, minifier: &Minifier) -> String {
    let mut contents = String::from("var N=null;");
    let crates_map: HashMap<String, (Option<String>, Version)> = crates
        .into_par_iter()
        .map(|item| {
            (
                minifier.mapping_minify_crate_id(item.name),
                (
                    item.description
                        .map(|value| value.replace("\n", "").trim().to_string())
                        .map(|value| minifier.mapping_minify(value)),
                    item.version,
                ),
            )
        })
        .collect();
    let crate_index = format!(
        "var crateIndex={};",
        serde_json::to_string(&crates_map).unwrap()
    );
    contents.push_str(&Minifier::minify_js(crate_index));
    contents
}

impl Task for CratesTask {
    fn execute(&self) -> crate::Result<()> {
        let mut crates: Vec<Crate> = Vec::with_capacity(0);
        let mut versions: Vec<CrateVersion> = Vec::with_capacity(0);

        let mut archive = Archive::new(Decoder::new(BufReader::new(File::open(&self.csv_path)?))?);
        let entries = archive.entries()?.filter(|entry| {
            // Only filter the file we needed.
            entry
                .as_ref()
                .unwrap()
                .path()
                .unwrap()
                .file_name()
                .and_then(|f| f.to_str())
                .map(|f| ["crates.csv", "versions.csv"].contains(&f))
                .unwrap()
        });
        for file in entries {
            let file = file?;
            println!("{:?}", file.path()?);

            if let Some(filename) = file.path()?.file_name().and_then(|f| f.to_str()) {
                match filename {
                    "crates.csv" => {
                        crates = read_csv(file)?;
                    }
                    "versions.csv" => {
                        versions = read_csv(file)?;
                    }
                    _ => {}
                }
            }
        }
        crates.sort_unstable_by(|a, b| b.downloads.cmp(&a.downloads));
        crates = crates.drain(0..MAX_CRATE_SIZE).collect();
        versions.sort_unstable_by(|a, b| b.num.cmp(&a.num));
        // Filter out duplicated version to speed up find in the later.
        let mut unique_crate_ids: HashSet<u64> = HashSet::with_capacity(2 * MAX_CRATE_SIZE);
        // retain() faster than iterator's filter().
        versions.retain(|v| {
            if unique_crate_ids.contains(&v.crate_id) {
                return false;
            }
            unique_crate_ids.insert(v.crate_id);
            true
        });
        let mut collector = WordCollector::new();
        crates.iter_mut().for_each(|item: &mut Crate| {
            // Call position() then to remove() the item could be faster than find().
            if let Some(position) = versions.par_iter().position_any(|v| v.crate_id == item.id) {
                item.version = versions.remove(position).num;
            }

            if let Some(description) = &item.description {
                collector.collect_crate_description(description);
            }
            collector.collect_crate_id(&item.name);
        });

        // Extract frequency word mapping
        let minifier = Minifier::new(&collector.words);
        let mapping = minifier.get_mapping();
        let mut contents = format!("var mapping={};", serde_json::to_string(&mapping)?);
        contents.push_str(&generate_javascript_crates_index(crates, &minifier));
        let path = Path::new(&self.dest_path);
        fs::write(path, &contents)?;
        println!("\nGenerate javascript crates index successful!");
        Ok(())
    }
}
