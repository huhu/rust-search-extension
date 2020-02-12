use std::fs;
use std::path::Path;

use futures::future::join_all;
use reqwest;
use select::document::Document;
use select::predicate::{Class, Name, Predicate};
use serde_derive::{Deserialize, Serialize};
use serde_json;
use tokio;

const BOOKS_INDEX_PATH: &str = "../extension/index/books.js";

// [title, path]
type Chapter = [String; 2];

#[derive(Serialize, Deserialize, Debug)]
struct Book {
    name: String,
    url: String,
    #[serde(skip_deserializing)]
    chapters: Vec<Chapter>,
}

async fn fetch_book(mut book: Book) -> Result<Book, Box<dyn std::error::Error>> {
    let html = reqwest::get(&book.url).await?.text().await?;
    let doc = Document::from(html.as_str());
    for node in doc.find(Class("chapter").descendant(Name("a"))) {
        let title = node.text();
        let path = node
            .attr("href")
            .unwrap()
            .trim_end_matches(".html")
            .to_string();
        book.chapters.push([title, path]);
    }
    Ok(book)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let futures: Vec<_> = serde_json::from_str::<Vec<Book>>(include_str!("books.json"))?
        .into_iter()
        .map(|book| fetch_book(book))
        .collect();
    let books: Vec<Book> = join_all(futures).await.into_iter().flatten().collect();
    let contents = serde_json::to_string(&books)?;
    let path = Path::new(BOOKS_INDEX_PATH);
    fs::write(path, &contents)?;
    Ok(())
}
