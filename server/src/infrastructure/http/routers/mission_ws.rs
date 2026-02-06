use std::sync::Arc;
use axum::{
    extract::{Path, State, ws::{WebSocket, WebSocketUpgrade, Message}},
    response::IntoResponse,
    routing::get,
    Router, Extension, middleware,
};
use futures::{sink::SinkExt, stream::StreamExt};
use crate::{
    application::use_cases::mission_chat::MissionChatUseCase,
    infrastructure::{
        database::{
            postgresql_connection::PgPoolSquad,
            repositories::mission_messages::MissionMessagePostgres,
        },
        http::middlewares::auth::auth,
        services::mission_websocket_service::MissionWebSocketService,
    },
};

async fn ws_handler(
    ws: WebSocketUpgrade,
    Path(mission_id): Path<i32>,
    Extension(user_id): Extension<i32>,
    Extension(ws_service): Extension<Arc<MissionWebSocketService>>,
    State(use_case): State<Arc<MissionChatUseCase<MissionMessagePostgres>>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, mission_id, user_id, ws_service, use_case))
}

async fn handle_socket(
    socket: WebSocket,
    mission_id: i32,
    user_id: i32,
    ws_service: Arc<MissionWebSocketService>,
    use_case: Arc<MissionChatUseCase<MissionMessagePostgres>>,
) {
    let (mut sender, mut receiver) = socket.split();
    
    // Get sender for the room
    let tx = ws_service.get_or_create_room(mission_id).await;
    let mut rx = tx.subscribe();

    // Task to receive broadcast messages and send to websocket
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    // Task to receive messages from websocket and broadcast
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            if let Message::Text(text) = msg {
                // Save to DB first
                match use_case.send_message(mission_id, user_id, text.clone()).await {
                    Ok(_) => {
                         // Broadcast
                         let broadcast_msg = serde_json::json!({
                            "user_id": user_id,
                            "content": text,
                            "type": "chat",
                            "created_at": chrono::Utc::now().to_rfc3339()
                         }).to_string();
                         
                         let _ = tx.send(broadcast_msg);
                    },
                    Err(e) => {
                        tracing::error!("Failed to save message: {}", e);
                    }
                }
            }
        }
    });

    // If any one of the tasks exit, abort the other.
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };
}

pub fn routes(db_pool: Arc<PgPoolSquad>) -> Router {
    let repository = MissionMessagePostgres::new(Arc::clone(&db_pool));
    let use_case = MissionChatUseCase::new(Arc::new(repository));

    Router::new()
        .route("/{mission_id}", get(ws_handler))
        .route_layer(middleware::from_fn(auth))
        .with_state(Arc::new(use_case))
}
