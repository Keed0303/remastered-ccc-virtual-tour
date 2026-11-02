# Business Evaluation: CCC Virtual Tour as a Commercial Product

**Date:** 2026-11-02
**Verdict:** Not recommended in its current form. A narrower version, a paid 3D campus tour service for private colleges, has potential but needs validation.

## Summary

- **The product is a good thesis, not yet a business.** It has no paying customer, no buyer conversations, and no feature that produces a result a school would pay for. It has no inquiry form and no visitor analytics, so a school can't see what it gets for its money.
- **The features that were most interesting to build are the least commercially necessary.** Voice, sitting, avatars, and accounts don't help a school recruit or orient students. Live multiplayer also has a scaling limit that could stop it working at about 7 people walking at once.
- **CCC is the wrong first customer.** It is a city-funded, free-tuition college, so it has little reason to pay for recruitment.
- **The biggest competitor is free.** Student capstone projects, Roblox, Minecraft, Google Street View, and cheap 360° photo tours all exist. The original CCC tour appears to have been a project group's work too, though I couldn't confirm it was a capstone.
- **The realistic size is a small service business, not a venture-scale SaaS.** The moderate scenario below only about breaks even in year one once your own pay is counted.
- **Spend about ₱15,000 and 90 days finding out if anyone will pay.** Stop if no school pays a deposit by day 90.

## How to read this

| Label | Meaning |
|---|---|
| **Fact** | Seen in the code or stated by a cited source |
| **Vendor claim** | Published by a company with something to sell |
| **Assumption** | My guess, to be replaced with real data |
| **Estimate** | My calculation from facts and assumptions |
| **Recommendation** | What I would do |

**Missing information.** You didn't describe a business model, target customer, budget, or thesis deadline, so I evaluated the most likely business: selling this kind of tour to schools. These would change the analysis:

- Your available hours and cash
- Your real monthly income needs
- Any existing contacts at schools
- Who owns the thesis work under CCC's rules
- Whether the original tour's authors will grant reuse rights

**Exchange rate:** ₱63.10 to US$1, the [BSP average for October 2026](https://www.bsp.gov.ph/statistics/external/day99_data.aspx).

---

## 1. What the business is

### Observed in the product

| Area | What exists |
|---|---|
| **Tour** | A code-built 3D model of the CCC campus, cutaway floors, 12 of the original 360° photos, and one walk-in lobby |
| **Game** | Student Passport with stamps, XP, levels, quizzes, and badges |
| **Social** | Accounts, avatar customization, live presence, nearby voice chat, and sitting on benches |
| **Admin** | User management, settings, and a dashboard that counts accounts, online users, gender split, and unconfirmed emails |
| **Code** | About 6,100 lines of TypeScript. React, Three.js, Supabase, and Vercel |

### Not found in the code

| Missing | Why it matters |
|---|---|
| Inquiry, application, or contact form | A school can't connect the tour to a new student |
| Visitor analytics | A school can't see who used the tour or for how long |
| Support for a second school | Buildings are hand-written code in `src/scene/world/`, and the live channel is hard-coded as `campus` (`src/utils/backend/supabase.ts:88`) |
| Content editing for staff | Text changes need a developer |

### The problem, and whether it is real

There are two possible problems, and they have different buyers:

| Problem | Buyer | Assessment |
|---|---|---|
| **Recruitment:** prospective students can't picture the campus | Marketing or admissions office | Real for schools competing for students. Weak for free-tuition schools |
| **Orientation:** new students get lost and don't know the offices | Student affairs | Real but mild. It lasts about two weeks, and a map or student guide already handles most of it |

**Difference from existing options:** it is a stylized, game-like 3D tour that runs in a browser with no install. That is different, but I found no evidence that buyers want this difference.

**Assessment:** today it mostly demonstrates interesting technology. The value customers would pay for, which is more inquiries and better-prepared new students, is neither built nor measured.

---

## 2. Market validation

### Size of the market

**Fact:** [CHED's count for AY 2024-25, as of June 26, 2025](https://legacy.ched.gov.ph/statistics/):

| | Private | LUC | SUC main | SUC satellite | Other gov't | Total |
|---|---:|---:|---:|---:|---:|---:|
| **Philippines** | 1,619 | 154 | 113 | 442 | 6 | **2,334** |
| **CALABARZON** | 280 | 21 | 5 | 58 | 1 | **365** |

These totals exclude 85 private and 7 government institutions in BARMM. No reliable figure exists for how much Philippine schools spend on virtual tours, and I won't invent one.

**Estimate of the realistic ceiling.** Suppose 10% of CALABARZON's private schools (28) each paid ₱72,000 a year (₱6,000 a month). That comes to about **₱2 million a year**. Both inputs are assumptions. Even nationally at the same rate, it is 162 schools and about ₱11.7 million a year. That can support a person or a small team, but it won't attract venture funding.

### Customer segments

| Segment | Motive to pay | Ability to pay | Verdict |
|---|---|---|---|
| **Private colleges (500–1,500 students)** | **High.** [PIDS found](https://pids.gov.ph/details/news/press-releases/free-tuition-law-puts-pressure-on-private-colleges-experts) the free tuition law worsened private enrollment decline | Low to medium. [More than 1,000 are small and tuition-dependent](https://mb.com.ph/13/1/2025/financial-crisis-threatens-ph-higher-education) | **Start here** |
| **Larger private universities** | Medium to high | High | Second. They may build in-house or use larger agencies |
| **SUCs and LUCs** | Low. Tuition is free, so recruitment pressure is weak | Low, and they must follow procurement rules | Avoid at first |
| **Senior high and basic education schools** | Medium. [Private schools report falling enrollment](https://www.philstar.com/headlines/2025/09/30/2476504/private-schools-urge-govt-expand-voucher-program-amid-falling-enrollment) | Mixed | Worth testing |
| **Property developers** | High. [Megaworld](https://dailyguardian.com.ph/?p=367052), [Alveo](https://business.inquirer.net/?p=335494), and [DMCI](https://www.dmcihomes.com/amp/whats-new/news/explore-with-the-new-360-degree-virtual-tour) already invest in showrooms or virtual tours | High | Worth 5 test meetings. See section 12 |

**CCC itself:** [the city subsidizes it and tuition is free](https://en.wikipedia.org/wiki/City_College_of_Calamba). Its [enrollment is listed as about 1,365](https://xuanxiao.org/en/universities/city-college-of-calamba), from a directory I couldn't confirm. It is valuable as a free reference site, not as a paying customer.

### Competitors and alternatives

| Alternative | Cost | Strength | Weakness |
|---|---|---|---|
| **Student capstone project** | Free to the school | Local and easy to get. A [study at Ilocos Sur Polytechnic](https://download.atlantis-press.com/proceedings/icetech-24/126019044) developed one, and your own thesis shows it can be done | Stops being maintained when students graduate |
| **Roblox or Minecraft campus** | Low | Students already play there. [Utah State launched a Roblox campus in Fall 2026](https://www.usu.edu/today/story/usu-offers-virtual-campus-experience-through-roblox/), and [80 UST students built a Minecraft campus in two months](https://mb.com.ph/2020/8/28/a-first-look-into-the-incredibly-detailed-ust-minecraft-server) | Needs an install and an account. Off-brand for some schools |
| **Google Street View tours** | [One-time fee, no recurring cost](https://360manila.com/) (amount not published) | Appears on Google Maps, where people already look | No game and little content |
| **Local 360° photographers** | [Anova, based in Laguna, charges ₱500 per extra panorama](https://anovavirtualtours.ph/virtual-tour-services-and-package/). Package prices aren't published | Real photos, fast, delivered in days | Static and no measurement |
| **Matterport scanning** | [US$1,500+ per building plus US$20 a month](https://www.thefuture3d.com/equipment/compare/virtual-tour-platforms-education/) (vendor estimate) | Accurate and quick | Expensive locally per building |
| **Concept3D and YouVisit** | [US$10,000–50,000+ a year](https://www.thefuture3d.com/equipment/compare/virtual-tour-platforms-education/), about ₱631,000–₱3.2 million (vendor estimate with no stated method; [Concept3D only gives quotes](https://concept3d.com/interactive-virtual-experiences/pricing/)) | Mature, with maps, events, and analytics | Out of reach for small Philippine colleges |
| **In-house tours** | Staff time | [UST](https://www.ust.edu.ph/public-affairs-opens-ust-virtual-tour-for-online-visits/) and [UPOU](https://www.upou.edu.ph/news/upou-unveils-pioneering-virtual-reality-tour-featuring-360-degree-videos-and-images/) already have tours | Needs staff and skills |
| **Doing nothing** | Free | Facebook pages, photos, and open houses | The most common competitor |

**The opening (Estimate):** there seems to be a gap between cheap 360° photo tours and foreign platforms costing ₱600,000 or more a year. Whether schools want to pay for something in that gap is exactly what's unproven.

### Demand evidence

| Finding | Source | How much to trust it |
|---|---|---|
| 73% of students use virtual tours or VR, and 79% find them helpful | [RNL 2023](https://www.ruffalonl.com/wp-content/uploads/2023/08/26J80-E-Expectations-Series-Engaging-Prospective-Students-Through-Virtual-Experiences-and-Video-Content.pdf) | US data from an enrollment consultancy. [eCampus News](https://www.ecampusnews.com/campus-leadership/2023/08/03/when-it-comes-to-recruitment-websites-are-key/2/) reports the 73% differently, so check the report |
| 26% conversion rate across about two million tours | [StudentBridge](https://studentbridge.com/blog/intelligence-power-of-virtual-tours) | Vendor claim |
| 56% visited a campus in person, and only 7% virtually | [Inside Higher Ed / Student Voice](https://www.insidehighered.com/node/8760) | Independent, and it suggests in-person visits still dominate |
| Gamified orientation is enjoyable | [Ghent University, 1,326 students](https://papers.academic-conferences.org/index.php/ecgbl/article/view/672) | Measures enjoyment, not results |

**Gaps:**

- I found **no Philippine data** on whether a virtual tour changes where students enroll.
- I found **no controlled study** showing that a gamified virtual campus improves wayfinding or reduces anxiety. Your thesis could be useful local evidence on this.
- I found **no evidence that Philippine schools pay for gamified tours specifically**. Absence from my search isn't proof, but you need to test it directly.

### Adoption barriers

- A single school decision may need the president, finance, and marketing to agree.
- Small colleges have tight budgets and may treat this as a nice extra.
- Public schools must follow procurement rules.
- Students on low-end phones or limited data may not get a good experience. This hasn't been tested on real phones.

---

## 3. Problem-solution fit

| Question | Honest answer |
|---|---|
| **Painful enough to pay for?** | Falling enrollment is painful. "No virtual tour" isn't. A school will pay for students, not for a tour |
| **How do they solve it today?** | Facebook, school visits, open houses, referrals, scholarships, and sometimes a 360° tour |
| **Why switch?** | Only if the product is shown to bring inquiries, or is clearly more engaging at a similar price. Neither is proven |
| **Necessary or interesting?** | Interesting. No school needs it to operate |
| **Does the technology help?** | Partly. A browser tour with no install helps, and the 3D overview shows the whole campus better than photos do. Multiplayer and voice add little for a prospective student visiting alone, likely at odd hours |
| **Is there something simpler?** | Yes. A Facebook video, or a 360° tour on the school website. **Test the simple version's appeal against yours before building more** |

**A hard question to answer early:** would a school pay ₱150,000 for this instead of spending it on Facebook ads? If you can't answer that with a real school's reasoning, there's no product yet.

---

## 4. Business model

| Model | Fit | Why |
|---|---|---|
| Pure monthly SaaS | ❌ | Each campus needs custom building, so a monthly fee alone can't cover the work |
| Freemium | ❌ | A free tier has no meaning when each campus takes weeks to build |
| Usage-based | ❌ | Schools need predictable budgets, and it penalizes success |
| One-time project | ⚠️ | Easy to buy, but no recurring income, and the tour goes stale |
| White-label licensing | ⚠️ Later | Only makes sense once there's a repeatable tool |
| **Setup fee + annual subscription** | ✅ **Recommended** | Setup pays for the build. The annual fee pays for hosting, updates, and reports, and suits school budgeting |

### Proposed pricing

**These are my recommendations for testing, not market rates.** No published price exists for a comparable local product.

| | **Starter** | **Standard** | **University** |
|---|---|---|---|
| **Target** | Private college, 500–1,500 students | Private college with several buildings | Multi-campus or larger school |
| **Setup** | ₱120,000 | ₱250,000 | From ₱500,000 |
| **Annual** | ₱40,000 | ₱80,000 | From ₱180,000 |
| **Monthly option** | ₱4,000 | ₱8,000 | Not offered |
| **Buildings** | Up to 2 | Up to 5 | Custom |
| **360° photos** | Up to 15 | Up to 50 | Custom |
| **Game** | Basic stamps and quiz | Enrollment quest and orientation hunt | Custom quests |
| **Inquiry form and report** | ✅ Monthly report | ✅ Monthly report + staff review | ✅ + CRM export |
| **Content updates** | 1 per year | 2 per year | 4 per year |
| **Limits** | No accounts or multiplayer | Optional single-event session | Scheduled events |

**Other possible revenue:**

| Add-on | Suggested price |
|---|---|
| Extra 360° photo, including capture | ₱800 each |
| Yearly re-shoot and update | ₱25,000 |
| Foundation Day or open house event version | ₱25,000 per event |
| Orientation quest customization | ₱30,000 |

**First three clients:** offer a pilot at about half the setup fee in exchange for a written case study and permission to use their results. **Don't work for free**, because payment is what you're testing. CCC is the one exception, since the reference and written permissions are worth more than a fee.

---

## 5. Financial feasibility

### Development already spent

The work so far is a sunk cost and shouldn't influence the decision. It came from thesis time, and I don't have your hours to price it.

### Running costs

| Item | Monthly | Status |
|---|---|---:|
| Vercel Pro. [Hobby is non-commercial only](https://examples.vercel.com/pricing), so paid work requires this | [US$20](https://makerkit.dev/blog/saas/vercel-cost), about ₱1,260 | Fact, from a secondary source. Confirm before paying |
| Supabase Pro. [Free projects pause after a week idle](https://supabase.com/pricing), which clients can't accept | [US$25](https://supabase.com/pricing), about ₱1,580 | Fact |
| Voice relay, if ever needed | [First 1,000 GB free at Cloudflare, then US$0.05/GB](https://developers.cloudflare.com/realtime/turn/faq/) | Fact. Near zero at this scale |
| Domain, email, and small tools | ₱1,000 | Assumption |
| Accounting and registration upkeep | ₱4,000 | Assumption. Get a local quote |
| Travel and sales | ₱5,000 | Assumption |
| **Cash costs** | **About ₱12,500 (₱150,000 a year)** | Estimate |
| **Your own pay** | **₱50,000 (₱600,000 a year)** | Assumption. **Replace with your real number** |

### Customer acquisition cost

Selling would be founder-led: visits, messages, and referrals. **Assumption:** about ₱30,000 in travel and materials for each client won in year one, plus many hours of your time. That is included in the travel and sales line, and time is the larger cost.

### Year-one scenarios

**These are hypothetical, not forecasts.** Direct costs per client are assumptions: ₱15,000 for Starter, ₱30,000 for Standard, and ₱60,000 for University.

| | **Conservative** | **Moderate** | **Optimistic** |
|---|---:|---:|---:|
| **Clients** | 1 Starter | 3 Starter, 1 Standard | 6 Starter, 3 Standard, 1 University |
| Setup revenue | ₱120,000 | ₱610,000 | ₱1,970,000 |
| Annual fees | ₱40,000 | ₱200,000 | ₱660,000 |
| **Total revenue** | **₱160,000** | **₱810,000** | **₱2,630,000** |
| Direct client costs | ₱15,000 | ₱75,000 | ₱240,000 |
| Cash costs | ₱150,000 | ₱150,000 | ₱510,000 (includes a ₱30,000/month contractor) |
| **Result before your pay** | **−₱5,000** | **₱585,000** | **₱1,880,000** |
| **Result after ₱600,000 pay** | **−₱605,000** | **−₱15,000** | **₱1,280,000** |
| Recurring per month | ₱3,333 | ₱16,667 | ₱55,000 |

Most year-one income in every scenario is one-time setup fees. **That's project income, and it must be re-earned each year.**

### Break-even

| Goal | Needed (Estimate) |
|---|---|
| Cover cash costs on recurring fees alone | 3–4 active clients |
| Cover cash costs and your pay on recurring fees alone | 15–19 active clients (₱750,000 a year at ₱40,000–50,000 per client) |
| Hold that level at 25% yearly churn (Assumption) | 4–5 new clients a year |

### Margins

| Revenue | Margin (Estimate) | Depends on |
|---|---|---|
| **Annual fees** | About 76% at 4 clients, over 90% at 15, before support time | Infrastructure of about ₱48,000 a year |
| **Setup, 3-week build** | About 56% | ₱37,500 of your time plus ₱15,000 direct cost |
| **Setup, 6-week build** | About 25% | ₱75,000 of your time plus ₱15,000 direct cost |

**Build time is the number that matters most.** The plan's estimate for building the CCC exterior alone was 3–4 weeks. Without a reusable kit, a Starter client may be barely worth taking.

### Retention risk

Churn is likely in year two, when a school asks what the tour achieved. Without inquiry data there's no answer, and the school will probably cancel.

---

## 6. Product and technical feasibility

Building this is feasible, since you've already built something harder than what's needed. The main risk is not whether it can be built, but whether it can be **repeated cheaply**.

### What to keep, build, and postpone

| Priority | Feature | Reason |
|---|---|---|
| **Must build** | Inquiry button and form | The school's proof of value |
| **Must build** | Privacy-respecting analytics: visitors, time, stops, inquiries | The renewal argument |
| **Must build** | Campus data file: one config per school | Makes a second school possible |
| **Must build** | Reusable building kit instead of hand-written buildings | The largest effect on margins |
| **Must build** | Testing on low-end phones and slow data | Your actual audience |
| **Essential** | The diorama, cutaway floors, and 360° photos | The core product, already built |
| **Essential** | Passport with stamps and quiz, without accounts | Some game value, no sign-up barrier |
| **Essential** | Website embed and shareable links for Facebook | Where prospective students are |
| **Postpone** | Accounts and avatar customization | Sign-up scares off visitors |
| **Postpone** | Live multiplayer | Costly, doesn't scale yet, and is rarely useful to a lone visitor |
| **Postpone** | Sitting, NPCs, vehicles, and similar detail | Impressive but unlikely to affect a purchase |
| **Postpone** | All full 3D interiors | The 360° photos already show rooms cheaply |
| **Disable for customers** | Voice chat | See below |

### Multiplayer scaling problem

**Fact:** walkers send up to 10 movement messages a second (`src/scene/OnlinePlayers.ts:193`), and everyone shares one channel. [Supabase counts each broadcast as one sent plus one for each client receiving it](https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages).

So when everyone is walking, the rate is about 10 × people × people.

| Plan | [Message limit per second](https://supabase.com/docs/guides/realtime/limits) | People walking at once (Estimate) |
|---|---:|---:|
| Free | 100 | **About 3** |
| Pro | 500 | **About 7** |
| Pro, no spend cap | 2,500 | **About 15** |

A class of 30 walking for 30 minutes would want about 16 million messages at a rate far above any of these limits, against a monthly Pro allowance of 5 million. These limits are configurable and I haven't load-tested this, so **test it before any group demo, including your thesis evaluation**. The usual fixes are fewer updates a second and separate channels per area.

### Voice chat risks

- **Reliability:** the one-way problem isn't solved. It connects directly using STUN only, so some networks are likely to fail without a relay.
- **Privacy:** the mic now turns on from Explore once permission is remembered. Peers can see each other's IP addresses, and the legal text doesn't mention voice.
- **Safety:** open voice among strangers needs reporting and moderation. A school won't want to answer for this, and some incoming students may be minors.

**Recommendation:** keep voice for the thesis if you want it, but make it opt-in, and leave it out of what you sell.

### Legal and rights risks (blockers for selling)

These are project risks to raise with your adviser or a lawyer, not legal advice.

| Risk | Status |
|---|---|
| **The 360° photos, floor plans, and panel text** belong to the original group and other rights holders (`COPYRIGHT.md`). You can't sell them, and they should be cleared for the public site too | Open |
| **Layout estimates came from Google Maps.** The project's plan says to replace them before public release, and the site is already public | Open |
| **CCC's name, seal, and uniform** need its permission for any commercial demo | Open |
| **Your school's thesis rules** may give it a claim on the work | Check now |
| **Student data:** the [National Privacy Commission stresses clear policies and consent](https://newsbytes.ph/2022/06/02/npc-recording-and-uploading-of-online-classes-not-violation-of-data-privacy-law/) for school recordings. Inquiry forms collect personal data, and you'd likely handle it for schools | Needs a data agreement |
| **Public school contracts:** the [small value procurement threshold is reported as ₱2 million under RA 12009](https://www.gppb.gov.ph/?p=12337). It generally requires at least three quotations and registered vendors | Confirm the current rules |

### Stack

Keep React, TypeScript, Three.js, Vite, Vercel, and Supabase. Don't rewrite anything, and don't add WebGPU or new infrastructure. Dependence on Vercel and Supabase is low risk because a static tour can move hosts. Live multiplayer is the part tied most closely to Supabase.

---

## 7. Customer acquisition

### Ideal first customer

A private college in CALABARZON or Metro Manila with these traits:

- 500–3,000 students
- An active Facebook page and someone responsible for marketing
- Visibly recruiting, for example with enrollment ads
- A campus worth showing, with few buildings
- A leader you can reach through a personal contact

### Where to find them

- [CHED's list of institutions](https://legacy.ched.gov.ph/statistics/)
- Facebook enrollment ads
- College fairs and senior high school career events
- Your adviser and faculty, who know people at other colleges
- Associations such as CEAP and regional private school groups

### Who to approach

| Role | What they care about | Lead with |
|---|---|---|
| **Marketing or admissions head** | Inquiries and being noticed | "See how many students explored your campus and then inquired" |
| **President or VP** | Enrollment, reputation, and cost | "Costs less than one extra student's tuition each year" only once you verify their tuition |
| **Student affairs** | Orientation workload | Orientation quest |
| **Finance** | Predictable cost | Fixed price with clear terms |

### Plan for a solo founder

| Step | What to do |
|---|---|
| **1. List** | 50 target schools with the contact person, from public sources |
| **2. Reach** | Personal intro first, then a short message with a 60-second video. Don't send mass email |
| **3. Interview** | 20 minutes, asking about enrollment problems. **Don't pitch yet** |
| **4. Demo** | A rough model of **their own** campus exterior in the tour, with no game extras. This is by far the strongest thing you can show, so spend the time on it for the best 5 schools only, and use only public or permitted reference material |
| **5. Propose** | One page with price, scope, and timeline, and a clear pilot option |
| **6. Pilot** | 50% deposit, ₱60,000 for Starter, then one building and an inquiry form live within 3–4 weeks, timed to their enrollment period |
| **7. Convert** | Show inquiry and visitor numbers, then offer the remaining buildings and the annual plan |
| **8. Onboard** | One checklist: a contact person, floor plans, photo day, content review, and go-live |

**Sales presentation (10 minutes):** their enrollment goal, the student's first impression online, a demo on their campus, an inquiry appearing on the report, the price, and the pilot.

**Funnel assumption, to be replaced with your real results:** 50 contacted → 15 conversations → 5 proposals → 1–2 paid. Don't count on anything faster, since school decisions often depend on budget timing.

---

## 8. Retention and recurring revenue

**A hard truth:** a virtual tour isn't naturally used every day, and a school can easily feel it's "done". Recurring revenue has to come from recurring needs:

| Recurring need | How often | Feature |
|---|---|---|
| Enrollment season | Yearly | Seasonal campaign, report, and refreshed content |
| New student orientation | Yearly | Orientation quest |
| Campus and staff changes | As they happen | Content updates |
| Open houses and Foundation Day | Yearly | Event version |
| Proving results to leadership | Monthly and yearly | Inquiry report |

### Metrics

| Metric | Why |
|---|---|
| **Inquiries started from the tour** | The main value |
| Unique visitors and sources | Reach |
| Tour completion and time spent | Engagement |
| Most-viewed locations | Tells the school what students care about |
| Share of new students finishing orientation | Student affairs value |
| **Cost per inquiry against Facebook ads** | The buyer's real comparison |

### Why customers would cancel

- Few visitors, or no measurable inquiries
- The staff member who wanted it leaves
- Budget cuts
- Content goes out of date
- A student group offers to build one free
- The tour runs poorly on phones

### What to add for retention

Only three things: the monthly report, staff self-service text editing, and a yearly refresh visit. Don't add more game features to fix a retention problem.

---

## 9. Risks, ranked by severity

| # | Risk | Severity | How to reduce it |
|---|---|---|---|
| 1 | **Schools like it but won't pay.** There's no payment evidence | Critical | Ask for deposits early. Praise doesn't count |
| 2 | **Free alternatives,** especially capstone projects | Critical | Sell upkeep, results, and accountability, not the tour itself |
| 3 | **No proof of enrollment value** | Critical | Build the inquiry form and report before more features |
| 4 | **Too much custom work per campus,** making this a low-margin agency | High | Build a kit, limit the scope per tier, and charge for extras |
| 5 | **Rights problems** with photos, Google-derived layout, and CCC identity | High | Get written permissions, and shoot new photos for each client |
| 6 | **Low budgets and long sales cycles** | High | Start with private schools, fixed prices, and pilots timed to enrollment |
| 7 | **Year-two churn** | High | Show results monthly, and sell multi-year terms at a discount |
| 8 | **Founder distraction** while the thesis is unfinished | High | Finish the thesis. Limit the business to interviews until then |
| 9 | **Voice and privacy incident** | Medium-high | Remove voice from the product, and write proper privacy terms and data agreements |
| 10 | **Multiplayer limits** | Medium | Leave it out of the product, and load test it for the thesis |
| 11 | **Poor phone performance** | Medium | Test on low-end devices before selling |
| 12 | **Dependence on Vercel or Supabase** | Low | Keep the tour mostly static so it can move |

---

## 10. Investment recommendation

**Assuming it's my own money:**

1. **Would I invest?** **Not in a gamified multiplayer SaaS.** I would put a small, staged amount into testing a paid tour service for private colleges, and only after you finish your thesis or alongside only light work on it.
2. **What first?** Customer conversations and one demo on another school's campus.
3. **Validation budget:** **about ₱15,000,** plus your time.
4. **What to avoid spending on:**
   - More 3D rooms or game features
   - Ads or a company website
   - Mobile apps
   - Expensive scanners or cameras (rent or borrow them)
   - Hiring
   - A trademark or heavy legal setup before a first payment
5. **What must be proven first:** that decision-makers will pay a deposit, that a campus can be built in under 3 weeks, and that a tour generates measurable inquiries.
6. **When to stop:** see below.
7. **When to expand:** see below.

### Staged plan

| Stage | Money | Spent on | Condition to unlock |
|---|---|---|---|
| **0. Validate** | About ₱15,000 | Travel, a demo video, and a domain | None |
| **1. First pilots** | About ₱50,000 | Vercel and Supabase Pro, capture gear, registration, and basic legal documents | At least 3 written requests for a proposal, and **at least 1 deposit** |
| **2. Repeatable** | ₱150,000–₱300,000 | The building kit, staff editing, and a part-time 3D contractor | 3 paying clients, build time under 3 weeks, and at least 2 likely to renew |
| **3. Grow** | From profits | Sales help and a second region | 10 or more clients, under 20% churn, and profitable delivery |

### Stop if, by day 90

- Fewer than 3 of 30 decision-maker conversations ask for a proposal
- **No school pays a deposit**
- Schools consistently prefer a cheap 360° tour after seeing both
- Building a second campus takes over 6 weeks, even after you've created the kit
- A pilot produces almost no visitors or inquiries, even with school promotion

**Stopping is a reasonable outcome.** You'd still have a finished thesis and a strong portfolio piece.

### Expand if

- At least 3 schools have paid close to list price
- At least 2 schools say they'd renew, and they back it with a signed or paid renewal
- Inquiries from the tour are measurable, and cost per inquiry compares well with ads
- At least one school refers you to another

---

## 11. 90-day roadmap

**Adjustment:** I don't know your thesis deadline. **If it falls within these 90 days, finish the thesis first.** The interviews can run alongside it, and the rest should wait. I've also moved the rights work to the start, and limited the build to what's needed to sell.

| Days | Focus | Work | Success criteria |
|---|---|---|---|
| **1–15** | Research and interviews | List 50 schools. Talk to 15 decision-makers and 20 students. Ask about the budget and past tour purchases. Ask your adviser about IP rights, and ask CCC and the original authors for written permission | 15 interviews done. At least 5 name recruitment as a top problem. Rights position is clear |
| **16–30** | Prototype and MVP plan | Pick the segment. Make a rough demo of **one other school's campus**, timing how long it takes. Test a price sheet in 5 follow-ups | Demo built in 5 days or less. At least 3 proposal requests. **Otherwise stop or change segment** |
| **31–45** | MVP | Build the inquiry form, analytics, campus config, and embed. Turn off accounts, multiplayer, and voice for this version. Test on low-end phones | One school config runs from data. Loads under 5 s on a mid-range phone, the project's own budget. Report works |
| **46–60** | Pilots | Sign 1–3 pilots with a deposit. Capture new photos. Launch with school promotion | **At least 1 deposit.** Pilot live within 3–4 weeks. At least 200 visitors (Assumption) |
| **61–75** | Feedback | Track visitors and inquiries. Interview staff and students. Fix only what blocks results | At least 2% of visitors inquire (Assumption). Build time measured. Top 3 issues fixed |
| **76–90** | Payment and decision | Show results. Ask for the balance and the annual plan. Compare with section 10's criteria | At least 1 pays in full. At least 1 commits to annual. **Written continue, change, or stop decision** |

---

## 12. Final verdict

| Area | Assessment |
|---|---|
| **Commercial potential** | **Low to moderate.** Could be a small service business, but not a large SaaS on current evidence |
| **Market demand evidence** | **Weak.** Interest in virtual tours is documented, mostly by vendors and in the US. There's no Philippine payment evidence |
| **Problem-solution fit** | **Weak today.** Enrollment pressure is real, but the product doesn't yet connect to it |
| **Monetization potential** | **Moderate as setup + annual,** poor as pure SaaS |
| **Technical feasibility** | **High for the tour.** Weak for repeatable delivery, and live multiplayer and voice are unproven at scale |
| **Customer acquisition difficulty** | **High.** Personal selling, few decision-makers, and budget-timed cycles |
| **Retention potential** | **Moderate only if results are shown.** Weak otherwise |
| **Investment risk** | **High for large spending,** low for the ₱15,000 test |
| **Recommended model** | **Setup fee + annual subscription** |
| **Recommended first market** | **Private colleges in CALABARZON and Metro Manila with 500–3,000 students** |

### Overall: **Not recommended in its current form**

The current product is single-school, needs custom code for each campus, carries unresolved rights, and has no way to show value. Its most complex features are aimed at a need no buyer has expressed. Technical quality doesn't change any of that.

The narrower version rates **Potential but requires validation**: a lean tour with inquiry tracking, sold to private colleges under enrollment pressure.

### Assumptions to challenge

| You might assume | Challenge |
|---|---|
| "Students like it, so schools will pay" | Students aren't the buyer, and enjoyment isn't enrollment |
| "Gamification is the differentiator" | Nothing shows that buyers value it. It could even look unserious to some schools |
| "CCC can be the first customer" | It has the least reason to pay, and public procurement adds steps |
| "More features will make it sell" | Inquiry tracking probably beats every remaining game feature |
| "It can be SaaS" | Today it's custom production. SaaS needs a self-serve or low-touch process |

### Opportunities you may be overlooking

1. **Sell your skills first.** Interactive 3D web work is a sellable skill. Freelance or agency projects could produce income sooner, with less market risk, and could also reveal who pays for this kind of work.
2. **Property developers.** They already spend on showrooms and virtual tours, and one sale is worth far more than a college's tuition. Competition from established studios is likely, and you have no evidence yet, so test it with 5 meetings.
3. **Use the thesis as your evidence.** Comparing the original and the remaster on wayfinding, knowledge, and usability gives you local data no competitor seems to have published. Add one measure a school would care about, such as a student's stated interest in applying.
4. **Orientation as the wedge.** It's a smaller budget, but it's less crowded, repeats yearly, and is easier to measure than enrollment.
5. **Start with the 360° tour and upsell to 3D.** Competing with Anova-style providers on the low end gets you in the door with a cheap entry offer, and that may sell better than leading with the expensive version.

### Next three actions

1. Ask your adviser who owns the thesis work and what you need from CCC and the original authors.
2. Book 5 conversations with marketing or admissions heads at private colleges this month.
3. Load test multiplayer before your thesis evaluation, using the numbers in section 6.

---

## Limits of this evaluation

- **Not tested:** real school buyers, real phones, multiplayer under load, or actual prices. All pricing and funnel numbers are recommendations or assumptions.
- **Source quality:** many market numbers come from vendors, and most are from the US. I read several through search summaries instead of the original reports. Check any figure you plan to quote in the thesis or a pitch, especially the RNL figures and the ₱2 million threshold.
- **Prices change.** Vercel, Supabase, and Cloudflare prices are as found on 2026-11-02.
- **This isn't legal or financial advice.** Consult a lawyer on rights, privacy, and contracts, and an accountant on registration and tax.

## Sources

**Market and enrollment**
- [CHED: HEI distribution, AY 2024-25](https://legacy.ched.gov.ph/statistics/)
- [PIDS: free tuition law and private colleges](https://pids.gov.ph/details/news/press-releases/free-tuition-law-puts-pressure-on-private-colleges-experts)
- [Manila Bulletin: financial crisis in higher education](https://mb.com.ph/13/1/2025/financial-crisis-threatens-ph-higher-education)
- [Philstar: private schools and falling enrollment](https://www.philstar.com/headlines/2025/09/30/2476504/private-schools-urge-govt-expand-voucher-program-amid-falling-enrollment)
- [Wikipedia: City College of Calamba](https://en.wikipedia.org/wiki/City_College_of_Calamba)
- [Xuanxiao directory: CCC enrollment](https://xuanxiao.org/en/universities/city-college-of-calamba)

**Demand and effectiveness**
- [RNL E-Expectations 2023](https://www.ruffalonl.com/wp-content/uploads/2023/08/26J80-E-Expectations-Series-Engaging-Prospective-Students-Through-Virtual-Experiences-and-Video-Content.pdf)
- [eCampus News on RNL](https://www.ecampusnews.com/campus-leadership/2023/08/03/when-it-comes-to-recruitment-websites-are-key/2/)
- [StudentBridge: power of virtual tours](https://studentbridge.com/blog/intelligence-power-of-virtual-tours)
- [Inside Higher Ed: Student Voice data](https://www.insidehighered.com/node/8760)
- [Ghent University: gamified orientation day](https://papers.academic-conferences.org/index.php/ecgbl/article/view/672)

**Competitors**
- [THE FUTURE 3D: platform cost comparison](https://www.thefuture3d.com/equipment/compare/virtual-tour-platforms-education/)
- [Concept3D pricing](https://concept3d.com/interactive-virtual-experiences/pricing/)
- [Anova Virtual Tours: packages](https://anovavirtualtours.ph/virtual-tour-services-and-package/)
- [360Manila](https://360manila.com/)
- [Utah State University: Roblox campus](https://www.usu.edu/today/story/usu-offers-virtual-campus-experience-through-roblox/)
- [Manila Bulletin: UST Minecraft server](https://mb.com.ph/2020/8/28/a-first-look-into-the-incredibly-detailed-ust-minecraft-server)
- [UST virtual tour](https://www.ust.edu.ph/public-affairs-opens-ust-virtual-tour-for-online-visits/)
- [UPOU VR tour](https://www.upou.edu.ph/news/upou-unveils-pioneering-virtual-reality-tour-featuring-360-degree-videos-and-images/)
- [ICETECH 2024 proceedings, including Ilocos Sur Polytechnic's campus tour](https://download.atlantis-press.com/proceedings/icetech-24/126019044)
- [Megaworld showroom](https://dailyguardian.com.ph/?p=367052), [Alveo showroom](https://business.inquirer.net/?p=335494), and [DMCI 360° tour](https://www.dmcihomes.com/amp/whats-new/news/explore-with-the-new-360-degree-virtual-tour)

**Costs and infrastructure**
- [Supabase pricing](https://supabase.com/pricing)
- [Supabase Realtime limits](https://supabase.com/docs/guides/realtime/limits)
- [Supabase Realtime message billing](https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages)
- [Vercel pricing](https://examples.vercel.com/pricing) and [MakerKit on Vercel costs](https://makerkit.dev/blog/saas/vercel-cost)
- [Cloudflare TURN FAQ](https://developers.cloudflare.com/realtime/turn/faq/)
- [BSP peso-dollar rate](https://www.bsp.gov.ph/statistics/external/day99_data.aspx)

**Law and procurement**
- [NewsBytes: NPC on recording online classes](https://newsbytes.ph/2022/06/02/npc-recording-and-uploading-of-online-classes-not-violation-of-data-privacy-law/)
- [GPPB: small value procurement under RA 12009](https://www.gppb.gov.ph/?p=12337)
