#![cfg(feature = "labels-index")]

use serde::ser::SerializeTuple;
use serde::{Serialize, Serializer};
use serde_derive::Deserialize;

use std::env;
use std::fs;
use std::path::Path;

const MAX_PAGE: u32 = 3;
const API: &str = "https://api.github.com/repos/rust-lang/rust/labels?page={}&per_page=100";
const LABELS_INDEX_PATH: &str = "../extension/index/labels.js";
const USER_AGENT: &str = "Rust Search Extension (lyshuhow@gmail.com)";

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

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().collect();
    let path_name = match args.get(1) {
        Some(path_name) => path_name,
        None => LABELS_INDEX_PATH,
    };

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
        Path::new(path_name),
        &format!(
            "var labelsIndex={};",
            serde_json::to_string(&labels).unwrap()
        ),
    )?;
    println!("\nGenerate javascript labels index successful!");
    Ok(())
}
