# The Mirror of Truth | מראת האמת

**A sacred bilingual space to see yourself clearly**

A reflection experience that helps people connect with their dreams through AI-powered insights. Built with love, truth, and quiet certainty.

---

## 🌟 Philosophy

The Mirror of Truth is not a productivity tool. It's a sacred space where people answer 5 deep questions about their dreams and receive reflections that show them their wholeness, not their brokenness.

- **No fixing. Only truth.**
- **Wisdom over knowledge**
- **Quiet certainty over loud persuasion**
- **Bilingual: English & Hebrew (עברית)**

---

## 🚀 Features

### 🪞 **Sacred Reflection Experience**

- Floating broken mirrors animation on landing page
- Breathing circle meditation opener: "You are complete. What now?"
- 5 carefully crafted questions about dreams
- AI-powered personalized reflections using Claude Sonnet 4
- Timeless insights that can be returned to months later

### 🌍 **Bilingual Support**

- Full Hebrew (עברית) and English support
- Right-to-left (RTL) layout for Hebrew
- Culturally appropriate content and design
- Language preference saved across sessions

### 💰 **Payment System**

- **Cash payments** at booth locations with access codes via email
- **Bit payments** (Israeli mobile payment system)
- Automatic receipt generation in both languages
- Admin panel for booth management

### ✉️ **Email Integration**

- Beautiful HTML emails with reflections
- Professional receipts for business compliance
- Access codes for cash payments
- Personal messages from Ahiya

### 🎛️ **Admin Panel**

- Real-time booth management
- Send access codes for cash payments
- Generate and send receipts
- Track daily statistics and revenue
- Export session data
- Admin testing mode with unlimited reflections

---

## 🏗️ Installation & Setup

### Prerequisites

- Node.js 18.x or higher
- Gmail account with 2FA enabled
- Anthropic API key

### 1. Create Project Structure

```bash
mkdir mirror-of-truth && cd mirror-of-truth
mkdir -p api
touch .env package.json vercel.json .gitignore README.md
touch index.html reflection.html admin.html
touch api/mirror-reflection.js api/send-mirror-email.js api/send-access-code.js api/verify-payment.js api/generate-receipt.js
```

### 2. Install Dependencies

```bash
npm init -y
npm install @anthropic-ai/sdk nodemailer
```

### 3. Environment Setup

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 4. Required Environment Variables

```env
# Essential - Required for core functionality
ANTHROPIC_API_KEY=sk-ant-api03-...
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password

# Business Info (Ahiya's details)
BUSINESS_NUMBER=325761682
BIT_PHONE=+972587789019
BUSINESS_NAME=AhIya
```

### 5. Gmail Setup

1. Enable 2-factor authentication on Gmail
2. Go to Google Account → Security → 2-Step Verification → App passwords
3. Generate app password for "Mail"
4. Use the 16-character password in `GMAIL_APP_PASSWORD`

### 6. Anthropic API Setup

1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Add billing information
3. Create API key
4. Add to `ANTHROPIC_API_KEY`

---

## 🚀 Deployment to Vercel

### Quick Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts to connect to your account
```

### Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from `.env.example`
3. Deploy again: `vercel --prod`

### Custom Domain (Optional)

1. In Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

---

## 📁 Project Structure

```
mirror-of-truth/
├── 📄 index.html              # Bilingual homepage with floating mirrors
├── 📄 reflection.html         # Sacred reflection experience
├── 📄 admin.html             # Booth management panel
├── 📁 api/
│   ├── 🤖 mirror-reflection.js    # AI reflection generation (bilingual)
│   ├── ✉️ send-mirror-email.js    # Email reflections (bilingual)
│   ├── 🔑 send-access-code.js     # Cash payment access codes
│   ├── 💳 verify-payment.js       # Bit payment verification
│   └── 🧾 generate-receipt.js     # Receipt generation (bilingual)
├── ⚙️ package.json
├── 🚀 vercel.json
├── 🙈 .gitignore
├── 🔐 .env.example
└── 📖 README.md
```

---

## 🎯 Usage

### For Users

1. Visit the homepage
2. Click "Reflect Me" (תראה לי in Hebrew)
3. Enter name and email
4. Choose payment: Cash (booth only) or Bit
5. Answer 5 sacred questions about your dream
6. Receive personalized AI reflection
7. Get reflection emailed for future reference

### For Booth Operation

1. Access admin panel at `/admin`
2. Set booth location and status
3. For cash payments:
   - Enter customer email and name
   - Send access code via email
   - Customer uses code to access reflection
4. Track daily stats and revenue
5. Generate receipts as needed

### Admin Testing

- Access `/reflection?admin=true` for unlimited reflections
- No payment required for testing
- Full functionality available

---

## 🔌 API Endpoints

### Mirror Reflection

```http
POST /api/mirror-reflection
Content-Type: application/json

{
  "dream": "Start an art studio",
  "plan": "Save money and find a location",
  "hasDate": "yes",
  "dreamDate": "2024-12-31",
  "relationship": "I believe I can do it but I'm scared",
  "offering": "My time, energy, and creativity",
  "userName": "Sarah",
  "language": "en"
}
```

### Send Email

```http
POST /api/send-mirror-email
Content-Type: application/json

{
  "email": "user@example.com",
  "content": "<p>Your reflection...</p>",
  "userName": "Sarah",
  "language": "en"
}
```

### Access Codes (Cash Payments)

```http
POST /api/send-access-code
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "Sarah",
  "language": "en"
}
```

### Generate Receipt

```http
POST /api/generate-receipt
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "Sarah",
  "amount": 20,
  "paymentMethod": "cash",
  "language": "en"
}
```

---

## 🎨 Design Philosophy

### Visual Design

- **Broken mirrors**: Floating circles with fragmented reflections
- **Breathing animations**: Slow, meditative pulse (4-second cycle)
- **Dark velvet background**: Deep space gradients
- **Luminous white accents**: Clean, sacred typography
- **Minimal color**: Subtle aurora-like hints when mirrors align

### User Experience

- **Sacred pacing**: No rush, contemplative timing
- **Gentle transitions**: Smooth 0.8s animations
- **Responsive design**: Beautiful on all devices
- **Accessibility**: High contrast, clear typography
- **Bilingual flow**: Seamless language switching

### Cultural Sensitivity

- **Hebrew RTL layout**: Proper right-to-left design
- **Israeli payment methods**: Bit integration for local users
- **Business compliance**: Proper receipts with business number
- **Cultural language**: Hebrew that feels natural, not translated

---

## 🔧 Customization

### Changing the AI Prompt

Edit `getMirrorPrompt()` in `api/mirror-reflection.js`:

- Adjust tone and voice
- Modify reflection structure
- Add new pattern analysis capabilities

### Styling Updates

- Update CSS variables in HTML files
- Modify color schemes
- Adjust animations and timing

### Adding Languages

1. Add translations to `translations` object
2. Update language toggle functionality
3. Add RTL support if needed
4. Update email templates

---

## 📊 Analytics & Monitoring

### Built-in Analytics

- Daily reflection count
- Revenue tracking
- Payment method breakdown
- Session completion rates
- Access code usage

### External Analytics (Optional)

- Add Google Analytics ID to environment variables
- Implement PostHog for product analytics
- Set up error monitoring with Sentry

---

## 🛡️ Security & Privacy

### Data Handling

- **No persistent storage**: Sessions stored in memory only
- **Email only**: No personal data stored long-term
- **Secure emails**: All communications via encrypted email
- **Access codes**: 24-hour expiration, single-use

### Security Headers

- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: enabled
- CORS properly configured

---

## 🐛 Troubleshooting

### Common Issues

**AI Not Responding:**

- Check Anthropic API key in environment variables
- Verify API has sufficient credits
- Check console for error messages

**Emails Not Sending:**

- Verify Gmail app password (not regular password)
- Ensure 2FA is enabled on Gmail account
- Test with your own email first

**Access Codes Not Working:**

- Check code generation in admin panel
- Verify email delivery
- Ensure codes aren't expired (24hr limit)

**Hebrew Layout Issues:**

- Verify `dir="rtl"` is set correctly
- Check CSS for proper RTL support
- Test with Hebrew content

### Debug Mode

Set `NODE_ENV=development` for:

- Detailed error messages
- Console logging
- Extended debugging info

---

## 🚀 Going Live

### Pre-Launch Checklist

- [ ] Test complete reflection flow in both languages
- [ ] Verify email delivery and formatting
- [ ] Test access code system end-to-end
- [ ] Confirm Bit payment URL generation
- [ ] Test admin panel functionality
- [ ] Verify receipt generation
- [ ] Test on mobile devices
- [ ] Check all translations

### Booth Setup

- [ ] Laptop with good wifi connection
- [ ] Power bank for extended operation
- [ ] Receipt book for cash payments (חשבונית)
- [ ] Clear signage with pricing (20 NIS)
- [ ] Backup internet (mobile hotspot)
- [ ] Admin panel bookmarked

### Operational Flow

1. Customer sees sign and approaches
2. Brief explanation of the experience
3. Payment: cash (receipt + access code) or Bit
4. Customer completes reflection
5. Reflection emailed automatically
6. Admin marks session complete

---

## 📈 Scaling & Future

### Immediate Opportunities

- **Multiple locations**: Tel Aviv, Jerusalem, Haifa
- **Events**: Festivals, conferences, markets
- **Partnerships**: Wellness centers, cafes
- **Corporate**: Team building, workshops

### Technical Improvements

- **Database integration**: PostgreSQL or MongoDB
- **User accounts**: Save multiple reflections
- **Advanced analytics**: Deeper insights
- **Mobile app**: Native iOS/Android experience

### Content Expansion

- **Question variations**: Different reflection themes
- **Seasonal content**: Holiday-specific experiences
- **Community features**: Share anonymous insights
- **Mentor matching**: Connect with guides

---

## 🤝 Contributing

This is a sacred project. Contributions should align with the philosophy of quiet truth over loud persuasion.

### Getting Started

1. Fork the repository
2. Test the experience yourself
3. Understand the philosophy
4. Submit thoughtful improvements

### Code Style

- **Meaningful names**: Clear, descriptive variables
- **Sacred spacing**: Generous whitespace for readability
- **Gentle comments**: Explain the why, not just the what
- **Respectful commits**: Thoughtful commit messages

---

## 📜 License

MIT License - Use this to create more spaces for truth in the world.

---

## 🙏 Support

### Technical Issues

- Check console logs first
- Ensure all environment variables are set
- Test in incognito mode to rule out cache issues

### Philosophy Questions

Remember: we trust the dreamer's inner compass more than any external strategy.

### Contact

For questions about the vision, implementation, or collaboration opportunities, reach out through the reflection system itself - the best way to understand this work is to experience it.

---

**Built with quiet certainty by Ahiya**

_"Your dream chose you as carefully as you're choosing it."_

---

## 🎯 Quick Start Commands

```bash
# Clone and setup
git clone <your-repo> mirror-of-truth
cd mirror-of-truth
npm install
cp .env.example .env
# Edit .env with your values

# Run locally
npm run dev

# Deploy to Vercel
npm run deploy

# Access points
# Homepage: http://localhost:3000
# Admin: http://localhost:3000/admin
# Reflection: http://localhost:3000/reflection
```

Ready to create sacred spaces for truth? Let's begin. ✨
