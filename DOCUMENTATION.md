# Day Care CRM

## Product Documentation

> A comprehensive childcare enrollment management system designed for daycare and preschool centers.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Getting Started](#getting-started)
4. [User Guide](#user-guide)
5. [Technical Specifications](#technical-specifications)
6. [Deployment Guide](#deployment-guide)
7. [Security](#security)
8. [Support](#support)

---

## Overview

**Day Care CRM** is a web-based customer relationship management system specifically designed for childcare centers. It streamlines enrollment tracking, classroom management, parent communications, and staff workflows.

### Key Benefits

- ✅ **Centralized Family Data** - All parent and child information in one place
- ✅ **Classroom Capacity Tracking** - Visual dashboard showing real-time availability
- ✅ **Automated Transition Alerts** - Never miss an age-based classroom transition
- ✅ **Waitlist Management** - Track inquiries and prioritize enrollments
- ✅ **Weekly Reports** - Export PDF summaries for staff meetings

---

## Features

### 1. Dashboard

The main dashboard provides an at-a-glance view of your center's status:

| Metric | Description |
|--------|-------------|
| Total Enrolled | Current children enrolled across all locations |
| Location Breakdown | Children count per location (Day Care Location 1, Day Care Location 2) |
| Waitlist Count | Families waiting for an opening |
| Active Projects | Enrollment inquiries and transitions in progress |
| This Week's Tours | Scheduled facility tours |

**Classroom Capacity Cards** show each classroom's current enrollment vs. maximum capacity with visual progress bars.

---

### 2. CRM (Customer Relationship Management)

#### Parent Management
- Add, edit, and delete parent records
- Track contact information (email, phone)
- Record notes and communication history
- View linked children

#### Child Management
- Full profile with date of birth, location, classroom
- Enrollment status tracking: `On Process`, `Enrolled`, `Waitlisted`, `Left`
- Schedule type: `Regular` or `Drop-in`
- Automatic age calculation for transition planning
- Link multiple parents per child

#### Search & Filters
- Real-time search by name
- Filter by status (On Process, Enrolled, Waitlisted, Left)
- Filter by location

---

### 3. Projects (Workflow Management)

Two workflow types for tracking enrollment activities:

#### Enrollment Inquiry Workflow
1. ☐ Initial inquiry received
2. ☐ Tour scheduled
3. ☐ Tour completed
4. ☐ Service agreement sent
5. ☐ Service agreement received
6. ☐ Playdate 1 scheduled
7. ☐ Playdate 1 completed
8. ☐ Playdate 2 scheduled
9. ☐ Playdate 2 completed
10. ☐ Start date confirmed
11. ☐ Onboarding complete

#### Transition Workflow
1. ☐ Transition date identified
2. ☐ Parent notified
3. ☐ New classroom confirmed
4. ☐ Materials prepared
5. ☐ Transition completed

---

### 4. Classroom Availability

- **Monthly Calendar View** - Navigate between months
- **Location Tabs** - Switch between Day Care Location 1 and Day Care Location 2
- **Capacity Visualization** - See available spots per classroom
- **Age Range Display** - Each classroom shows accepted age range

#### Classroom Configuration

**Day Care Location 1:**
| Classroom | Age Range | Capacity |
|-----------|-----------|----------|
| Silly Starfish | 1.5 - 12 months | 8 |
| Tiny Turtles | 12 - 18 months | 11 |
| Proud Penguin | 18 - 30 months | 12 |
| One-of-a-Kind Otters | 30 - 42 months | 20 |
| Dancing Dolphins/Wonderful Whales | 42 - 72 months | 20 |

**Day Care Location 2:**
| Classroom | Age Range | Capacity |
|-----------|-----------|----------|
| Infant Room | 1.5 - 18 months | 16 |
| Toddler Room | 18 - 36 months | 12 |

---

### 5. Notifications

Automated alerts for:
- **Transition Reminders** - Children approaching classroom transition age (60-day advance notice)
- **Waitlist Follow-ups** - Families with upcoming desired start dates
- **Mark as Read** - Clear notifications individually or all at once

---

### 6. Weekly Reports

Generate comprehensive weekly summaries including:
- Enrollment statistics by location
- New inquiries received
- Transitions scheduled
- Capacity overview
- **Export to PDF** for staff meetings

---

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- @meaningfulbeginnings.org email account

### First-Time Login

1. Navigate to [https://daycare-crm-pm-tool.vercel.app](https://daycare-crm-pm-tool.vercel.app)
2. Click **Create Account**
3. Enter your admin email (e.g. `ggskiawp@gmail.com`)
4. Create a password (minimum 6 characters)
5. Check your email for verification link
6. Click link to verify, then sign in

---

## User Guide

### Adding a New Family

1. Go to **CRM** tab
2. Click **Add Parent**
3. Fill in parent details (name, email, phone)
4. Click **Save**
5. Click **Add Child**
6. Fill in child details
7. Select parent(s) from dropdown
8. Click **Save**

### Starting an Enrollment Inquiry

1. Go to **Projects** tab
2. Click **Add Project**
3. Select **Enrollment Inquiry** type
4. Link to child record
5. Click **Create**
6. Check off tasks as they are completed

### Viewing Classroom Availability

1. Go to **Availability** tab
2. Select location tab (Day Care Location 1 or Day Care Location 2)
3. Use arrows to navigate months
4. View capacity bars for each classroom

### Generating a Report

1. Go to **Reports** tab
2. Review displayed statistics
3. Click **Export PDF**
4. Save or print the generated document

---

## Technical Specifications

### Architecture

```
┌─────────────────┐
│   Frontend      │
│  (HTML/CSS/JS)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│    Supabase     │────▶│   PostgreSQL    │
│   (Auth + API)  │     │   (Database)    │
└─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│     Vercel      │
│   (Hosting)     │
└─────────────────┘
```

### Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Database | PostgreSQL (via Supabase) |
| Authentication | Supabase Auth |
| Hosting | Vercel |
| Version Control | GitHub |

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Deployment Guide

### Requirements

- GitHub account
- Supabase account (free tier available)
- Vercel account (free tier available)

### Steps

1. **Clone Repository**
   ```bash
   git clone https://github.com/SkiaAutomates/Day-Care-CRM.git
   ```

2. **Set Up Supabase**
   - Create new project at [supabase.com](https://supabase.com)
   - Run database schema SQL (provided in `supabase-schema.sql`)
   - Copy Project URL and API Key

3. **Configure Keys**
   - Update `js/supabase.js` with your Supabase credentials

4. **Deploy to Vercel**
   - Connect GitHub repository at [vercel.com](https://vercel.com)
   - Deploy automatically on push

---

## Security

### Authentication
- Email/password authentication via Supabase
- Domain-restricted to `@meaningfulbeginnings.org`
- 24-hour session expiry

### Data Protection
- Row Level Security (RLS) enabled on all tables
- HTTPS encryption in transit
- Password hashing handled by Supabase

### Recommendations
- Enable email verification in Supabase settings
- Regularly review access logs
- Use strong, unique passwords

---

## Support

For technical support or feature requests, contact:

- **Email:** [support@meaningfulbeginnings.org]
- **GitHub Issues:** [Repository Issues](https://github.com/SkiaAutomates/MB-CRM-Report-Web-Base-App/issues)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-07 | Initial release |

---

*© 2026 Day Care Operation. All rights reserved.*
