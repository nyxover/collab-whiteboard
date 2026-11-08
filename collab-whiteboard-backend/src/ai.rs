use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Json},
};
use serde_json::{json, Value};
use std::sync::Arc;

use crate::app_state::AppState;

type AiResult = Result<Json<Value>, (StatusCode, Json<Value>)>;

fn err(code: StatusCode, err: &str, msg: &str) -> (StatusCode, Json<Value>) {
    (code, Json(json!({ "error": err, "message": msg })))
}

pub async fn ai_proxy(
    State(_state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(payload): Json<Value>,
) -> AiResult {
    // BYOK header first, then server-side .env key
    let byok = headers
        .get("x-ai-key")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let api_key = byok.or_else(|| {
        std::env::var("AI_API_KEY").ok().map(|s| s.trim().to_string()).filter(|s| !s.is_empty())
    });

    let Some(api_key) = api_key else {
        return Err(err(
            StatusCode::NOT_FOUND,
            "no_ai_key",
            "Pas de cle IA. Met AI_API_KEY dans backend\\.env (ex: cle gratuite GLM-4-Flash) ou colle une cle personnelle via le bouton cles du helper.",
        ));
    };

    let Some(prompt) = payload["prompt"].as_str().map(|s| s.trim().to_string()) else {
        return Err(err(StatusCode::BAD_REQUEST, "empty_prompt", "prompt manquant"));
    };
    if prompt.is_empty() {
        return Err(err(StatusCode::BAD_REQUEST, "empty_prompt", "prompt vide"));
    }

    let base =
        std::env::var("AI_API_BASE").unwrap_or_else(|_| "https://open.bigmodel.cn/api/paas/v4".into());
    let model = std::env::var("AI_MODEL").unwrap_or_else(|_| "glm-4-flash".into());

    let client = reqwest::Client::new();
    let body = json!({
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are a coding assistant. Answer ONLY with one fenced code block (```lang ... ```) containing the requested code. No commentary."
            },
            { "role": "user", "content": prompt }
        ]
    });

    let url = format!("{base}/chat/completions");
    let resp = reqwest::Client::new()
        .post(url)
        .bearer_auth(api_key)
        .json(&body)
        .send()
        .await;

    let resp = match resp {
        Ok(r) => r,
        Err(e) => {
            return Err(err(
                StatusCode::BAD_GATEWAY,
                "request_failed",
                &format!("Appel provider echoue: {e}"),
            ))
        }
    };

    let status = resp.status();
    let value: Value = match resp.json().await {
        Ok(v) => v,
        Err(e) => {
            return Err(err(
                StatusCode::BAD_GATEWAY,
                "invalid_response",
                &format!("Reponse illisible ({status}): {e}"),
            ))
        }
    };

    let content = value["choices"][0]["message"]["content"].as_str().unwrap_or("").to_string();
    if content.is_empty() {
        return Err((
            StatusCode::BAD_GATEWAY,
            Json(json!({
                "error": "empty_response",
                "message": "Le modele n'a rien renvoye (verifier la cle / le modele du .env)",
                "raw": value
            })),
        ));
    }

    Ok(Json(json!({ "code": content })))
}
