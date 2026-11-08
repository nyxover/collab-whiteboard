use axum::{
    extract::{ws::Message, Path, State, WebSocketUpgrade},
    response::{IntoResponse, Json},
};
use base64::Engine;
use futures_util::{SinkExt, StreamExt};
use serde_json::Value;
use std::sync::Arc;
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::app_state::AppState;
use crate::rooms::Room;
use crate::yjs::YjsDoc;

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(socket: axum::extract::ws::WebSocket, state: Arc<AppState>) {
    let user_id = Uuid::new_v4().to_string()[..8].to_string();
    let room_id = "default".to_string();

    // Send the current document state to the new client (Yjs binary update, base64 encoded)
    let doc_state_b64: String = {
        let docs = state.yjs_docs.read().await;
        match docs.get(&room_id) {
            Some(doc) => base64::engine::general_purpose::STANDARD.encode(doc.encode_state()),
            None => String::new(),
        }
    };

    let (mut sender, mut receiver) = socket.split();

    let welcome = serde_json::json!({
        "type": "welcome",
        "user_id": user_id,
        "room_id": room_id,
        "state": doc_state_b64,
    });
    let _ = sender.send(Message::Text(welcome.to_string())).await;

    // Forward broadcast messages to this client
    {
        let mut rx = state.tx.subscribe();
        tokio::spawn(async move {
            loop {
                match rx.recv().await {
                    Ok(m) => {
                        if sender.send(Message::Text(m)).await.is_err() {
                            break;
                        }
                    }
                    Err(broadcast::error::RecvError::Lagged(_)) => continue,
                    Err(_) => break,
                }
            }
        });
    }

    // Handle incoming messages from this client
    while let Some(msg) = receiver.next().await {
        let Ok(msg) = msg else { break };
        let Message::Text(text) = msg else { continue };

        let Ok(json_val) = serde_json::from_str::<Value>(&text) else { continue };
        let Some(msg_type) = json_val["type"].as_str() else { continue };

        match msg_type {
            "join" => {}
            "message" => {
                if let Some(chat_text) = json_val["text"].as_str() {
                    // Chat message: broadcast to every connected client
                    let msg = serde_json::json!({
                        "type": "message",
                        "room_id": room_id,
                        "user": user_id,
                        "text": chat_text,
                    });
                    let _ = state.tx.send(msg.to_string());
                }
            }
            "update" => {
                if let Some(update_b64) = json_val["update"].as_str() {
                    let update_bytes = base64::engine::general_purpose::STANDARD
                        .decode(update_b64)
                        .unwrap_or_default();
                    {
                        let docs = state.yjs_docs.read().await;
                        if let Some(doc) = docs.get(&room_id) {
                            doc.apply_update(&update_bytes);
                        }
                    }

                    // Broadcast to every subscriber (this client incl. via its rx)
                    let response = serde_json::json!({
                        "type": "update_ack",
                        "room_id": room_id,
                        "user_id": user_id,
                        "update": update_b64,
                    });
                    let _ = state.tx.send(response.to_string());
                }
            }
            _ => {}
        }
    }
}

pub async fn create_room(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<Value>,
) -> Json<Value> {
    let name = payload["name"].as_str().map(|s| s.to_string());
    let mut rooms = state.rooms.write().await;
    let room: Room = rooms.create_room(name);

    // Create an empty Yjs document for this room
    {
        let mut docs = state.yjs_docs.write().await;
        docs.entry(room.id.clone())
            .or_insert_with(|| Arc::new(YjsDoc::new()));
    }
    drop(rooms);

    Json(serde_json::json!({
        "id": room.id,
        "name": room.name,
        "created_at": room.created_at
    }))
}

pub async fn get_room(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Json<Value> {
    let rooms = state.rooms.read().await;
    if let Some(room) = rooms.get_room(&id) {
        Json(serde_json::json!({
            "id": room.id,
            "name": room.name,
            "created_at": room.created_at,
            "users": room.users
        }))
    } else {
        Json(serde_json::json!({ "error": "Room not found" }))
    }
}
