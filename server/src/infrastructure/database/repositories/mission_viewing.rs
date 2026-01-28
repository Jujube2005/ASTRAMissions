use std::sync::Arc;

use anyhow::{Ok, Result};
use async_trait::async_trait;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};

use crate::{
    domain::{
        repositories::mission_viewing::MissionViewingRepository,
        value_objects::{brawler_model::BrawlerModel, mission_filter::MissionFilter, mission_model::MissionModel},
    },
    infrastructure::database::{
        postgresql_connection::PgPoolSquad,
        schema::crew_memberships,
    },
};
pub struct MissionViewingPostgres {
    db_pool: Arc<PgPoolSquad>,
}

impl MissionViewingPostgres {
    pub fn new(db_pool: Arc<PgPoolSquad>) -> Self {
        Self { db_pool }
    }
}

#[async_trait]
impl MissionViewingRepository for MissionViewingPostgres {
    async fn crew_counting(&self, mission_id: i32) -> Result<i64> {
        let mut conn = Arc::clone(&self.db_pool).get()?;

        let value = crew_memberships::table
            .filter(crew_memberships::mission_id.eq(mission_id))
            .count()
            .first::<i64>(&mut conn)?;

        let count = i64::try_from(value)?;
        Ok(count)
    }

    async fn get_one(&self, mission_id: i32) -> Result<MissionModel> {
        let sql = r#"
            SELECT 
                m.id,
                m.name,
                m.description,
                m.status,
                m.chief_id,
                b.display_name AS chief_display_name,
                COALESCE(cm.cnt, 0) AS crew_count,
                m.created_at,
                m.updated_at
            FROM missions m
            LEFT JOIN brawlers b ON b.id = m.chief_id
            LEFT JOIN (
                SELECT mission_id, COUNT(*) AS cnt
                FROM crew_memberships
                GROUP BY mission_id
            ) cm ON cm.mission_id = m.id
            WHERE m.id = $1 AND m.deleted_at IS NULL
        "#;
        let mut conn = Arc::clone(&self.db_pool).get()?;
        let result = diesel::sql_query(sql)
            .bind::<diesel::sql_types::Int4, _>(mission_id)
            .get_result::<MissionModel>(&mut conn)?;
        Ok(result)
    }

    async fn get_all(&self, mission_filter: &MissionFilter) -> Result<Vec<MissionModel>> {
        let sql = r#"
            SELECT 
                m.id,
                m.name,
                m.description,
                m.status,
                m.chief_id,
                b.display_name AS chief_display_name,
                COALESCE(cm.cnt, 0) AS crew_count,
                m.created_at,
                m.updated_at
            FROM missions m
            LEFT JOIN brawlers b ON b.id = m.chief_id
            LEFT JOIN (
                SELECT mission_id, COUNT(*) AS cnt
                FROM crew_memberships
                GROUP BY mission_id
            ) cm ON cm.mission_id = m.id
            WHERE m.deleted_at IS NULL
              AND ($1::varchar IS NULL OR m.status = $1)
              AND ($2::varchar IS NULL OR m.name ILIKE $2)
            ORDER BY m.created_at DESC
        "#;

        let status_param = mission_filter.status.as_ref().map(|s| s.to_string());
        let name_param = mission_filter.name.as_ref().map(|n| format!("%{}%", n));

        let mut conn = Arc::clone(&self.db_pool).get()?;
        let value = diesel::sql_query(sql)
            .bind::<diesel::sql_types::Nullable<diesel::sql_types::VarChar>, _>(status_param)
            .bind::<diesel::sql_types::Nullable<diesel::sql_types::VarChar>, _>(name_param)
            .load::<MissionModel>(&mut conn)?;
        Ok(value)
    }

    async fn get_crew(&self, mission_id: i32) -> Result<Vec<BrawlerModel>> {
        let sql = r#"
            SELECT b.display_name,
                    COALESCE(b.avatar_url, '') AS avatar_url,
                    COALESCE(s.success_count, 0) AS mission_success_count,
                    COALESCE(j.joined_count, 0) AS mission_joined_count
            FROM crew_memberships cm
            INNER JOIN brawlers b ON b.id = cm.brawler_id
            LEFT JOIN (
                SELECT cm2.brawler_id, COUNT(*) AS success_count
                FROM crew_memberships cm2
                INNER JOIN missions m2 ON m2.id = cm2.mission_id
                WHERE m2.status = 'success'
                GROUP BY cm2.brawler_id
            ) s ON s.brawler_id = b.id
            LEFT JOIN (
                SELECT cm3.brawler_id, COUNT(*) AS joined_count
                FROM crew_memberships cm3
                GROUP BY cm3.brawler_id
            ) j ON j.brawler_id = b.id
            WHERE cm.mission_id = $1
        "#;

        let mut conn = Arc::clone(&self.db_pool).get()?;
        let brawler_list = diesel::sql_query(sql)
            .bind::<diesel::sql_types::Int4, _>(mission_id)
            .load::<BrawlerModel>(&mut conn)?;

        Ok(brawler_list)
    }
 
    async fn get_missions(&self, brawler_id: i32) -> Result<Vec<MissionModel>> {
        let sql = r#"
            SELECT 
                m.id,
                m.name,
                m.description,
                m.status,
                m.chief_id,
                b.display_name AS chief_display_name,
                COALESCE(cm.cnt, 0) AS crew_count,
                m.created_at,
                m.updated_at
            FROM missions m
            LEFT JOIN brawlers b ON b.id = m.chief_id
            LEFT JOIN (
                SELECT mission_id, COUNT(*) AS cnt
                FROM crew_memberships
                GROUP BY mission_id
            ) cm ON cm.mission_id = m.id
            WHERE m.deleted_at IS NULL AND m.chief_id = $1
            ORDER BY m.created_at DESC
        "#;
        let mut conn = Arc::clone(&self.db_pool).get()?;
        let results = diesel::sql_query(sql)
            .bind::<diesel::sql_types::Int4, _>(brawler_id)
            .load::<MissionModel>(&mut conn)?;
        Ok(results)
    }
}
