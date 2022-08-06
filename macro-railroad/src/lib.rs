use railroad::RailroadNode;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[allow(dead_code)]
mod built_info {
    include!(concat!(env!("OUT_DIR"), "/built.rs"));
}

#[wasm_bindgen(start)]
pub fn start() {
    #[cfg(feature = "console_error_panic_hook")]
    set_panic_hook();

    log(&format!(
        "macro_railroad_ext built {} on {} using {}",
        built_info::BUILT_TIME_UTC,
        built_info::RUSTC_VERSION,
        built_info::DEPENDENCIES_STR
    ));
}

#[wasm_bindgen(js_name = getRailroadDefaultCss)]
pub fn get_railroad_default_css() -> JsValue {
    railroad::DEFAULT_CSS.into()
}

#[wasm_bindgen(js_name = getRailroadDigramCss)]
pub fn get_railroad_digram_css() -> JsValue {
    macro_railroad::diagram::CSS.into()
}

#[derive(Debug)]
#[wasm_bindgen]
pub struct DiagramOptions {
    #[wasm_bindgen(js_name = hideInternal)]
    pub hide_internal: bool,
    #[wasm_bindgen(js_name = keepGroups)]
    pub keep_groups: bool,
    #[wasm_bindgen(js_name = foldCommonTails)]
    pub foldcommontails: bool,
    #[wasm_bindgen(js_name = showLegend)]
    pub show_legend: bool,
}

#[wasm_bindgen]
pub struct Diagram {
    #[wasm_bindgen(readonly)]
    pub width: i64,
    svg: String,
}

#[wasm_bindgen]
impl Diagram {
    #[wasm_bindgen(getter)]
    pub fn svg(&self) -> String {
        self.svg.clone()
    }
}

#[wasm_bindgen]
impl DiagramOptions {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        DiagramOptions {
            hide_internal: true,
            keep_groups: true,
            foldcommontails: true,
            show_legend: true,
        }
    }
}

impl Default for DiagramOptions {
    fn default() -> Self {
        Self::new()
    }
}

/// Parse the given macro_rules!()-source, returns an SVG and it's preferred width
#[wasm_bindgen(js_name = toDiagram)]
pub fn to_diagram(src: &str, options: &DiagramOptions) -> Result<Diagram, JsValue> {
    log(&format!("{:?}", options));
    let macro_rules = macro_railroad::parser::parse(src)
        .map_err(|_| "Macro railroad parse failed.".to_string())?;
    let mut tree = macro_railroad::lowering::MacroRules::from(macro_rules);

    if options.hide_internal {
        tree.remove_internal();
    }
    if !options.keep_groups {
        tree.ungroup();
    }
    if options.foldcommontails {
        tree.foldcommontails();
    }
    tree.normalize();

    let dia = macro_railroad::diagram::into_diagram(tree, options.show_legend);
    let mut svg = dia.to_string();
    if svg.ends_with('\n') {
        svg.pop();
    }

    Ok(Diagram {
        width: dia.width(),
        svg,
    })
}

// When the `console_error_panic_hook` feature is enabled, we can call the
// `set_panic_hook` function at least once during initialization, and then
// we will get better error messages if our code ever panics.
//
// For more details see
// https://github.com/rustwasm/console_error_panic_hook#readme
#[cfg(feature = "console_error_panic_hook")]
pub fn set_panic_hook() {
    console_error_panic_hook::set_once();
}
