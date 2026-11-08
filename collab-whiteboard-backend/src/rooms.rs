use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Room {
    pub id: String,
    pub name: String,
    pub created_at: u64,
    pub users: Vec<String>,
}

#[derive(Deserialize)]
pub struct CreateRoomRequest {
    pub name: Option<String>,
}

#[derive(Clone)]
pub struct RoomManager {
    rooms: HashMap<String, Room>,
}

impl RoomManager {
    pub fn new() -> Self {
        Self { rooms: HashMap::new() }
    }

    pub fn create_room(&mut self, name: Option<String>) -> Room {
        let id = Uuid::new_v4().to_string()[..8].to_string();
        let name = name.unwrap_or_else(|| format!("Room {}", id));
        let room = Room {
            id: id.clone(),
            name,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            users: Vec::new(),
        };
        self.rooms.insert(id, room.clone());
        room
    }

    pub fn get_room(&self, id: &str) -> Option<&Room> {
        self.rooms.get(id)
    }

    pub fn list_rooms(&self) -> Vec<&Room> {
        self.rooms.values().collect()
    }
}
