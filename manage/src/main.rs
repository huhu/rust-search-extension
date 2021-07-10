//! Build manage directory html pages.

use std::{error::Error, fs, io::Write, path::PathBuf};

use tera::{Context, Tera};

pub type Result<T> = std::result::Result<T, Box<dyn Error>>;

const TEMPLATES: [&str; 3] = ["index.html", "crates.html", "settings.html"];
const ASSETS: [&str; 3] = ["css", "js", "static"];
const BUILD_DIR: &str = "../extension/manage";

fn main() -> Result<()> {
    copy_asset()?;

    let tera = Tera::new("templates/*.html")?;
    let context = Context::new();
    for template in TEMPLATES.iter() {
        let mut buf = vec![];
        tera.render_to(template, &context, &mut buf)?;
        let path = format!("{}/{}", BUILD_DIR, template);
        fs::File::create(&path)?.write_all(&buf)?;
    }
    Ok(())
}

fn copy_asset() -> Result<()> {
    for asset in ASSETS.iter() {
        let path = format!("templates/{}", asset);
        for entry in fs::read_dir(&path)? {
            let entry = entry?;
            let from = entry.path();
            if let Some(file_name) = from.file_name() {
                let mut to = PathBuf::new();
                to.push(format!("{}/{}", BUILD_DIR, asset));
                if !to.exists() {
                    fs::create_dir_all(&to)?;
                }

                to.push(file_name.to_string_lossy().to_string());
                fs::copy(from, to)?;
            }
        }
    }
    Ok(())
}
