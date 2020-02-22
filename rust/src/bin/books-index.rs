use std::fs;
use std::path::Path;

use futures::future::try_join_all;
use reqwest;
use select::document::Document;
use select::node::Node;
use select::predicate::{Class, Name};
use serde::ser::SerializeTuple;
use serde::{Serialize, Serializer};
use serde_derive::{Deserialize, Serialize};
use serde_json;
use tokio;

use rust_search_extension::minify::Minifier;

const BOOKS_INDEX_PATH: &str = "../extension/index/books.js";

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
    fn parse(node: &Node) -> Self {
        let a = node.first_child().unwrap();
        let title = a.text();
        let path = a
            .attr("href")
            .unwrap()
            .trim_end_matches(".html")
            .to_string();
        Page {
            title,
            path,
            parent_titles: None,
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
        if child.is(Class("expanded"))
            || (child.first_child().is_some() && child.first_child().unwrap().is(Name("a")))
        {
            let mut page = Page::parse(&child);
            page.parent_titles = parent_titles.clone();
            pages.push(page);
        } else {
            let mut new_parent_titles = parent_titles.clone().unwrap_or_default();
            if let Some(page) = child.prev().map(|n| Page::parse(&n)) {
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

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
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
            let path = Path::new(BOOKS_INDEX_PATH);
            fs::write(path, &Minifier::minify_json(contents))?;
        }
        Err(error) => {
            println!("{:?}", error);
        }
    }

    Ok(())
}
