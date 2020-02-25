use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::Path;
use std::sync::RwLock;

use futures::future::try_join_all;
use reqwest;
use serde::{Deserialize, Deserializer};
use serde_derive::Deserialize;
use serde_json;
use tokio;
use tokio::time::Duration;

use lazy_static::lazy_static;
use rust_search_extension::minify::Minifier;

const MAX_PAGE: u32 = 200;
const API: &str = "https://crates.io/api/v1/crates?page={}&per_page=100&sort=downloads";
const CRATES_INDEX_PATH: &str = "../extension/index/crates.js";
const USER_AGENT: &str = "Rust Search Extension Bot (lyshuhow@gmail.com)";

lazy_static! {
    // A Vec to store all crate's id and description.
    static ref SPLITTED_WORDS: RwLock<Vec<String>> = RwLock::new(vec![]);
}

#[derive(Deserialize, Debug)]
struct CrateApiResponse {
    crates: Vec<Crate>,
}

#[derive(Deserialize, Debug)]
struct Crate {
    #[serde(deserialize_with = "deserialize_crate_id")]
    id: String,
    #[serde(deserialize_with = "deserialize_crate_description")]
    description: Option<String>,
    max_version: Option<String>,
}

#[inline]
fn deserialize_crate_id<'de, D>(d: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    let mut id = String::deserialize(d)?;
    id = id.replace("-", "_");
    for word in id
        .to_lowercase()
        .split(|c| c == '_')
        .filter(|c| c.len() >= 3)
        .collect::<Vec<_>>()
    {
        SPLITTED_WORDS.write().unwrap().push(word.to_string());
    }
    Ok(id)
}

#[inline]
fn deserialize_crate_description<'de, D>(d: D) -> Result<Option<String>, D::Error>
where
    D: Deserializer<'de>,
{
    Ok(Option::<String>::deserialize(d)?.map(|mut value| {
        value = value.trim().to_string();
        // Check char boundary to prevent panic
        if value.is_char_boundary(100) {
            value.truncate(100);
        }
        SPLITTED_WORDS.write().unwrap().push(value.clone());
        value
    }))
}

async fn fetch_crates(page: u32) -> Result<Vec<Crate>, Box<dyn std::error::Error>> {
    // Keep 1 second sleep interval to comply crates.io crawler policy.
    tokio::time::delay_for(Duration::from_secs((page - 1) as u64)).await;
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .user_agent(USER_AGENT)
        .build()?;
    let resp: CrateApiResponse = client
        .get(&API.replace("{}", &page.to_string()))
        .send()
        .await?
        .json()
        .await?;
    Ok(resp.crates)
}

async fn generate_javascript_crates_index(
    crates: Vec<Crate>,
    minifier: &Minifier,
) -> std::io::Result<String> {
    let mut contents = String::from("var N=null;");
    let crates_map: HashMap<String, [Option<String>; 2]> = crates
        .into_iter()
        .map(|item| {
            (
                minifier.mapping_minify_crate_id(item.id),
                [
                    item.description.map(|value| minifier.mapping_minify(value)),
                    item.max_version,
                ],
            )
        })
        .collect();
    let crate_index = format!(
        "var crateIndex={};",
        serde_json::to_string(&crates_map).unwrap()
    );
    contents.push_str(&Minifier::minify_json(crate_index));
    Ok(contents)
}

async fn try_fetch_all_crates() -> Result<Vec<Vec<Crate>>, Box<dyn std::error::Error>> {
    let mut futures = vec![];
    for page in 1..=MAX_PAGE {
        futures.push(fetch_crates(page));
    }

    try_join_all(futures).await
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let args: Vec<String> = env::args().collect();
    let path_name = match args.get(1) {
        Some(path_name) => path_name,
        None => CRATES_INDEX_PATH,
    };
    let path = Path::new(path_name);
    let mut retry = 0;
    loop {
        match try_fetch_all_crates().await {
            Ok(result) => {
                let crates = result.into_iter().flatten().collect();
                // Extract frequency word mapping
                let minifier = Minifier::new(&SPLITTED_WORDS.read().unwrap());
                let mapping = minifier.get_mapping();
                let mut contents = format!("var mapping={};", serde_json::to_string(&mapping)?);
                contents.push_str(&generate_javascript_crates_index(crates, &minifier).await?);
                fs::write(path, &contents)?;
                println!("\nGenerate javascript crates index successful!");
                break;
            }
            Err(error) => {
                retry += 1;
                println!("{} Error: {:?}", retry, error);
                if retry > 5 {
                    println!("Failed: exceed the max retry times...");
                    break;
                }
            }
        }
    }
    Ok(())
}
