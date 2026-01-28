use std::sync::Arc;

use axum::{
    Extension, Json, Router, extract::State, http::StatusCode, response::IntoResponse,
    routing::{get, post},
};

use crate::{
    application::use_cases::{brawlers::BrawlersUseCase, mission_viewing::MissionViewingUseCase},
    domain::{
        repositories::{brawlers::BrawlerRepository, mission_viewing::MissionViewingRepository},
        value_objects::{brawler_model::RegisterBrawlerModel, uploaded_img::UploadBase64Img},
    },
    infrastructure::{
        database::{
            postgresql_connection::PgPoolSquad,
            repositories::{brawlers::BrawlerPostgres, mission_viewing::MissionViewingPostgres},
        },
        http::{error_response::ErrorResponse, middlewares::auth::auth},
    },
};

pub fn routes(db_pool: Arc<PgPoolSquad>) -> Router {
    let repository = BrawlerPostgres::new(Arc::clone(&db_pool));
    let user_case = BrawlersUseCase::new(Arc::new(repository));

    let protected_routes = Router::new()
        .route("/avatar", post(upload_avatar))
        .route_layer(axum::middleware::from_fn(auth))
        .with_state(Arc::new(user_case));

    let viewing_repository = MissionViewingPostgres::new(Arc::clone(&db_pool));
    let viewing_case = MissionViewingUseCase::new(Arc::new(viewing_repository));
    let mission_routes = Router::new()
        .route("/my-missions", get(get_missions))
        .route_layer(axum::middleware::from_fn(auth))
        .with_state(Arc::new(viewing_case));

    let public_routes = Router::new()
        .route("/register", post(register))
        .with_state(Arc::new(BrawlersUseCase::new(Arc::new(BrawlerPostgres::new(
            Arc::clone(&db_pool),
        )))));

    Router::new()
        .merge(protected_routes)
        .merge(mission_routes)
        .merge(public_routes)
}

pub async fn register<T>(
    State(user_case): State<Arc<BrawlersUseCase<T>>>,
    Json(model): Json<RegisterBrawlerModel>,
) -> impl IntoResponse
where
    T: BrawlerRepository + Send + Sync,
{
    match user_case.register(model).await {
        Ok(passport) => (StatusCode::CREATED, Json(passport)).into_response(),

        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse::new(e.to_string())),
        )
            .into_response(),
    }
}

pub async fn upload_avatar<T>(
    State(user_case): State<Arc<BrawlersUseCase<T>>>,
    Extension(user_id): Extension<i32>,
    Json(model): Json<UploadBase64Img>,
) -> impl IntoResponse
where
    T: BrawlerRepository + Send + Sync,
{
    match user_case
        .upload_base64img(user_id, model.base64_string)
        .await
    {
        Ok(upload_img) => (StatusCode::OK, Json(upload_img)).into_response(),

        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_missions<T>(
    State(user_case): State<Arc<MissionViewingUseCase<T>>>,
    Extension(user_id): Extension<i32>,
) -> impl IntoResponse
where
    T: MissionViewingRepository + Send + Sync,
{
    match user_case.get_missions(user_id).await {
        Ok(missions) => (StatusCode::OK, Json(missions)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse::new(e.to_string())),
        )
            .into_response(),
    }
}
