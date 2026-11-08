use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};

use crate::rooms::RoomManager;
use crate::yjs::YjsDoc;

pub struct AppState {
    pub rooms: Arc<RwLock<RoomManager>>,
    pub yjs_docs: Arc<RwLock<HashMap<String, Arc<YjsDoc>>>>,
    pub tx: broadcast::Sender<String>,
}

impl AppState {
    pub fn new() -> Self {
        let (tx, _rx) = broadcast::channel(100);
        Self {
            rooms: Arc::new(RwLock::new(RoomManager::new())),
            yjs_docs: Arc::new(RwLock::new(HashMap::new())),
            tx,
        }
    }
}
