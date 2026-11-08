use std::sync::Mutex;
use yrs::updates::decoder::Decode;
use yrs::{Doc, ReadTxn, StateVector, Transact, Update};

pub struct YjsDoc {
    doc: Mutex<Doc>,
}

impl YjsDoc {
    pub fn new() -> Self {
        Self {
            doc: Mutex::new(Doc::new()),
        }
    }

    pub fn apply_update(&self, update: &[u8]) {
        if let Ok(update) = Update::decode_v1(update) {
            if let Ok(doc) = self.doc.lock() {
                let mut txn = doc.transact_mut();
                txn.apply_update(update);
            }
        }
    }

    pub fn encode_state(&self) -> Vec<u8> {
        if let Ok(doc) = self.doc.lock() {
            let txn = doc.transact();
            let sv = StateVector::default();
            txn.encode_state_as_update_v1(&sv)
        } else {
            Vec::new()
        }
    }
}
