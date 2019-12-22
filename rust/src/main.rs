use std::collections::HashMap;
use std::fs;
use std::env;
use std::path::Path;

use futures::future::join_all;
use serde_derive::Deserialize;
use serde_json;
use tokio;

mod minify;

const API: &str = "https://crates.io/api/v1/crates?page={}&per_page=100&sort=downloads";
const CRATES_INDEX_PATH: &str = "../extension/crates-index.js";

#[derive(Deserialize, Debug)]
struct CrateApiResponse {
    crates: Vec<Crate>,
}

#[derive(Deserialize, Debug)]
struct Crate {
    id: String,
    description: Option<String>,
    documentation: Option<String>,
    max_version: Option<String>,
}

async fn fetch_crates(page: u32) -> Result<Vec<Crate>, Box<dyn std::error::Error>> {
    let resp: CrateApiResponse = reqwest::get(&API.replace("{}", &page.to_string()))
        .await?
        .json()
        .await?;
    Ok(resp.crates)
}

async fn generate_javascript_crates_index(crates: Vec<Crate>) -> std::io::Result<String> {
    let mut contents = String::from("var N=null;");
    let crates_map: HashMap<String, [Option<String>; 3]> = crates
        .into_iter()
        .map(|item| {
            (
                item.id.to_lowercase(),
                [
                    item.description.map(minify::minify_description),
                    item.documentation.map(minify::minify_url),
                    item.max_version,
                ],
            )
        })
        .collect();
    let crate_index = format!(
        "var crateIndex={};",
        serde_json::to_string(&crates_map).unwrap()
    );
    contents.push_str(&minify::minify_json(crate_index));
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
        .flat_map(|item| item.unwrap_or_else(|error| {
            println!("{:?}", error);
            vec![]
        }))
        .collect();
    let contents = generate_javascript_crates_index(crates).await?;
    fs::write(path, &contents)?;
    println!("\nGenerate javascript crates index successful!");
    Ok(())
}
