use anyhow::Result;

pub use books::BooksTask;
pub use caniuse::CaniuseTask;
pub use crates::CratesTask;
pub use labels::LabelsTask;
pub use lints::LintsTask;
pub use rust_blog_url::BlogUrlsTask;

mod books;
mod caniuse;
mod crates;
mod labels;
mod lints;
mod rust_blog_url;

pub trait Task {
    fn execute(&self) -> Result<()>;
}
