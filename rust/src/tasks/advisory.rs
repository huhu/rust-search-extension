use std::{collections::HashMap, fs, io::Write, path::Path};

use argh::FromArgs;
use rustsec::{database::Query, Collection, Database};

use super::Task;

const ADVISORY_INDEX_PATH: &str = "../docs/static/advisory";

/// Advisory task
#[derive(FromArgs)]
#[argh(subcommand, name = "advisory")]
pub struct AdvisoryTask {
    /// destination path
    #[argh(option, short = 'd', default = "ADVISORY_INDEX_PATH.to_string()")]
    dest_path: String,
}

impl Task for AdvisoryTask {
    fn execute(&self) -> crate::Result<()> {
        let mut map = HashMap::new();
        let db = Database::fetch()?;
        for advisory in db
            .query(&Query::new().collection(Collection::Crates).withdrawn(false))
            .into_iter()
        {
            map.entry(&advisory.metadata.package)
                .or_insert_with(Vec::new)
                .push(advisory);
        }

        let path = Path::new(&self.dest_path);
        if !path.exists() {
            fs::create_dir(path)?;
        }
        for (package, advisories) in map {
            let package = package.as_str().replace('-', "_");
            let mut file = fs::File::create(path.join(format!("{package}.json")))?;
            let json = serde_json::to_string_pretty(&advisories)?;
            file.write_all(json.as_bytes())?;
        }
        Ok(())
    }
}
