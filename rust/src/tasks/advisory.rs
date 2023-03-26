use argh::FromArgs;
use rayon::prelude::*;
use rustsec::{database::Query, Collection, Database};
use std::{collections::HashMap, fs, io::Write, path::Path};

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
        map.par_iter_mut().for_each(|(package, advisories)| {
            // sort advisories by date
            advisories.sort_by(|a, b| b.metadata.date.cmp(&a.metadata.date));
            let package = package.as_str().replace('-', "_");
            let mut file = fs::File::create(path.join(format!("{package}.json"))).unwrap();
            let json = serde_json::to_string_pretty(&advisories).unwrap();
            file.write_all(json.as_bytes()).unwrap();
        });
        Ok(())
    }
}
