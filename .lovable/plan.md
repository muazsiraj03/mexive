
# Referral System Implementation Plan

## Overview
Build a complete referral system where users can share unique referral codes/links, and both the referrer and new user (referee) receive bonus credits when the referee signs up and/or makes a purchase.

---

## How It Works

### User Flow
1. **Get Referral Code**: Users access their unique referral code and shareable link from the dashboard
2. **Share**: Users share their referral link via social media, email, or direct copy
3. **New User Signs Up**: When someone clicks the link and creates an account, the referral is tracked
4. **Rewards Distributed**: Both parties receive their rewards based on configured triggers

### Reward Structure (Configurable via Admin)
- **Referrer Reward**: Bonus credits added when their referral is successful
- **Referee Reward**: Extra credits on top of normal signup credits
- **Trigger**: Rewards given on signup (immediate) or on first purchase (qualified)

---

## Implementation Scope

### 1. Database Tables

**New Table: `referrals`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| referrer_id | uuid | User who referred |
| referee_id | uuid | New user who signed up |
| referral_code | text | Code used for signup |
| status | text | pending, completed, expired |
| referrer_reward_credits | int | Credits earned by referrer |
| referee_reward_credits | int | Credits earned by referee |
| rewarded_at | timestamp | When rewards were distributed |
| created_at | timestamp | When referral was created |

**New Table: `referral_codes`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner of the code |
| code | text | Unique referral code (e.g., "JOHN123") |
| is_active | boolean | Whether code can be used |
| created_at | timestamp | Creation timestamp |

**New Table: `referral_settings`** (Admin-configurable)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| referrer_reward_credits | int | Credits given to referrer (default: 10) |
| referee_reward_credits | int | Extra credits for new user (default: 5) |
| reward_trigger | text | "signup" or "first_purchase" |
| max_referrals_per_user | int | Monthly/lifetime cap (null = unlimited) |
| cap_period | text | "monthly", "lifetime", or null |
| is_active | boolean | Enable/disable referral program |

### 2. User Dashboard Features

**New Section in Settings Page or Dedicated Tab:**
- Display user's unique referral code
- Copy button for referral code
- Shareable referral link (e.g., `mexive.lovable.app/auth?ref=CODE`)
- Social share buttons (Twitter, Facebook, WhatsApp, Email)
- Stats: Total referrals, Pending rewards, Earned credits

**Referral History Panel:**
- List of people referred (anonymized emails)
- Status of each referral (pending/completed)
- Credits earned from each

### 3. Admin Panel Features

**New Admin Page: `/admin/referrals`**
- Overview statistics (total referrals, conversion rate, credits distributed)
- Configure reward amounts (referrer/referee credits)
- Set reward trigger (signup vs first purchase)
- Enable/disable referral program
- Set referral limits per user
- View all referrals with filters

**Add to Admin Sidebar:**
- New "Referrals" menu item with Gift icon

### 4. Auth Flow Changes

**Signup Process:**
- Detect `?ref=CODE` parameter in URL
- Store referral code in session/localStorage
- After successful signup, create referral record
- If trigger is "signup": Distribute rewards immediately
- If trigger is "first_purchase": Mark as pending

### 5. Edge Function

**New Function: `process-referral`**
- Validate referral code
- Check if referrer hasn't exceeded limits
- Create referral record
- Distribute credits if trigger conditions met
- Send notifications to both users

### 6. Automatic Code Generation

- Generate unique code on user signup (e.g., first 4 letters of name + random 4 digits)
- Allow users to customize their code (if unique)

---

## Technical Details

### Referral Link Format
```
https://mexive.lovable.app/auth?ref=JOHN1234
```

### Credit Distribution Logic
```text
When reward trigger is "signup":
  1. New user signs up with referral code
  2. Validate code exists and is active
  3. Check referrer hasn't hit cap
  4. Add referee_reward_credits to new user's bonus_credits
  5. Add referrer_reward_credits to referrer's bonus_credits
  6. Mark referral as "completed"
  7. Notify both users

When reward trigger is "first_purchase":
  1. New user signs up with referral code
  2. Create referral with status "pending"
  3. When user makes first purchase (subscription or credit pack)
  4. Check for pending referral
  5. Distribute rewards to both
  6. Mark as "completed"
```

### Database Trigger
- Auto-generate referral code when new user is created in `handle_new_user()` function

---

## New Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/use-referrals.tsx` | Hook for referral data and actions |
| `src/components/dashboard/ReferralPage.tsx` | User referral dashboard |
| `src/components/admin/AdminReferrals.tsx` | Admin referral management |
| `supabase/functions/process-referral/index.ts` | Edge function for processing |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Auth.tsx` | Handle `?ref=` parameter, store and process referral |
| `src/pages/Dashboard.tsx` | Add referral route |
| `src/pages/Admin.tsx` | Add referral admin route |
| `src/components/dashboard/DashboardSidebar.tsx` | Add referral menu item |
| `src/components/admin/AdminSidebar.tsx` | Add referral menu item |
| `supabase/functions/manage-subscription/index.ts` | Trigger referral reward on first purchase |
| `supabase/functions/purchase-credits/index.ts` | Trigger referral reward on first purchase |
| Database trigger `handle_new_user()` | Auto-generate referral code |

---

## UI Components

### User Referral Card
```text
+------------------------------------------+
|  Your Referral Code                      |
|  +------------------+  [Copy] [Share]    |
|  |   JOHN1234       |                    |
|  +------------------+                    |
|                                          |
|  Share your link:                        |
|  mexive.lovable.app/auth?ref=JOHN1234    |
|                                          |
|  [Twitter] [Facebook] [WhatsApp] [Email] |
|                                          |
|  Stats:                                  |
|  - 5 People Referred                     |
|  - 50 Credits Earned                     |
+------------------------------------------+
```

### Admin Settings
```text
+------------------------------------------+
|  Referral Program Settings               |
|                                          |
|  [x] Enable Referral Program             |
|                                          |
|  Referrer Reward:  [10] credits          |
|  Referee Reward:   [5]  credits          |
|                                          |
|  Reward Trigger:   [On Signup v]         |
|                                          |
|  Limit per User:   [Unlimited v]         |
+------------------------------------------+
```

---

## Security Considerations

- Prevent self-referral (same email domain checks, IP tracking)
- Rate limit referral code validation
- Validate referral code exists before processing
- RLS policies to protect referral data
- Only show anonymized referee emails to referrers

---

## Notifications

**To Referrer:**
- "Someone signed up with your code! +10 credits"
- "Your referral made their first purchase! +10 credits" (if first_purchase trigger)

**To Referee:**
- "Welcome! You received 5 bonus credits from your referral"
