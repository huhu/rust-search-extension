use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::Path;
use std::sync::RwLock;

use futures::future::join_all;
use reqwest;
use serde::{Deserialize, Deserializer};
use serde_derive::Deserialize;
use serde_json;
use tokio;
use tokio::time::Duration;

use lazy_static::lazy_static;
use minify::Minifier;

mod minify;

const API: &str = "https://crates.io/api/v1/crates?page={}&per_page=100&sort=downloads";
const CRATES_INDEX_PATH: &str = "../extension/crates-index.js";
const USER_AGENT: &str = "Rust Search Extension Bot (lyshuhow@gmail.com)";

lazy_static! {
    // A Vec to store all crate's description.
    static ref STRING_VEC: RwLock<Vec<String>> = RwLock::new(vec![]);
}

#[derive(Deserialize, Debug)]
struct CrateApiResponse {
    crates: Vec<Crate>,
}

#[derive(Deserialize, Debug)]
struct Crate {
    id: String,
    #[serde(deserialize_with = "deserialize_crate_description")]
    description: Option<String>,
    documentation: Option<String>,
    max_version: Option<String>,
}

fn deserialize_crate_description<'de, D>(d: D) -> Result<Option<String>, D::Error>
where
    D: Deserializer<'de>,
{
    Ok(Option::<String>::deserialize(d)?.map(|mut value| {
        value = value.trim().to_string();
        value.truncate(100);
        STRING_VEC.write().unwrap().push(value.clone());
        value
    }))
}

async fn fetch_crates(page: u32) -> Result<Vec<Crate>, Box<dyn std::error::Error>> {
    // Keep 1 second sleep interval to comply crates.io crawler policy.
    tokio::time::delay_for(Duration::from_secs((page - 1) as u64)).await;
    let client = reqwest::Client::builder().user_agent(USER_AGENT).build()?;
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
    let crates_map: HashMap<String, [Option<String>; 3]> = crates
        .into_iter()
        .map(|item| {
            (
                item.id.to_lowercase(),
                [
                    item.description.map(|value| minifier.mapping_minify(value)),
                    item.documentation.map(Minifier::minify_url),
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

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let args: Vec<String> = env::args().collect();
    let path_name = match args.get(1) {
        Some(path_name) => path_name,
        None => CRATES_INDEX_PATH,
    };
    let path = Path::new(path_name);

    let mut futures = vec![];
    for page in 1..=100 {
        futures.push(fetch_crates(page));
    }
    let crates: Vec<Crate> = join_all(futures)
        .await
        .into_iter()
        .flat_map(|item| {
            item.unwrap_or_else(|error| {
                println!("{:?}", error);
                vec![]
            })
        })
        .collect();
    // Extract frequency word mapping
    let minifier = Minifier::new(&STRING_VEC.read().unwrap(), 25);
    let mapping = minifier.get_mapping();
    let mut contents = format!("var M={};", serde_json::to_string(&mapping).unwrap());
    contents.push_str(&generate_javascript_crates_index(crates, &minifier).await?);
    fs::write(path, &contents)?;
    println!("\nGenerate javascript crates index successful!");
    Ok(())
}
