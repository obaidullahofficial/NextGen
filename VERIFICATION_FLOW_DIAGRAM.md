# 🎯 6-Digit Code Verification Flow

## Complete User Journey Visualization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     USER REGISTRATION & VERIFICATION FLOW                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐
│  START   │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────┐
│  User visits: /signup               │
│  - Enters Name                      │
│  - Enters Email (Gmail)             │
│  - Enters Password                  │
│  - Clicks "Sign Up"                 │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Backend: POST /api/signup          │
│  - Validates email format           │
│  - Checks if email exists           │
│  - Hashes password                  │
│  - Creates user (is_verified=false) │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Backend: Generate 6-Digit Code     │
│  - Random.randint(0,9) x 6          │
│  - Example: "745392"                │
│  - Store in database                │
│  - Expiry: 10 minutes from now      │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Backend: Send Email via SMTP       │
│  - Connect to Gmail SMTP            │
│  - Create HTML email                │
│  - Display code prominently         │
│  - Send to user's Gmail             │
└────────────────┬────────────────────┘
                 │
                 ├──────────────────────────────────────┐
                 │                                      │
                 ▼                                      ▼
┌─────────────────────────────────┐    ┌─────────────────────────────────┐
│  Frontend: Show Success Popup   │    │  User's Gmail: Receives Email   │
│  "Check Your Email!"            │    │  Subject: Verify Your Email     │
│  "6-digit code sent"            │    │  Body:                          │
│  Click OK                       │    │  ┌───────────────────────────┐  │
└──────────────┬──────────────────┘    │  │   Your code is:           │  │
               │                       │  │                           │  │
               ▼                       │  │       7 4 5 3 9 2        │  │
┌─────────────────────────────────┐    │  │                           │  │
│  Redirect: /verify-email        │    │  │   Expires in 10 minutes   │  │
│  - Email pre-filled             │    │  └───────────────────────────┘  │
│  - Shows code input field       │    └──────────────┬──────────────────┘
│  - User types 6-digit code      │                   │
└──────────────┬──────────────────┘                   │
               │                                      │
               │  ◄─────────────────────────────────┘
               │  (User copies code from email)
               │
               ▼
┌─────────────────────────────────────┐
│  User Enters Code                   │
│  Input: [7][4][5][3][9][2]         │
│  - Auto-filters to digits only      │
│  - Max 6 characters                 │
│  - Submit button enabled            │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Frontend: Validation               │
│  - Check length === 6               │
│  - Check all digits (0-9)           │
│  - If valid, proceed                │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Backend: POST /api/verify-email    │
│  Body: {"code": "745392"}           │
│  - Find code in database            │
│  - Check if already used            │
│  - Check if expired (>10 min)       │
└────────────────┬────────────────────┘
                 │
                 ├────────────┬──────────────┬────────────┐
                 │            │              │            │
                 ▼            ▼              ▼            ▼
        ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Code Valid │  │  Invalid │  │  Used    │  │ Expired  │
        └─────┬──────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
              │              │              │             │
              ▼              ▼              ▼             ▼
   ┌──────────────────┐  ┌─────────────────────────────────┐
   │  ✅ SUCCESS      │  │  ❌ ERROR MESSAGES              │
   │  - Mark code     │  │  "Invalid verification code"    │
   │    as used       │  │  "Code already used"            │
   │  - Set user      │  │  "Code expired, request new"    │
   │    is_verified   │  └────────────────┬────────────────┘
   │    = true        │                   │
   │  - Return email  │                   ▼
   └────────┬─────────┘          ┌────────────────┐
            │                     │ User can:      │
            ▼                     │ - Try again    │
   ┌──────────────────┐           │ - Resend code  │
   │  Frontend:       │           └────────────────┘
   │  Success Screen  │
   │  ✅ "Verified!"  │
   │  Countdown 3s    │
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │  Redirect to:    │
   │  /login          │
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │  User logs in    │
   │  with verified   │
   │  account         │
   │  ✅ SUCCESS      │
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────┐
   │  Access website  │
   │  features        │
   └──────────────────┘


════════════════════════════════════════════════════════════════════════════

                          ALTERNATIVE FLOWS

════════════════════════════════════════════════════════════════════════════

FLOW 1: User didn't receive email
──────────────────────────────────

┌─────────────────────┐
│ On /verify-email    │
│ Click "Resend Code" │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│ POST /api/resend-verification│
│ Body: {"email": "user@..."}  │
└──────────┬──────────────────┘
           │
           ▼
┌──────────────────────┐
│ - Delete old codes   │
│ - Generate new code  │
│ - Send new email     │
│ - User gets fresh    │
│   6-digit code       │
└──────────────────────┘


FLOW 2: Code Expired (>10 minutes)
───────────────────────────────────

┌──────────────────────┐
│ User enters code     │
│ after 10+ minutes    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Backend checks       │
│ expires_at timestamp │
│ Current > Expires    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────┐
│ ❌ "Code expired"            │
│ Message shown                │
│ User must click "Resend"     │
│ to get new code              │
└──────────────────────────────┘


FLOW 3: Login Before Verification
──────────────────────────────────

┌──────────────────────┐
│ User tries to login  │
│ before verifying     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────┐
│ POST /api/login              │
│ Backend checks is_verified   │
│ if is_verified == false:     │
└──────────┬───────────────────┘
           │
           ▼
┌────────────────────────────────────┐
│ ❌ ERROR:                          │
│ "Email not verified. Please        │
│  check your email and verify"      │
│ User must verify first             │
└────────────────────────────────────┘


════════════════════════════════════════════════════════════════════════════

                          TIMING DIAGRAM

════════════════════════════════════════════════════════════════════════════

Time    User Action              Backend              Database         Email
────    ───────────────────────  ───────────────────  ──────────────  ─────────
0:00    Signup clicked           Create user          User saved      
                                 Generate code        Code saved      
                                 Send email           expires_at:     Send email
                                                      0:10            

0:01                                                                  ✉ Email
                                                                      delivered

0:02    Check inbox              
        See code: 745392         

0:03    Enter code               Verify code          Find code       
        Click submit             Check expiry         is_used=false   
                                 Check is_used        expires_at>now  

0:04    See success ✅           Set is_verified      User updated    
                                 Mark code used       Code is_used=   
                                                      true            

0:05    Redirect to login        

0:06    Login successful         Verify credentials   Check           
                                 is_verified=true     is_verified     
                                 Generate JWT         

0:07    Access dashboard         

────────────────────────────────────────────────────────────────────────────

11:00   (If user tries to        Verify code          Check           
        use old code after       Current time         expires_at      
        10 minutes)              > expires_at         

        ❌ "Code expired"        Return error         Code still      
                                                      in DB but       
                                                      expired         

════════════════════════════════════════════════════════════════════════════

                          CODE GENERATION LOGIC

════════════════════════════════════════════════════════════════════════════

Python Code (Backend):
───────────────────────

def generate_verification_code():
    """Generate a 6-digit verification code"""
    code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    return code
    # Examples: "745392", "012345", "999999"

Database Storage:
─────────────────

{
  "_id": ObjectId("..."),
  "email": "user@gmail.com",
  "code": "745392",
  "created_at": ISODate("2025-11-15T10:00:00Z"),
  "expires_at": ISODate("2025-11-15T10:10:00Z"),  // +10 minutes
  "is_used": false
}

Email Template:
───────────────

Subject: Verify Your Email - NextGenArchitect

Body (HTML):
┌─────────────────────────────────────┐
│  Welcome to NextGenArchitect!      │
├─────────────────────────────────────┤
│  Hello [Username],                  │
│                                     │
│  Your verification code is:         │
│                                     │
│  ╔═══════════════════════════════╗ │
│  ║                               ║ │
│  ║     7  4  5  3  9  2         ║ │
│  ║                               ║ │
│  ╚═══════════════════════════════╝ │
│                                     │
│  This code expires in 10 minutes.   │
│                                     │
│  If you didn't create an account,   │
│  please ignore this email.          │
└─────────────────────────────────────┘


Frontend Input:
───────────────

Input field properties:
- type="text"
- maxLength="6"
- pattern="[0-9]*"
- inputMode="numeric"
- style: fontSize: 24px, letterSpacing: 8px, textAlign: center

Visual representation:
┌─────────────────────────────────┐
│  Enter 6-Digit Code:            │
│  ┌───┬───┬───┬───┬───┬───┐     │
│  │ 7 │ 4 │ 5 │ 3 │ 9 │ 2 │     │
│  └───┴───┴───┴───┴───┴───┘     │
│  [   Verify Email Button   ]    │
└─────────────────────────────────┘


════════════════════════════════════════════════════════════════════════════

                          ERROR HANDLING MATRIX

════════════════════════════════════════════════════════════════════════════

Error Scenario               HTTP Code   Message                    Action
─────────────────────────   ─────────   ──────────────────────────  ──────
No code provided            400         "Code is required"         Show error
Invalid format (not 6)      400         "Must be 6 digits"         Show error
Code not found in DB        400         "Invalid code"             Show error
Code already used           400         "Code already used"        Show error
Code expired (>10 min)      400         "Code expired"             Resend button
User already verified       400         "Already verified"         Redirect login
Database connection fail    500         "Server error"             Retry
Email sending failed        500         "Email failed"             Show error

════════════════════════════════════════════════════════════════════════════
```

## 🎯 Key Features Summary

### Security:
- ✅ **10-minute expiry** - Short window prevents abuse
- ✅ **One-time use** - Code marked as used after verification
- ✅ **Random generation** - 1 million possible combinations
- ✅ **Unique codes** - Database ensures no duplicates

### User Experience:
- ✅ **Simple input** - Just 6 digits, no complex tokens
- ✅ **Clear instructions** - Email clearly shows code
- ✅ **Quick verification** - Takes seconds to complete
- ✅ **Resend option** - Easy to request new code

### Technical:
- ✅ **Auto-cleanup** - MongoDB TTL index removes expired codes
- ✅ **Validation** - Multiple layers of code validation
- ✅ **Error handling** - Clear error messages for all scenarios
- ✅ **Backward compatible** - Token field kept for legacy support

---

**Created:** November 15, 2025  
**Status:** ✅ COMPLETE AND READY FOR TESTING
