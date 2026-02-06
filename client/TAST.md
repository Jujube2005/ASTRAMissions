# Task: Add Join/Leave Mission Functionality

## 1. Client Side (Angular)

### MissionService (`client/src/app/_services/mission-service.ts`)
- [x] **Update**: แก้ไข `joinMission` ให้เรียก API endpoint ที่ถูกต้อง: `POST /api/crew/join/{mission_id}`
- [x] **Add**: เพิ่ม method `leaveMission` โดยเรียก API endpoint: `DELETE /api/crew/leave/{mission_id}`

### Missions Component (`client/src/app/missions/missions.ts`)
- [x] **Add**: เพิ่ม method `leaveMission` สำหรับเชื่อมต่อกับปุ่มกด
- [x] **Update**: ตรวจสอบการทำงานของ `joinMission` และ `leaveMission` ให้ refresh รายการ missions หลังทำรายการสำเร็จ

### Missions Template (`client/src/app/missions/missions.html`)
- [x] **Add**: เพิ่มปุ่ม "Leave" สำหรับออกจากกลุ่ม
- [x] **Update**: ปรับเงื่อนไขการแสดงผลปุ่ม:
    - แสดงปุ่ม **Join** เมื่อ User ไม่ใช่สมาชิก (`!mission.is_member`) และไม่ใช่หัวหน้า (`mission.chief_id !== user_id`)
    - แสดงปุ่ม **Leave** เมื่อ User เป็นสมาชิก (`mission.is_member`)
- [x] **Delete**: ลบ comment ที่เขียนว่า `<!-- fix: จะ join ไม่ได้ ถ้า chief_id ตรงกับ user_id ที่ login -->` เมื่อแก้ไขเสร็จแล้ว

## 2. Server Side (Rust)
*Backend มีการ Implement ไว้แล้ว ไม่ต้องแก้ไข code แต่อาจต้องตรวจสอบความถูกต้อง*
- [x] **Verify**: ตรวจสอบ Endpoint `POST /api/crew/join/{mission_id}`
- [x] **Verify**: ตรวจสอบ Endpoint `DELETE /api/crew/leave/{mission_id}`
- [x] **Verify**: ตรวจสอบ Model `Mission` ว่ามี field `is_member` ส่งมาด้วย (ตรวจสอบแล้วมีอยู่)

# Additional Requirements: Advanced Mission Management

## 1. การแสดงผล Mission หน้าหลัก (Main Page Filtering)
**ความต้องการ:**
- หน้าหลักต้องแสดงเฉพาะ Mission ที่:
  1. **ไม่ใช่** Mission ที่ตัวเองสร้าง (Not My Own)
  2. **ไม่ใช่** Mission ที่ตัวเองเข้าร่วมไปแล้ว (Not Joined)

**ขั้นตอนการทำ (Implementation Steps):**
### Server Side (Rust)
- [x] **Modify Repository**: แก้ไข `MissionViewingRepository` ให้เพิ่มเงื่อนไข Filter:
    - `WHERE chief_id != current_user_id`
    - `AND id NOT IN (SELECT mission_id FROM crew_memberships WHERE brawler_id = current_user_id)`
- [x] **Update API**: ปรับปรุง `/api/view/filter` ให้รองรับการกรองนี้

### Client Side (Angular)
- [x] **Update Logic**: หน้า `MissionsComponent` (หน้าหลัก) จะแสดงเฉพาะ Mission ที่ User สามารถกด "Join" ได้เท่านั้น
- [x] **Remove UI**: ตัดปุ่ม Leave ออกจากหน้านี้ (ย้ายไปหน้าจัดการแยก)

---

## 2. หน้าจัดการ Mission ที่เข้าร่วม (My Joined Missions)
**ความต้องการ:**
- มีหน้าจอแยกสำหรับจัดการ Mission ที่ตัวเองเข้าร่วม (Crew Member)
- สามารถกด "Leave" ได้ที่หน้านี้

**ขั้นตอนการทำ (Implementation Steps):**
### Server Side (Rust)
- [x] **New API**: สร้าง endpoint `GET /api/view/joined` (was `GET /api/brawler/joined-missions`)
- [x] **Repository**: เพิ่มฟังก์ชัน `get_joined_missions(brawler_id)` ใน `MissionViewingRepository`

### Client Side (Angular)
- [x] **New Component**: สร้าง `JoinedMissionsComponent`
- [x] **Route**: เพิ่ม Route ใหม่ (`/joined-missions`)
- [] **Integration**: ดึงข้อมูลจาก API ใหม่และแสดงรายการ พร้อมปุ่ม Leave



## 3. หน้าสรุปสถานะ Mission (Mission Status Summary)
**ความต้องการ:**
- มีหน้าจอสรุปสถานะ Mission (Dashboard)

**ขั้นตอนการทำ (Implementation Steps):**
### Server Side (Rust)
- [x] **New API**: สร้าง endpoint `GET /api/brawler/mission-summary`
- [x] **Logic**: คำนวณสถิติ (Total Created, Joined, Completed, Failed)

### Client Side (Angular)
- [x] **New Component**: สร้าง `MissionSummaryComponent`
- [x] **UI**: แสดงผลข้อมูลสถิติ

---

# Fix: Edit & Delete Mission Functionality

สถานะปัจจุบัน: มีปุ่ม/ข้อความแสดงใน UI แต่ยังไม่มีการทำงานจริง และ Server side logic ยังไม่ปลอดภัย

## 1. Server Side (Rust)
- [x] **Fix Repository**: แก้ไข `MissionManagementRepository` ในไฟล์ `server/src/infrastructure/database/repositories/mission_management.rs`
    - `edit`: เพิ่ม `.filter(missions::chief_id.eq(edit_mission_entity.chief_id))` เพื่อป้องกันคนอื่นแก้ไข
    - `remove`: แก้ไขให้ตรวจสอบ `chief_id` ก่อนลบ (เพิ่ม filter และลบการ update chief_id ที่ไม่จำเป็น)

## 2. Client Side (Angular)
### Models & Services
- [x] **Create Model**: สร้างไฟล์ `client/src/app/_models/edit-mission.ts`
    ```typescript
    export interface EditMission {
        name?: string
        description?: string
    }
    ```
- [x] **Update Service**: เพิ่ม method ใน `MissionService`:
    - `edit(id: number, data: EditMission)`: เรียก `PATCH /api/mission-management/{id}`
    - `delete(id: number)`: เรียก `DELETE /api/mission-management/{id}`

### Mission Manager Component (`mission-manager.ts` & `.html`)
- [x] **Update HTML**: เปลี่ยนข้อความ "Edit | Delete" เป็นปุ่มที่กดได้
    - ปุ่ม Edit (`<button>`) -> เรียก `openEditDialog(mission)`
    - ปุ่ม Delete (`<button>`) -> เรียก `deleteMission(mission.id)`
- [x] **Add Logic**:
    - `deleteMission`: เพิ่ม confirm dialog (เช่น `confirm('Are you sure?')`) แล้วเรียก service
    - `openEditDialog`: ปรับปรุง `NewMission` dialog ให้รองรับ mode แก้ไข (ส่ง data เดิมเข้าไป) หรือสร้าง Dialog ใหม่

---

# Features (ฟีเจอร์เพิ่มเติม)

จากการวิเคราะห์ระบบปัจจุบัน (League of Legends Theme) นี่คือฟีเจอร์ที่น่าสนใจเพื่อพัฒนาต่อยอด:

## 1. ระบบจัดอันดับ (Leaderboard System)
- [x] **Concept**: สร้างหน้าจัดอันดับ Brawlers ที่ทำภารกิจสำเร็จมากที่สุด เพื่อกระตุ้นให้ผู้เล่นทำภารกิจ
- [x] **Data Support**: ปัจจุบัน `BrawlerModel` มี field `mission_success_count` และ `mission_join_count` รองรับอยู่แล้ว
- [x] **Implementation**:
    - Backend: เพิ่ม API `GET /api/leaderboard` เรียงลำดับ User ตาม `mission_success_count`
    - Frontend: หน้าตารางแสดงอันดับ Top 10 พร้อม Avatar และ Rank (e.g., Challenger, Grandmaster)

## 2. ระบบเหรียญตราความสำเร็จ (Achievement Badges)
- [x] **Concept**: มอบเหรียญตราเมื่อทำตามเงื่อนไขพิเศษ เช่น "เข้าร่วม 10 ภารกิจ", "เป็นหัวหน้าทีม 5 ครั้ง"
- [x] **Implementation**:
    - [x] Backend: ตาราง `achievements` และ `user_achievements`
    - [x] Frontend: แสดงเหรียญตราในหน้า Profile

## 3. ระบบแจ้งเตือน Real-time (Notifications)
- [x] **Concept**: แจ้งเตือนทันทีโดยไม่ต้อง Refresh หน้าจอ
- [x] **Use Cases**:
    - [x] แจ้งเตือนหัวหน้า (Chief) เมื่อมีคนกด Join
    - [x] แจ้งเตือนลูกทีม (Crew) เมื่อ Mission เปลี่ยนสถานะ (Pending -> In Progress -> Completed)
- [x] **Tech**: ใช้ WebSocket หรือ Server-Sent Events (SSE) ใน Rust (Axum รองรับอยู่แล้ว)

## 4. จัดหมวดหมู่ภารกิจ (Mission Categories/Tags)
- **Concept**: แยกประเภทภารกิจให้ชัดเจน เช่น "Ranked", "Normal", "ARAM", "Clash"
- **Implementation**:
    - Backend: เพิ่ม column `category` หรือ `tags` ในตาราง `missions`
    - Frontend: เพิ่ม Dropdown filter ในหน้าค้นหา