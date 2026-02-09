# YouTube Summarizer App - Project Brief

**Last Updated:** February 7, 2026
**Status:** MVP Development
**Related Files:** `COMPETITOR_ANALYSIS_REPORT.md`, `QUICK_SUMMARY.md`

---

## 🎯 Product Vision

A YouTube summarizer iOS app that transforms how busy professionals consume video content. We're not just summarizing - we're solving "backlog guilt" (the frustration of accumulating unwatched educational content while lacking time to consume it meaningfully).

### Core Differentiator
**Contextual Summaries** - Not shallow bullet points. We preserve reasoning, stories, and connections between ideas. A 10-15 minute deep-dive that transfers real knowledge, not just information.

### Key Insight
> "Your real competition isn't Eightify or NoteGPT. Your real competition is 'doing nothing' and 'feeling guilty about it.'"

- 40-50% of potential users just don't watch content and accept FOMO
- Only 5-10% currently use summarizer tools
- Our job is convincing users there's a better way that fits their life

---

## 👥 Target Audience

### Primary: Busy Professionals (25-45)
- Time-poor due to demanding jobs or families
- Want to stay current/sharp in their field
- Experience guilt about unwatched content backlog
- **Willingness to pay:** High ($19/mo easy)
- **Pricing frame:** "Get back 10+ hours/month" or "$0.25/day"

### Secondary: Young Learners (20-35)
- Have time but not attention
- Want to learn but easily distracted
- **Willingness to pay:** Medium ($9/mo)

### Tertiary: Content Creators
- Need efficient research for their own content
- **Willingness to pay:** Medium-High

### Usage Context (When They'll Use the App)
| Context | Fit | Notes |
|---------|-----|-------|
| Morning peak (8:15-8:30am) | ✅ | Quick read before work |
| Midday/lunch (10am-3pm) | ✅ | 32% of podcast listening happens here |
| Evening wind-down (6-10pm) | ✅ | Couch/bed time |
| Before sleep | ✅ | Skews older demographic |
| Commuting | ✅ | Audio summaries (MVP) |
| Working out | ❌ | Not ideal for reading |

---

## 🛠 Technical Stack

- **Framework:** React Native (iOS-first, enables Android in V2)
- **Why React Native:** Founder's technical background, network skews iOS, cross-platform efficiency for V2

---

## 📱 Platform Strategy

| Phase | Platform | Purpose | Timeline |
|-------|----------|---------|----------|
| MVP | iOS app | Core product, primary audience | Week 0-12 |
| MVP | Web landing page | Waitlist, blog/SEO, public library viewing | Week 0-12 |
| V2 | Android app | Expand reach (React Native makes this easy) | Month 4-6 |
| V3 | Full web app | Generation + consumption | Month 6-12 |
| V3 | Chrome extension | If demand exists | Month 6-12 |

---

## ✨ Feature Roadmap

### MVP (Week 0-12)

#### Input
| Feature | Notes |
|---------|-------|
| YouTube URL input | Core functionality |
| Subscribe to Creators/Categories | Follow channels, get notified, auto-summarize option |

#### Output
| Feature | Notes |
|---------|-------|
| Quick Summary | 30-second overview |
| Contextual Summary | 10-15 min, topic-based, **THE DIFFERENTIATOR** |
| Refresher Cards | Tinder-style swipe to save, shareable |
| Actionable Insights | End of summary section |
| Books/Resources + Affiliate | Amazon links for monetization |
| Translation | User-initiated, cached per language |
| Audio Summaries | High-quality TTS for commuters, listen on the go |

#### Platform Features
| Feature | Notes |
|---------|-------|
| Community Library | Public summaries, read with limits |
| Offline Mode | Download for reading |
| Basic Creator Profiles | Stats, "rewards coming" teaser |
| Personalised Onboarding | Interests, goals, age, preferred categories, learning style |
| Social Login | Google + Apple Sign-In (alongside email) |
| Subscription Tiers & Usage Limits | Free / Pro / Power tiers with credit-based limits |
| Fail gracefully (no captions) | "Captions unavailable - coming soon" message |

---

### V1.5 (Month 2-3)

| Feature | Notes |
|---------|-------|
| Whisper transcription | "No captions? Costs 2 credits" |
| Other URL / file upload | Non-YouTube URLs, custom video/audio upload |
| Confidence Scores | Per-section accuracy indicators |
| AI Chat follow-up | Ask questions about the video |
| Multi-model validation | Pro/Power tier - GPT-4 + Claude cross-check |
| "Make it Yours" | Personalization Level 2 |
| Enhanced notifications | Smarter digest, preferences |

---

### V2 (Month 4-6)

| Feature | Notes |
|---------|-------|
| Android app | React Native cross-platform |
| Export (PDF, Markdown) | Power users |

---

### V3 (Month 6-12)

| Feature | Notes |
|---------|-------|
| Anki export | Education market |
| Team plans / B2B | Shared libraries |
| Creator rewards program | Revenue share |
| API access | Developers |
| Integrations | Notion, Readwise |

---

## 💰 Pricing Strategy

### Tiers
| Tier | Price | Target |
|------|-------|--------|
| Free | $0 | Trial, build trust |
| Pro | $9/mo | Regular users, young learners |
| Power | $19/mo | Busy professionals, power users |

### Pricing Psychology
| Framing | User Reaction |
|---------|---------------|
| "$9/month" | ❌ "Another subscription..." |
| "$90/year (save 17%)" | ✅ "That's reasonable for a year" |
| "$0.25/day" | ✅ "Less than a coffee" |
| "Get back 10+ hours/month" | ✅ "That's worth way more than $9" |

**Key:** Daily framing + time-saved ROI = conversion weapons

---

## 📣 Marketing Strategy

### Primary Channels (Start Now)
| Channel | Type | When |
|---------|------|------|
| LinkedIn (personal) | Founder-led, build in public | Now |
| Indie Hackers | Document journey | Now |
| Twitter replies | Follow productivity accounts, add value | Now |

### At Launch
| Channel | Type | When |
|---------|------|------|
| LinkedIn (app account) | Summaries, value content | Launch |
| Twitter (app account) | Summaries, engagement | Launch |
| Friends network | Coordinated launch posts | Launch week |

### Post-Launch
| Channel | Type | When |
|---------|------|------|
| Reddit | r/productivity, r/ADHD, r/entrepreneur, r/parentinghacks | Post-launch (be helpful, not salesy) |
| Instagram | Behind-scenes, lifestyle | Post-launch |
| SEO/Blog | Summaries as indexable content | Long-term |
| Product Hunt | Launch spike | V1.5 (when polished) |

### Future (Year 2)
| Channel | Type | When |
|---------|------|------|
| B2B / Perkbox | Employee benefits channel | Year 2 |

---

## 📊 Financial Projections (Year 1)

| Metric | Target |
|--------|--------|
| Month 12 MRR | ~$4,356 |
| Paid users (end of Y1) | ~396 |
| Annual Revenue | ~$24,000 |
| Total Costs | ~$11,300 |
| Net Profit | ~$12,700 |
| Average Margin | ~53% |

### Key Milestones
| Milestone | When | Meaning |
|-----------|------|---------|
| $1,000 MRR | Month 2-3 | Product-market fit signal |
| $2,500 MRR | Month 6 | Covers basic expenses |
| $5,000 MRR | Month 12-14 | Real business, consider full-time |

---

## 🏆 Competitive Landscape

**See:** `COMPETITOR_ANALYSIS_REPORT.md` for full 30+ competitor analysis

### Top Competitors to Beat
1. **Eightify** - Speed (5-10s), but accuracy issues, restrictive free tier
2. **Monica AI** - Multi-platform, GPT-4o + Claude, but generalist
3. **NoteGPT** - No length limits, batch processing, but web-focused
4. **Recall** - Highest quality (8.9/10), but mobile still in beta
5. **Noiz** - Free unlimited, but quality concerns

### Our Positioning: "The Accurate One"
- Multi-model validation (accuracy over speed)
- Contextual summaries (depth over bullet points)
- Native mobile experience (not web wrapper)
- Generous free tier to build trust

### User Pain Points We're Solving
1. **Accuracy** - Hallucinations, shallow summaries, missing key points
2. **Restrictive free tiers** - Only 1-3 videos/day (we'll offer more)
3. **No offline mode** - Privacy concerns, can't use on commute
4. **Caption dependency** - Fails without subtitles (Whisper in V1.5)

---

## 🚀 MVP Development Priorities

### Must Have (Launch Blockers)
1. YouTube URL input → Contextual Summary generation
2. Quick Summary (30s version)
3. User accounts (email + social login)
4. Subscription tiers & usage limits (Free / Pro / Power)
5. Personalised onboarding (interests, goals, age, categories)
6. Community Library (public summaries)
7. Refresher Cards UI
8. Audio Summaries (TTS)
9. Offline reading mode
10. Basic onboarding flow

### Should Have (Week 1-2 Post-Launch)
1. Creator subscriptions
2. Actionable Insights section
3. Amazon affiliate links
4. Push notifications

### Nice to Have (V1.5)
1. Whisper transcription (no captions)
2. Other URL / file upload
3. Confidence Scores
4. AI Chat follow-up
5. Multi-model validation
6. Personalization Level 2 ("Make it Yours")
7. Enhanced notification preferences

---

## 📝 Notes for Development

### API Considerations
- YouTube transcript API for captions
- Claude API for summarization (primary)
- GPT-4 for multi-model validation (V1.5)
- Whisper API for transcription (V1.5)

### Key UX Principles
1. **Speed matters** - Show progress, don't block UI
2. **Fail gracefully** - Clear messages when captions unavailable
3. **Mobile-first** - Thumb-friendly, works on commute
4. **Trust signals** - Show confidence scores, cite timestamps

### Monetization from Day 1
- Amazon affiliate links on book/resource recommendations
- Track conversion for revenue diversification

---

## 📚 Reference Documents

1. `COMPETITOR_ANALYSIS_REPORT.md` - Full 30+ competitor deep-dive
2. `QUICK_SUMMARY.md` - Executive summary of competitive landscape

---

*This brief should be read before starting any development work. Ask clarifying questions if anything is unclear.*
