use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

use argh::FromArgs;
use select::document::Document;
use select::predicate::Name;
use serde::Serialize;
use tokio::runtime::Runtime;

use super::Task;

const TARGETS_INDEX_PATH: &str = "../extension/index/targets.js";

/// Target task
#[derive(FromArgs)]
#[argh(subcommand, name = "targets")]
pub struct TargetsTask {
    /// destination path
    #[argh(option, short = 'd', default = "TARGETS_INDEX_PATH.to_string()")]
    dest_path: String,
}

#[derive(Serialize)]
struct Tier {
    url: String,
    items: Vec<(String, String)>,
}

impl Task for TargetsTask {
    fn execute(&self) -> crate::Result<()> {
        let rt = Runtime::new()?;
        rt.block_on(self.run())?;
        Ok(())
    }
}

static URL: &str = "https://doc.rust-lang.org/rustc/platform-support.html";

impl TargetsTask {
    async fn run(&self) -> crate::Result<()> {
        let mut map = BTreeMap::new();
        // map.insert("url", url);

        let document = fetch_html(URL).await?;
        let mut tbody = document.find(Name("tbody"));

        let tier1 = tbody.next().expect("No tier 1 targets found");
        map.insert(
            "Tier 1",
            Tier {
                url: format!("{URL}#tier-1-with-host-tools"),
                items: tier1
                    .find(Name("tr"))
                    .map(|tr| {
                        (
                            tr.first_child().expect("Parse tier 1 target failed").text(),
                            tr.last_child()
                                .expect("Parse tier 1 target failed")
                                .text()
                                .trim_end_matches(char::is_numeric)
                                .to_owned(),
                        )
                    })
                    .collect::<Vec<_>>(),
            },
        );
        let tier2_with_host = tbody.next().expect("No tier 2 with host targets found");
        map.insert(
            "tier 2",
            Tier {
                url: format!("{URL}#tier-2-with-host-tools"),
                items: tier2_with_host
                    .find(Name("tr"))
                    .map(|tr| {
                        (
                            tr.first_child().expect("Parse tier 2 target failed").text(),
                            tr.last_child().expect("Parse tier 2 target failed").text(),
                        )
                    })
                    .collect::<Vec<_>>(),
            },
        );

        let tier2 = tbody.next().expect("No tier 2 targets found");
        map.insert(
            "Tier 2",
            Tier {
                url: format!("{URL}#tier-2"),
                items: tier2
                    .find(Name("tr"))
                    .map(|tr| {
                        (
                            tr.first_child().expect("Parse tier 2 target failed").text(),
                            tr.last_child().expect("Parse tier 2 target failed").text(),
                        )
                    })
                    .collect::<Vec<_>>(),
            },
        );

        let tier3 = tbody.next().expect("No tier 3 targets found");
        map.insert(
            "Tier 3",
            Tier {
                url: format!("{URL}#tier-3"),
                items: tier3
                    .find(Name("tr"))
                    .map(|tr| {
                        (
                            tr.first_child().expect("Parse tier 3 target failed").text(),
                            tr.last_child().expect("Parse tier 3 target failed").text(),
                        )
                    })
                    .collect::<Vec<_>>(),
            },
        );

        fs::write(
            Path::new(&self.dest_path),
            format!("const targetsIndex={};export default targetsIndex;", serde_json::to_string(&map).unwrap()),
        )?;
        println!("\nGenerate targets index successful!");
        Ok(())
    }
}

async fn fetch_html(url: &'static str) -> crate::Result<Document> {
    let html = reqwest::get(url).await?.text().await?;
    let doc = Document::from(html.as_str());
    Ok(doc)
}
