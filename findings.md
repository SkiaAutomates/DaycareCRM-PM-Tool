# Findings & Research

## Discovery Answers

### 1. North Star
Create a comprehensive CRM for "Day Care Operation" childcare centers to manage:
- Parent and student data with reporting
- Dashboard with student counts per classroom/location
- Search by parent or child name
- Status tracking (Enrolled, Waitlisted, On Process, Drop-In)
- Project management for Enrollment Inquiry and Transitions
- Classroom availability forecasting
- Notification system for upcoming transitions and waitlist follow-ups
- Weekly reporting (PDF export)

### 2. Integrations
None at this time. Self-contained web app.

### 3. Source of Truth
This CRM Web App is the source of truth.

### 4. Delivery Payload
Real-time updates within the CRM Web App.

### 5. Behavioral Rules
- Automatic age calculation from DOB
- Weekly report auto-updates every Monday
- Transition alerts 2 months before transition date
- Waitlist contact alerts 1-2 months before desired start date
- Transition stage detection based on child age and current classroom

---

## Locations & Classrooms

### Day Care Location 1 (5 Classrooms)
| Classroom | Age Range | Max Capacity |
|-----------|-----------|--------------|
| Silly Starfish (Infant Non-Mobile) | 6 weeks - 12 months | 8 |
| Tiny Turtles (Infant Mobile) | 12 - 18 months | 11 |
| Proud Penguin (Toddler) | 18 - 30 months | 12 |
| One-of-a-Kind Otters (Lower Preschool) | 30 - 42 months | 20 |
| Dancing Dolphins/Wonderful Whales (Upper Preschool) | 42 - 72 months | 20 |

### Day Care Location 2 (2 Classrooms)
| Classroom | Age Range | Max Capacity |
|-----------|-----------|--------------|
| Infant Room | 6 weeks - 18 months | 16 |
| Toddler Room | 18 - 36 months | 12 |

---

## Tracking Requirements

### Tours
- Completed, Rescheduled, Cancelled, Scheduled this week
- Source tracking: Yelp, Word of Mouth, CRM Website, BH (Brighthorizon), etc.

### Service Agreements
- Sent, Signed, Followed-up counts per location

### Playdates
- Completed and Upcoming per location

### Onboarding/Offboarding
- Name, Category, Start/Last Date, Reason (for offboarding)

---

## Transition Task Lists

| Transition Type | Tasks |
|----------------|-------|
| Infant Non-Mobile → Infant Mobile | Schedule 15-min virtual meeting with head teacher |
| Infant Mobile → Toddler | Schedule meeting, Attach Service Agreement, Attach Transition form |
| Toddler → Lower Preschool | Schedule meeting, Attach Service Agreement, Attach Transition form, Attach Field trip form |
| Lower Preschool → Upper Preschool | Schedule meeting, Verify Field Trip Form, Attach Service Agreement |

---

## Enrollment Inquiry Task List
1. Scheduled a tour
2. Tour Done
3. Service Agreement Sent
4. Enrollment Docs Sent
5. Invoice Sent
6. Brightwheel Access Sent
7. Brightwheel Access Active
8. Monday.com Record

---

## Local Environment
- **Chrome Profile Path**: `C:\Users\Skia\AppData\Local\Google\Chrome\User Data\Profile 19`
