mod ai;
mod app_state;
mod rooms;
mod server;
mod yjs;

use std::net::SocketAddr;
use std::sync::Arc;

use axum::{routing::{get, post}, Router};
use crate::app_state::AppState;
use crate::yjs::YjsDoc;

#[tokio::main]
async fn main() {
    // Load backend/.env (AI_API_KEY, AI_API_BASE, AI_MODEL…)
    dotenvy::dotenv().ok();

    let state = Arc::new(AppState::new());

    // Create the default room document at startup
    state
        .yjs_docs
        .write()
        .await
        .insert("default".to_string(), Arc::new(YjsDoc::new()));

    let app: Router<_> = Router::new()
        .route("/ws", get(server::ws_handler))
        .route("/api/rooms", post(server::create_room))
        .route("/api/rooms/:id", get(server::get_room))
        .route("/api/ai", post(ai::ai_proxy))
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("🚀 Backend listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
