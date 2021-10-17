use std::{fs, path::Path};

use super::Task;
use argh::FromArgs;
use rayon::slice::ParallelSliceMut;
use serde::{Deserialize, Serialize};

const INDEX_PATH: &str = "../extension/index/rfcs.js";

/// Rfc-index task
#[derive(FromArgs)]
#[argh(subcommand, name = "rfcs")]
pub struct RfcsTask {
    /// rfc-index repository path
    #[argh(option, short = 'r')]
    repo_path: String,
    /// destination path
    #[argh(option, short = 'd', default = "INDEX_PATH.to_string()")]
    dest_path: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct RfcMetadata {
    pub number: u64,
    pub filename: String,
    pub start_date: String,
    pub title: Option<String>,
}

impl RfcMetadata {
    /// Convert to plain tuple.
    pub fn into_tuple(self) -> (u64, String, String, Option<String>) {
        // Convert file name to regular name.
        // "2515-type_alias_impl_trait.md" => "type_alias_impl_trait"
        let name = self
            .filename
            .trim_start_matches(char::is_numeric)
            .trim_end_matches(".md")
            .replacen('-', " ", 1)
            .trim()
            .to_owned();
        (self.number, name, self.start_date, self.title)
    }
}

impl Task for RfcsTask {
    fn execute(&self) -> crate::Result<()> {
        let mut data_dir = Path::new(&self.repo_path).to_path_buf();
        data_dir.push("metadata");
        let mut metadatas = vec![];
        for entry in fs::read_dir(data_dir)? {
            let file = entry?;
            if file.file_name() == "tags.json" {
                continue;
            }

            let metadata = serde_json::from_str::<RfcMetadata>(&fs::read_to_string(file.path())?)?;
            metadatas.push(metadata.into_tuple());
        }

        metadatas.par_sort_by(|a, b| a.0.cmp(&b.0));

        let path = Path::new(&self.dest_path);
        fs::write(
            path,
            format!("var rfcsIndex={};", serde_json::to_string(&metadatas)?),
        )?;

        Ok(())
    }
}
