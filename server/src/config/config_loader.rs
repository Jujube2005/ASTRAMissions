use std::env;

use anyhow::Result;

use crate::config::{
    config_model::{CloudinaryEnv, Database, DotEnvyConfig, JwtEnv, Server},
    stage::Stage,
};

pub fn load() -> Result<DotEnvyConfig> {
    dotenvy::dotenv().ok();

    let server = Server {
        port: std::env::var("PORT")
            .or_else(|_| std::env::var("SERVER_PORT"))
            .unwrap_or_else(|_| "80".to_string())
            .parse()?,
        body_limit: std::env::var("SERVER_BODY_LIMIT")
            .unwrap_or_else(|_| "10".to_string())
            .parse()?,
        timeout: std::env::var("SERVER_TIMEOUT")
            .unwrap_or_else(|_| "60".to_string())
            .parse()?,
    };

    let database = Database {
        url: std::env::var("DATABASE_URL")
            .expect("DATABASE_URL must be set"),
    };

    let secret = std::env::var("JWT_USER_SECRET")
        .unwrap_or_else(|_| "change_me_in_production".to_string());

    let config = DotEnvyConfig {
        server,
        database,
        secret,
    };

    Ok(config)
}

pub fn get_stage() -> Stage {
    dotenvy::dotenv().ok();

    let stage_str = std::env::var("STAGE").unwrap_or("".to_string());
    Stage::try_form(&stage_str).unwrap_or_default()
}

pub fn get_jwt_env() -> Result<JwtEnv> {
    dotenvy::dotenv().ok();
    Ok(JwtEnv {
        secret: env::var("JWT_USER_SECRET")?,
        ttl: env::var("JWT_TTL")?.parse::<i64>()?,
    })
}

pub fn get_cloudinary_env() -> Result<CloudinaryEnv> {
    dotenvy::dotenv().ok();
    Ok(CloudinaryEnv {
        cloud_name: env::var("CLOUDINARY_CLOUD_NAME")?,
        api_key: env::var("CLOUDINARY_API_KEY")?,
        api_secret: env::var("CLOUDINARY_API_SECRET")?,
    })
}
