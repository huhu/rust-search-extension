use std::fs;
use std::path::Path;

use argh::FromArgs;
use futures::future::try_join_all;
use select::document::Document;
use select::node::Node;
use select::predicate::{Class, Name};
use serde::ser::SerializeTuple;
use serde::{Serialize, Serializer};
use serde_derive::{Deserialize, Serialize};
use tokio::runtime::Runtime;

use crate::minify::Minifier;
use crate::tasks::Task;

const BOOKS_INDEX_PATH: &str = "../extension/index/books.js";

/// Books task
#[argh(subcommand, name = "books")]
#[derive(FromArgs)]
pub struct BooksTask {
    /// destination path
    #[argh(option, short = 'd', default = "BOOKS_INDEX_PATH.to_string()")]
    dest_path: String,
}

#[derive(Debug)]
struct Page {
    title: String,
    path: String,
    parent_titles: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Book {
    name: String,
    url: String,
    #[serde(skip_deserializing)]
    pages: Vec<Page>,
}

impl Page {
    #[inline]
    fn parse(node: &Node) -> Option<Page> {
        if let Some(a) = node.first_child().filter(|n| n.is(Name("a"))) {
            let title = a.text();
            let path = a
                .attr("href")
                .unwrap()
                .trim_end_matches(".html")
                .to_string();

            Some(Page {
                title,
                path,
                parent_titles: None,
            })
        } else {
            None
        }
    }
}

impl Serialize for Page {
    #[inline]
    fn serialize<S>(&self, serializer: S) -> Result<<S as Serializer>::Ok, <S as Serializer>::Error>
    where
        S: Serializer,
    {
        let mut ser = serializer.serialize_tuple(3)?;
        ser.serialize_element(&self.title)?;
        ser.serialize_element(&self.path)?;
        ser.serialize_element(&self.parent_titles)?;
        ser.end()
    }
}

#[inline]
fn parse_node(node: &Node, parent_titles: Option<Vec<String>>) -> Vec<Page> {
    let mut pages = vec![];
    for child in node.children() {
        if child.is(Class("expanded")) || child.first_child().filter(|n| n.is(Name("a"))).is_some()
        {
            if let Some(mut page) = Page::parse(&child) {
                page.parent_titles = parent_titles.clone();
                pages.push(page);
            }
        } else {
            let mut new_parent_titles = parent_titles.clone().unwrap_or_default();
            if let Some(page) = child.prev().map(|n| Page::parse(&n)).flatten() {
                new_parent_titles.push(page.title);
                if let Some(section) = child.find(Class("section")).next() {
                    pages.extend(parse_node(&section, Some(new_parent_titles)))
                }
            }
        }
    }
    pages
}

async fn fetch_book(mut book: Book) -> Result<Book, Box<dyn std::error::Error>> {
    let html = reqwest::get(&book.url).await?.text().await?;
    let doc = Document::from(html.as_str());
    let node = doc.find(Class("chapter")).next().unwrap();
    book.pages = parse_node(&node, None);
    Ok(book)
}

impl Task for BooksTask {
    fn execute(&self) -> anyhow::Result<()> {
        let mut rt = Runtime::new()?;
        rt.block_on(self.run())?;
        Ok(())
    }
}

impl BooksTask {
    async fn run(&self) -> anyhow::Result<()> {
        let futures: Vec<_> = serde_json::from_str::<Vec<Book>>(include_str!("books.json"))?
            .into_iter()
            .map(fetch_book)
            .collect();
        match try_join_all(futures).await {
            Ok(result) => {
                let books: Vec<_> = result.into_iter().collect();
                let contents = format!(
                    "var N=null;var booksIndex={};",
                    serde_json::to_string(&books)?
                );
                let path = Path::new(&self.dest_path);
                fs::write(path, &Minifier::minify_js(contents)).unwrap();
            }
            Err(error) => {
                println!("{:?}", error);
            }
        }

        Ok(())
    }
}
