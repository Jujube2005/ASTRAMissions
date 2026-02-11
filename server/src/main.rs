use std::sync::Arc;

use server::{
    config::config_loader,
    infrastructure::{database::postgresql_connection, http::http_serv::start},
};
use tracing::{error, info};

#[tokio::main]
async fn main() {
    println!(">>> SERVER STARTING UP...");
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::DEBUG)
        .init();

    println!(">>> LOADING CONFIG...");
    let dotenvy_env = match config_loader::load() {
        Ok(env) => {
            println!(">>> CONFIG LOADED");
            env
        },
        Err(e) => {
            println!(">>> FATAL: FAILED TO LOAD CONFIG: {:?}", e);
            error!("Failed to load ENV: {}", e);
            std::process::exit(1);
        }
    };

    println!(">>> CONNECTING TO DATABASE...");
    // Trigger Rebuild - Force Clean
    let postgres_pool = match postgresql_connection::establish_connection(&dotenvy_env.database.url)
    {
        Ok(pool) => {
            println!(">>> DATABASE CONNECTED");
            pool
        },
        Err(err) => {
            println!(">>> FATAL: DATABASE CONNECTION FAILED: {:?}", err);
            error!("Fail to connect: {}", err);
            std::process::exit(1)
        }
    };

    println!(">>> STARTING SERVER ON PORT {}...", dotenvy_env.server.port);
    if let Err(e) = start(Arc::new(dotenvy_env), Arc::new(postgres_pool)).await {
        println!(">>> FATAL: SERVER CRASHED: {:?}", e);
        panic!("Failed to start server: {:?}", e);
    }
}
