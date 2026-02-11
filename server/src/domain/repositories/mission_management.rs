use anyhow::Result;
use async_trait::async_trait;

use crate::domain::{
    entities::missions::{AddMissionEntity, EditMissionEntity},
    value_objects::{base64_img::Base64Img, uploaded_img::UploadedImg},
};
use crate::infrastructure::cloudinary::UploadImageOptions;

#[async_trait]
pub trait MissionManagementRepository {
    async fn add(&self, add_mission_entity: AddMissionEntity) -> Result<i32>;
    async fn edit(&self, mission_id: i32, edit_mission_entity: EditMissionEntity) -> Result<i32>;
    async fn remove(&self, mission_id: i32, chief_id: i32) -> Result<()>;
    async fn upload_image(
        &self,
        mission_id: i32,
        chief_id: i32,
        base64img: Base64Img,
        opt: UploadImageOptions,
    ) -> Result<UploadedImg>;
}
