//! Build manage directory html pages.

use std::{error::Error, fs, io::Write, path::PathBuf, sync::mpsc::channel, time::Duration};

use notify::{watcher, Watcher};
use tera::{Context, Tera};

pub type Result<T> = std::result::Result<T, Box<dyn Error>>;

const TEMPLATES: [&str; 3] = ["index.html", "crates.html", "settings.html"];
const ASSETS: [&str; 3] = ["css", "js", "static"];
const BUILD_DIR: &str = "../extension/manage";

fn main() -> Result<()> {
    build()?;

    let (tx, rx) = channel();
    let mut watcher = watcher(tx, Duration::from_secs(1))?;
    watcher.watch("templates", notify::RecursiveMode::Recursive)?;

    loop {
        match rx.recv() {
            Ok(event) => {
                println!("Watched changed: {:?}", event);
                build()?
            }
            Err(err) => println!("watch error: {:?}", &err),
        }
    }
}

fn compile_sass() -> Result<()> {
    let mut options = sass_rs::Options::default();
    options.output_style = sass_rs::OutputStyle::Compressed;
    let content = sass_rs::compile_file("templates/sass/index.scss", options)?;
    let path = format!("{}/css/index.css", BUILD_DIR);
    fs::File::create(&path)?.write_all(&content.as_bytes())?;
    Ok(())
}

fn build() -> Result<()> {
    copy_asset()?;
    compile_sass()?;

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
