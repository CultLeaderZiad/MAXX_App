# MAXX App — Test Credentials

## Admin Account
- **Email**: cultleaderzoz.dev@gmail.com
- **Password**: Ziad_2004_#
- **Role**: admin (super admin)
- **Access**: All admin endpoints: GET/POST /api/admin/* (require admin JWT)

## Test User Account
- **Email**: testuser@maxxapp.com
- **Password**: TestMAXX_2024!
- **Role**: user
- **Onboarding**: Completed
- **Plan**: free_trial

## Backend & Supabase
- **Preview Backend**: https://fed2cac9-3adf-4392-9479-7f5e7d432653.preview.emergentagent.com
- **Supabase**: https://kfnizyhcanjrymjwukqz.supabase.co
- **Railway**: https://maxxapp-production.up.railway.app

## Key API Endpoints
- GET /api/status → {status, supabase}
- GET /api/admin/stats → trial/paying/expired counts (admin JWT required)
- PUT /api/admin/users/{id}/ban → toggle ban
- PUT /api/admin/users/{id}/extend-trial → +7 days
- GET /api/library → public library videos
