# Meaningful Beginnings CRM

A comprehensive CRM web application for managing childcare enrollment at Meaningful Beginnings centers.

## Features

- **Dashboard** - Overview stats and classroom capacity visualization
- **CRM** - Parent and child management with search and filters
- **Projects** - Enrollment inquiry and transition workflows
- **Availability** - Classroom capacity tracking and forecasting
- **Notifications** - Transition and waitlist follow-up alerts
- **Reports** - Weekly reports with PDF export

## Tech Stack

- HTML5, CSS3, Vanilla JavaScript
- Supabase (PostgreSQL database + Auth)
- Vercel (Deployment)

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Vercel account

### Local Development

```bash
# Install dependencies (for local server)
npx serve

# Or use Python
python -m http.server 8080
```

### Environment Variables

Create a `.env` file:

```env
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
```

## Project Structure

```
├── index.html          # Main entry point
├── index.css           # Global styles & design system
├── js/
│   ├── app.js          # Application controller
│   ├── data.js         # Data layer (localStorage/Supabase)
│   ├── utils.js        # Utility functions
│   ├── dashboard.js    # Dashboard module
│   ├── crm.js          # CRM module
│   ├── projects.js     # Projects module
│   ├── availability.js # Availability module
│   ├── notifications.js# Notifications module
│   └── reports.js      # Reports module
└── README.md
```

## Locations

- **Laguna Honda** - 5 classrooms (Infant to Upper Preschool)
- **Taraval** - 2 classrooms (Infant and Toddler)

## License

Private - Meaningful Beginnings © 2026
