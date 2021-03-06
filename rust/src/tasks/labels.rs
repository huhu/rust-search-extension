use std::fs;
use std::path::Path;

use argh::FromArgs;
use serde::ser::SerializeTuple;
use serde::{Serialize, Serializer};
use serde_derive::Deserialize;
use tokio::runtime::Runtime;

use crate::tasks::Task;

const MAX_PAGE: u32 = 3;
const API: &str = "https://api.github.com/repos/rust-lang/rust/labels?page={}&per_page=100";
const LABELS_INDEX_PATH: &str = "../extension/index/labels.js";
const USER_AGENT: &str = "Rust Search Extension (lyshuhow@gmail.com)";

/// Github issue labels task
#[argh(subcommand, name = "labels")]
#[derive(FromArgs)]
pub struct LabelsTask {
    /// destination path
    #[argh(option, short = 'd', default = "LABELS_INDEX_PATH.to_string()")]
    dest_path: String,
}

#[derive(Deserialize, Debug)]
struct Label {
    name: String,
    description: Option<String>,
}

impl Serialize for Label {
    #[inline]
    fn serialize<S>(&self, serializer: S) -> Result<<S as Serializer>::Ok, <S as Serializer>::Error>
    where
        S: Serializer,
    {
        let mut ser = serializer.serialize_tuple(2)?;
        ser.serialize_element(&self.name)?;
        ser.serialize_element(&self.description.as_ref().unwrap_or(&"".to_string()))?;
        ser.end()
    }
}

impl Task for LabelsTask {
    fn execute(&self) -> crate::Result<()> {
        let mut rt = Runtime::new()?;
        rt.block_on(self.run())?;
        Ok(())
    }
}

impl LabelsTask {
    async fn run(&self) -> crate::Result<()> {
        let mut labels = vec![];
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .user_agent(USER_AGENT)
            .build()?;
        for page in 1..=MAX_PAGE {
            labels.extend(
                client
                    .get(&API.replace("{}", &page.to_string()))
                    .send()
                    .await?
                    .json::<Vec<Label>>()
                    .await?,
            );
        }
        fs::write(
            Path::new(&self.dest_path),
            &format!(
                "var labelsIndex={};",
                serde_json::to_string(&labels).unwrap()
            ),
        )?;
        println!("\nGenerate javascript labels index successful!");
        Ok(())
    }
}
