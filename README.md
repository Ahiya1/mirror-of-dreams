# The Mirror of Truth

**A sacred space to see yourself clearly**

An online reflection experience that helps people connect with their dreams through AI-powered insights. Built with love, truth, and quiet certainty.

---

## 🌟 Philosophy

The Mirror of Truth is not a productivity tool. It's a sacred space where people answer 5 deep questions about their dreams and receive reflections that show them their wholeness, not their brokenness.

- **No fixing. Only truth.**
- **Wisdom over knowledge**
- **Quiet certainty over loud persuasion**
- **Sacred technology that serves consciousness**

---

## 🚀 Features

### 🪞 **Sacred Reflection Experience**

- Cosmic breathing animation on landing page
- Breathing circle meditation opener: "You are complete. What now?"
- 5 carefully crafted questions about dreams
- AI-powered personalized reflections using Claude Sonnet 4
- Multiple reflection tones: Gentle Clarity, Luminous Fire, Let the Mirror Breathe
- Timeless insights that can be returned to months later

### 🌌 **Luminous Design**

- Deep space background with cosmic patterns
- Tone-responsive visual effects (golden breathing, gentle stars, purple lightning)
- Organic animations that arise and dissolve naturally
- Sacred interaction patterns that invite presence

### 💰 **PayPal Integration**

- Secure online payments via PayPal
- $5 USD for reflection experience
- Automatic receipt generation
- Instant access after payment

### ✉️ **Email Integration**

- Beautiful HTML emails with reflections
- Professional receipts for record keeping
- Personal messages from Ahiya

### 🎛️ **Admin Panel**

- Receipt management and tracking
- Revenue analytics
- Export payment data
- Admin testing mode with unlimited reflections

---

## 🏗️ Installation & Setup

### Prerequisites

- Node.js 18.x or higher
- Gmail account with 2FA enabled
- Anthropic API key
- PayPal Developer Account

### 1. Create Project Structure

```bash
mkdir mirror-of-truth-online && cd mirror-of-truth-online
mkdir -p api
touch .env package.json vercel.json .gitignore README.md
touch index.html reflection.html admin.html breathing.html register.html
touch api/mirror-reflection.js api/send-mirror-email.js api/generate-receipt.js api/admin-auth.js api/admin-data.js
```

### 2. Install Dependencies

```bash
npm init -y
npm install @anthropic-ai/sdk nodemailer @upstash/redis @vercel/edge-config
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

# Business Info
BUSINESS_NUMBER=your-business-number
BUSINESS_NAME=Your Business Name

# Admin Access
CREATOR_SECRET_KEY=your-admin-secret

# PayPal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Redis for receipt storage
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
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
2. Add all variables from `.env`
3. Deploy again: `vercel --prod`

### Custom Domain (Optional)

1. In Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

---

## 📁 Project Structure

```
mirror-of-truth-online/
├── 📄 index.html              # Sacred portal with floating mirrors
├── 📄 register.html           # Registration and PayPal payment
├── 📄 breathing.html          # Meditation transition
├── 📄 reflection.html         # Sacred reflection experience
├── 📄 admin.html             # Receipt management panel
├── 📁 api/
│   ├── 🤖 mirror-reflection.js    # AI reflection generation
│   ├── ✉️ send-mirror-email.js    # Email reflections
│   ├── 🧾 generate-receipt.js     # Receipt generation
│   ├── 🔐 admin-auth.js           # Admin authentication
│   └── 📊 admin-data.js           # Receipt management API
├── 📁 lib/
│   └── 💾 redis-storage.js        # Receipt storage functions
├── ⚙️ package.json
├── 🚀 vercel.json
├── 🙈 .gitignore
├── 🔐 .env.example
└── 📖 README.md
```

---

## 🎯 Usage

### For Users

1. Visit the sacred portal
2. Click "Reflect Me"
3. Enter name and email
4. Pay via PayPal ($5)
5. Experience breathing meditation
6. Choose reflection tone (Gentle Clarity, Luminous Fire, Let the Mirror Breathe)
7. Answer 5 sacred questions about your dream
8. Receive personalized AI reflection
9. Get reflection emailed for future reference

### For Admin

1. Access admin panel at `/admin`
2. Enter admin secret key
3. View receipt analytics and revenue
4. Export payment data
5. Resend receipts if needed

### Admin Testing

- Use creator secret key to access unlimited reflections
- No payment required for admin testing
- Full functionality available for testing

---

## 🔌 API Endpoints

### Mirror Reflection

```http
POST /api/reflection
Content-Type: application/json

{
  "dream": "Start an art studio",
  "plan": "Save money and find a location",
  "hasDate": "yes",
  "dreamDate": "2024-12-31",
  "relationship": "I believe I can do it but I'm scared",
  "offering": "My time, energy, and creativity",
  "userName": "Sarah",
  "tone": "fusion"
}
```

### Send Email

```http
POST /api/communication
Content-Type: application/json

{
  "action": "send-reflection",
  "email": "user@example.com",
  "content": "<p>Your reflection...</p>",
  "userName": "Sarah"
}
```

### Generate Receipt

```http
POST /api/communication
Content-Type: application/json

{
  "action": "generate-receipt",
  "email": "user@example.com",
  "name": "Sarah",
  "amount": 5,
  "paymentMethod": "paypal"
}
```

---

## 🎨 Design Philosophy

### Visual Design

- **Cosmic space**: Deep dark background with illuminating blue rays
- **Breathing animations**: Organic patterns that arise and dissolve naturally
- **Luminous interactions**: Sacred buttons and inputs that respond with light
- **Tone-responsive patterns**: Golden breathing, gentle stars, purple lightning
- **Minimal color**: Subtle cosmic palette that supports inner reflection

### User Experience

- **Sacred pacing**: No rush, contemplative timing
- **Gentle transitions**: Smooth animations that don't distract
- **Responsive design**: Beautiful on all devices
- **Accessibility**: High contrast, clear typography
- **Sacred flow**: From portal to breathing to reflection to integration

### Technical Philosophy

- **Quiet certainty**: Code that works without calling attention to itself
- **Sacred technology**: Systems that serve consciousness rather than exploit it
- **Organic interactions**: Patterns that feel alive and responsive
- **Stillness in motion**: Animations that support rather than distract

---

## 💳 PayPal Integration

### Setup PayPal

1. Create PayPal Developer Account
2. Create new app in PayPal Developer Dashboard
3. Get Client ID and Client Secret
4. Add to environment variables
5. Configure webhook endpoints for payment verification

### PayPal Flow

1. User enters details on registration page
2. PayPal button processes $5 payment
3. On successful payment, user is redirected to breathing page
4. Receipt is automatically generated and emailed
5. User proceeds to reflection experience

---

## 🔧 Customization

### Changing the AI Prompts

Edit prompt files in `/prompts/`:

- `gentle_clarity.txt` - Soft, nurturing reflection tone
- `luminous_intensity.txt` - Bold, powerful reflection tone
- `sacred_fusion.txt` - Balanced, breathing reflection tone
- `creator_context.txt` - Special context for creator reflections

### Styling Updates

- Update CSS variables in foundation.css
- Modify cosmic patterns in reflection.css
- Adjust animations and timing

### Adding Reflection Tones

1. Create new prompt file in `/prompts/`
2. Add tone option to reflection.html
3. Update tone switching logic in reflection.js
4. Add corresponding visual patterns in reflection.css

---

## 📊 Analytics & Monitoring

### Built-in Analytics

- Total revenue tracking
- Daily payment count
- Payment method breakdown
- Receipt management

### External Analytics (Optional)

- Add Google Analytics ID to environment variables
- Implement PostHog for product analytics
- Set up error monitoring with Sentry

---

## 🛡️ Security & Privacy

### Data Handling

- **Receipt storage**: Secure Redis storage for payment records
- **Email only**: No personal data stored long-term beyond receipts
- **Secure payments**: All payments via PayPal's secure infrastructure
- **Admin access**: Protected by secret key authentication

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

**PayPal Issues:**

- Verify PayPal credentials are correct
- Check PayPal Developer Dashboard for errors
- Ensure webhook URLs are configured properly

**Cosmic Patterns Not Showing:**

- Check browser console for CSS/JS errors
- Verify tone switching logic
- Clear browser cache and reload

### Debug Mode

Set `NODE_ENV=development` for:

- Detailed error messages
- Console logging
- Extended debugging info

---

## 🚀 Going Live

### Pre-Launch Checklist

- [ ] Test complete reflection flow
- [ ] Verify email delivery and formatting
- [ ] Test PayPal payment flow end-to-end
- [ ] Confirm receipt generation
- [ ] Test admin panel functionality
- [ ] Test all three reflection tones
- [ ] Test on mobile devices
- [ ] Set up custom domain

### Marketing Ready

- [ ] Social media graphics prepared
- [ ] About page content finalized
- [ ] Testimonials collected
- [ ] Analytics tracking set up
- [ ] Customer support process defined

---

## 📈 Scaling & Future

### Immediate Opportunities

- **Global reach**: PayPal enables worldwide access
- **Social sharing**: Users can gift reflections to friends
- **Subscription model**: Monthly reflection packages
- **Corporate wellness**: Team reflection experiences

### Technical Improvements

- **Advanced analytics**: Deeper user insights
- **Mobile app**: Native iOS/Android experience
- **API for partners**: White-label reflection services
- **AI improvements**: More personalized prompts

### Content Expansion

- **Question variations**: Different reflection themes
- **Seasonal content**: Holiday-specific experiences
- **Community features**: Anonymous wisdom sharing
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
git clone <your-repo> mirror-of-truth-online
cd mirror-of-truth-online
npm install
cp .env.example .env
# Edit .env with your values

# Run locally
vercel dev

# Deploy to Vercel
vercel --prod

# Access points
# Homepage: https://your-domain.com
# Admin: https://your-domain.com/admin
# Reflection: https://your-domain.com/reflection
```

Ready to create sacred spaces for truth online? Let's begin. ✨
