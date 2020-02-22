use std::fs;
use std::path::Path;

use futures::future::try_join_all;
use reqwest;
use select::document::Document;
use select::node::Node;
use select::predicate::{Class, Name};
use serde_derive::{Deserialize, Serialize};
use serde_json;
use tokio;

const BOOKS_INDEX_PATH: &str = "../extension/index/books.js";

#[derive(Serialize, Debug)]
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

fn parse_page(node: &Node) -> Page {
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

fn parse_node(node: &Node, parent_titles: Option<Vec<String>>) -> Vec<Page> {
    let mut pages = vec![];
    for child in node.children() {
        if child.is(Class("expanded"))
            || (child.first_child().is_some() && child.first_child().unwrap().is(Name("a")))
        {
            let mut page = parse_page(&child);
            page.parent_titles = parent_titles.clone();
            pages.push(page);
        } else {
            let mut new_parent_titles = parent_titles.clone().unwrap_or(vec![]);
            if let Some(page) = child.prev().map(|n| parse_page(&n)) {
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
        .map(|book| fetch_book(book))
        .collect();
    match try_join_all(futures).await {
        Ok(result) => {
            let books: Vec<_> = result.into_iter().collect();
            let contents = format!("var booksIndex={};", serde_json::to_string(&books)?);
            let path = Path::new(BOOKS_INDEX_PATH);
            fs::write(path, &contents)?;
        }
        Err(error) => {
            println!("{:?}", error);
        }
    }

    Ok(())
}