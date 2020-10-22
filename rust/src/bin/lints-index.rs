use serde_derive::Deserialize;

use rust_search_extension::minify::Minifier;
use std::clone::Clone;
use std::collections::HashMap;
use std::path::Path;
use std::{env, fs};

const LINT_URL: &str = "https://rust-lang.github.io/rust-clippy/master/lints.json";
const LINTS_INDEX_PATH: &str = "../extension/index/lints.js";

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
    let lints = reqwest::get(LINT_URL).await?.json().await?;
    Ok(lints)
}

#[tokio::main]
async fn main() -> Result<()> {
    let args: Vec<String> = env::args().collect();
    let path_name = match args.get(1) {
        Some(path_name) => path_name,
        None => LINTS_INDEX_PATH,
    };
    let lints: HashMap<String, [String; 2]> = fetch_clippy_lints()
        .await?
        .iter()
        .map(|lint| {
            let mut desc = lint.docs.desc.to_string();
            desc = desc.replace("`", "");
            desc.truncate(100);
            (lint.id.clone(), [lint.level.to_string(), desc])
        })
        .collect();

    let contents = format!("var lintsIndex={};", serde_json::to_string(&lints)?);
    let path = Path::new(path_name);
    fs::write(path, &Minifier::minify_js(contents))?;
    println!("\nGenerate javascript lints index successful!");
    Ok(())
}
