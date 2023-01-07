//! Build manage directory html pages.

use std::{error::Error, fs, sync::mpsc::channel, time::Duration};

use minijinja::{context, Environment, Source};
use notify::{watcher, Watcher};

pub type Result<T> = std::result::Result<T, Box<dyn Error>>;

const TEMPLATES: [&str; 5] = [
    "index.html",
    "crates.html",
    "settings.html",
    "export.html",
    "redirect.html",
];
const BUILD_DIR: &str = "../extension/manage";

fn main() -> Result<()> {
    build()?;

    if matches!(std::env::args().nth(1).as_deref(), Some("-w" | "--watch")) {
        println!("Watching...");

        let (tx, rx) = channel();
        let mut watcher = watcher(tx, Duration::from_secs(1))?;
        watcher.watch("templates", notify::RecursiveMode::Recursive)?;

        loop {
            match rx.recv() {
                Ok(event) => {
                    println!("Changed: {:?}", event);
                    build()?
                }
                Err(err) => println!("watch error: {:?}", &err),
            }
        }
    }
    {
        println!("Build success!");
    }

    Ok(())
}

fn build() -> Result<()> {
    let mut env = Environment::new();
    env.set_source(Source::from_path("templates"));
    for template in TEMPLATES.iter() {
        let path = format!("{}/{}", BUILD_DIR, template);
        let template = env.get_template(template)?;

        template.render_to_write(context! {}, fs::File::create(path)?)?;
    }

    Ok(())
}
