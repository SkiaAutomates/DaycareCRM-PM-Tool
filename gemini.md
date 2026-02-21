# Project Constitution (gemini.md)

## 1. Data Schemas

### Parent Schema
```json
{
  "id": "string (UUID)",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "status": "Enrolled | Waitlisted | On Process | Drop-In",
  "childrenIds": ["string (UUID)"],
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

### Child Schema
```json
{
  "id": "string (UUID)",
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "status": "Enrolled | Waitlisted | On Process | Drop-In",
  "location": "Day Care Location 2 | Day Care Location 1",
  "classroomId": "string",
  "parentIds": ["string (UUID)"],
  "lastTransitionDate": "YYYY-MM-DD | null",
  "nextTransitionDate": "YYYY-MM-DD | null",
  "nextClassroomId": "string | null",
  "scheduleType": "Regular | Full Time | Part Time | Drop-Ins",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

### Waitlist Entry Schema
```json
{
  "id": "string (UUID)",
  "parentIds": ["string (UUID)"],
  "childId": "string (UUID)",
  "expectedDeliveryDate": "YYYY-MM-DD | null",
  "desiredStartDate": "YYYY-MM-DD",
  "preferredLocation": "Day Care Location 2 | Day Care Location 1",
  "scheduleType": "Regular | Full Time | Part Time | Drop-Ins",
  "createdAt": "ISO 8601"
}
```

### Classroom Schema
```json
{
  "id": "string",
  "name": "string",
  "location": "Day Care Location 2 | Day Care Location 1",
  "ageCategory": "Infant Non-Mobile | Infant Mobile | Infant | Toddler | Lower Preschool | Upper Preschool",
  "ageRangeMonths": { "min": "number", "max": "number" },
  "maxCapacity": "number"
}
```

### Tour Schema
```json
{
  "id": "string (UUID)",
  "parentId": "string (UUID)",
  "childId": "string (UUID) | null",
  "location": "Day Care Location 2 | Day Care Location 1",
  "scheduledDate": "YYYY-MM-DD",
  "scheduledTime": "HH:MM",
  "status": "Scheduled | Completed | Rescheduled | Cancelled",
  "source": "Yelp | Word of Mouth | CRM Website | BH | Other",
  "notes": "string",
  "createdAt": "ISO 8601"
}
```

### Project Schema (Enrollment Inquiry / Transition)
```json
{
  "id": "string (UUID)",
  "type": "Enrollment Inquiry | Transition",
  "parentIds": ["string (UUID)"],
  "childId": "string (UUID)",
  "location": "Day Care Location 2 | Day Care Location 1",
  "transitionCategory": "Infant Non-Mobile to Infant Mobile | Infant Mobile to Toddler | Toddler to Lower Preschool | Lower Preschool to Upper Preschool | null",
  "tasks": [
    {
      "id": "string",
      "name": "string",
      "completed": "boolean",
      "completedAt": "ISO 8601 | null"
    }
  ],
  "status": "In Progress | Completed",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

### Service Agreement Schema
```json
{
  "id": "string (UUID)",
  "childId": "string (UUID)",
  "location": "Day Care Location 2 | Day Care Location 1",
  "status": "Sent | Signed | Followed-up",
  "sentDate": "YYYY-MM-DD",
  "signedDate": "YYYY-MM-DD | null",
  "followedUpDate": "YYYY-MM-DD | null"
}
```

### Playdate Schema
```json
{
  "id": "string (UUID)",
  "childId": "string (UUID)",
  "location": "Day Care Location 2 | Day Care Location 1",
  "category": "string",
  "date": "YYYY-MM-DD",
  "status": "Upcoming | Completed"
}
```

### Onboarding/Offboarding Schema
```json
{
  "id": "string (UUID)",
  "childId": "string (UUID)",
  "type": "Onboarding | Offboarding",
  "location": "Day Care Location 2 | Day Care Location 1",
  "category": "string",
  "date": "YYYY-MM-DD",
  "reason": "string | null"
}
```

---

## 2. Behavioral Rules

### Age Calculation
- Calculate age in months from DOB: `(today - DOB) / 30.44`
- Display as "X years, Y months" when >= 12 months

### Transition Detection
- System auto-detects transition eligibility based on age and current classroom
- Alert 2 months before nextTransitionDate

### Waitlist Alerts
- Notify 1-2 months before desiredStartDate

### Weekly Report
- Auto-refresh every Monday at 00:00
- Week starts on Monday

### Status Values
- Parent/Child: `Enrolled`, `Waitlisted`, `On Process`, `Drop-In`
- Tour: `Scheduled`, `Completed`, `Rescheduled`, `Cancelled`
- Service Agreement: `Sent`, `Signed`, `Followed-up`
- Project: `In Progress`, `Completed`

---

## 3. Architectural Invariants

### Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Storage**: localStorage (client-side) - can be upgraded to backend later
- **No external dependencies** for MVP

### Layer 1: Architecture (`architecture/`)
- SOPs for each module

### Layer 2: Navigation
- Tab-based routing (Dashboard, CRM, Projects, Availability, Notifications, Reports)

### Layer 3: Tools (`tools/`)
- Utility scripts for data manipulation

### File Structure
```
├── index.html          # Main entry point
├── index.css           # Global styles
├── js/
│   ├── app.js          # Main application logic
│   ├── data.js         # Data layer (localStorage)
│   ├── utils.js        # Utility functions
│   ├── dashboard.js    # Dashboard module
│   ├── crm.js          # CRM module
│   ├── projects.js     # Projects module
│   ├── availability.js # Availability module
│   ├── notifications.js# Notifications module
│   └── reports.js      # Reports module
├── gemini.md           # Project Constitution
├── task_plan.md        # Task tracking
├── findings.md         # Research & discoveries
└── progress.md         # Progress log
```

---

## 4. Classroom Configuration

### Day Care Location 1
| ID | Name | Age Category | Age Range (months) | Capacity |
|----|------|--------------|-------------------|----------|
| lh-infant-nm | Silly Starfish | Infant Non-Mobile | 1.5 - 12 | 8 |
| lh-infant-m | Tiny Turtles | Infant Mobile | 12 - 18 | 11 |
| lh-toddler | Proud Penguin | Toddler | 18 - 30 | 12 |
| lh-lower-ps | One-of-a-Kind Otters | Lower Preschool | 30 - 42 | 20 |
| lh-upper-ps | Dancing Dolphins/Wonderful Whales | Upper Preschool | 42 - 72 | 20 |

### Day Care Location 2
| ID | Name | Age Category | Age Range (months) | Capacity |
|----|------|--------------|-------------------|----------|
| tv-infant | Infant Room | Infant | 1.5 - 18 | 16 |
| tv-toddler | Toddler Room | Toddler | 18 - 36 | 12 |

---

## 5. Maintenance Log
- [x] 2026-02-07: Initial schema definition
- [ ] Phase 2: Link verification
- [ ] Phase 3: Architecture build
- [ ] Phase 4: UI styling
- [ ] Phase 5: Deployment
