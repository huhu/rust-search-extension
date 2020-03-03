use std::clone::Clone;
use std::collections::HashMap;
use std::fs;
use std::path::Path;

use reqwest;
use serde_derive::Deserialize;
use tokio;

use rust_search_extension::minify::Minifier;

const CLIPPY_URL: &'static str = "https://rust-lang.github.io/rust-clippy/master/";
const LINTS_INDEX_PATH: &'static str = "../extension/index/lints.js";

type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

#[derive(Deserialize, Debug)]
enum LintLevel {
    Allow,
    Warn,
    Deny,
    Deprecated,
}

impl ToString for LintLevel {
    fn to_string(&self) -> String {
        match self {
            Self::Allow => "Allow".to_string(),
            Self::Warn => "Warn".to_string(),
            Self::Deny => "Deny".to_string(),
            Self::Deprecated => "Deprecated".to_string(),
        }
    }
}

#[derive(Deserialize, Debug)]
struct LintDocs {
    #[serde(rename(deserialize = "What it does"))]
    desc: String,
}

#[derive(Deserialize, Debug)]
struct Lint {
    id: String,
    level: LintLevel,
    docs: LintDocs,
}

async fn fetch_clippy_lints() -> Result<Vec<Lint>> {
    let lints = reqwest::get(&format!("{}/lints.json", CLIPPY_URL))
        .await?
        .json()
        .await?;
    Ok(lints)
}

#[tokio::main]
async fn main() -> Result<()> {
    let lints: HashMap<String, [String; 2]> = fetch_clippy_lints()
        .await?
        .iter()
        .map(|lint| {
            let mut desc = lint.docs.desc.to_string();
            desc.truncate(60);
            (lint.id.clone(), [lint.level.to_string(), desc])
        })
        .collect();

    let contents = format!("var lintsIndex={};", serde_json::to_string(&lints)?);
    let path = Path::new(LINTS_INDEX_PATH);
    fs::write(path, &Minifier::minify_json(contents))?;
    println!("\nGenerate javascript lints index successful!");
    Ok(())
}
