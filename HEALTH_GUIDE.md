# Health update

Open **Other → Health → Health overview**. Health also appears in Other’s action search.

This is an annual life-simulation system: diagnoses, prices, probabilities and treatment outcomes are game abstractions. It is not a day-by-day cycle tracker or a clinical prediction model.

## What is included

- **39 conditions and support needs**, spanning congenital/inherited conditions, childhood diagnoses, chronic illnesses, episodic conditions and short illnesses/injuries.
- **20 care specialties**, named fictional providers, appointments, assessments, referrals and saved medical records.
- Body-profile selection, puberty, menstrual health, perimenopause, menopause, pregnancy and postpartum support.
- Recurring care, contraception supply/replacement rules, prevention and mental wellbeing.
- Events and decisions tied to symptoms, development, care access and family transitions.

## Character profile and life stages

Before selecting **Be born**, choose **Character body profile**: generated, female physiology, male physiology, or intersex/variable physiology. An intersex profile can include or omit the menstrual-cycle simulation. These settings describe game physiology, not gender identity. Existing saves receive a stable profile when migrated; migration does not roll additional newborn diagnoses.

Puberty timing varies by character. The game covers growth, skin changes, body hair, emotions and age-appropriate questions. Male profiles include voice/facial-hair changes; female profiles include breast development and possible period onset. Events offer information, practical routines and trusted-adult/clinical support. Puberty is not added to the disease list.

Childhood Body pages show height, weight and developmental context instead of classifying children using adult BMI thresholds.

## Conditions present at birth or developed later

The newborn pool includes hearing loss, color-vision difference, congenital heart defects, sickle cell disease, hemophilia, cystic fibrosis and congenital hypothyroidism. Some are known through newborn assessment; others require later assessment. Color-vision differences are not confirmed by newborn screening in this simulation.

Later-life conditions include asthma, allergies, type 1/type 2 diabetes, celiac disease, scoliosis, ADHD support needs, hypertension, heart/lung/liver disease, cancer, arthritis, depression/anxiety, back pain, eczema, acne, migraine, epilepsy, hypothyroidism, anemia, PCOS, endometriosis, osteoporosis, prostate enlargement, cataracts, infections, fractures and postpartum depression.

Each condition has its own identity, origin, onset age, diagnostic status, symptom burden, care state and treatment history. Age, habits, wellbeing, previous prevention and some physical-health factors influence the fictional onset rules. Some conditions can exist before the player knows their name. Unconfirmed symptoms prompt assessment rather than instantly becoming a diagnosis.

## Doctor appointments

Use **Primary & specialty appointments** to book, then **Attend appointment** within the current game year. Payment occurs once when attending, at the displayed current price. Cancellation is free. Pending appointments expire on Age Up and can be booked again. Each clinic allows two completed appointments per game year.

Specialties include primary/pediatric care, cardiology, endocrinology, pulmonology, gastroenterology, neurology, dermatology, mental health, gynecology/reproductive care, obstetrics/postpartum care, urology, orthopedics/physical therapy, ENT/audiology, ophthalmology, allergy/immunology, hematology, oncology, rheumatology, urgent care and emergency care.

Primary care can assess general concerns and record referrals. A matching specialty has a stronger game chance of identifying its hidden conditions. Screening is not guaranteed to find every condition. A matching specialist assessment is required before a specialist procedure.

Public coverage, insurance and the character’s family/guardian care budget affect prices. Eligible clinical care before age 18 is covered by the family budget without creating cash or debt. Free care remains available even when the cash balance is negative. Private care cannot deduct more than the available cash for the selected action.

## Treatment and follow-up

Under **Conditions & care plans**, arrange care for a confirmed condition. The displayed plan price is charged once per condition/year. If a condition has a specialist procedure, its assessment and procedure are separate, visible costs; success is not guaranteed.

Long-term care controls symptoms and reduces game health burden; it does not silently delete a chronic diagnosis. Some conditions can enter remission while remaining on the record. Treated short illnesses can resolve, and some procedures can correct their targeted condition. ADHD and color-vision differences do not carry a lifespan-health penalty in this model.

**Renew care automatically each year** is optional. It attempts an annual payment, records the cost once and updates the care plan. An unaffordable renewal does not overdraw cash; it creates a care-access decision instead. Care choices, known diagnoses and appointment outcomes are retained in **Medical records**.

## Periods, perimenopause and menopause

**Puberty, periods & menopause** shows the current reproductive life stage. A year summarizes cycles rather than simulating individual days. Early cycles, changing symptoms, irregularity, support and symptom notes are tracked. Difficult symptoms can lead to reproductive-health appointments and assessment for relevant conditions.

Pregnancy carried by the character pauses cycles. Birth can open a postpartum recovery period, follow-up appointments, practical-support choices and mood support. A partner/external-carrier pregnancy is distinguished from the character’s own physical recovery.

Perimenopause and menopause timing varies by character. Transition notes include hot flushes, sleep and mood changes. A reproductive-health consultation can establish symptom support and discuss longer-term care. Menopause is a normal stage, not a disease. Menstrual periods end after menopause in this simulation.

The existing natural-conception age range remains **18–50**; menopause can end the character’s own natural-conception path earlier. Fertility depends on age, health, simulated fertility barriers and some cycle-related conditions. Family Planning distinguishes self, partner and external-carrier pathways; adoption and surrogacy remain separate options. This is simplified family-building logic.

## Birth control and pregnancy care

Family Planning offers condoms, the pill, IUD, implant, patch, ring and injection, plus stopping the current method. Education/options unlock at 13. Methods are restricted to compatible profiles and cannot be newly selected during an ongoing pregnancy. Displayed clinical costs reflect coverage.

Annual supply costs are billed once, with a medical record and budget entry. If supplies cannot renew, coverage is paused and a review decision is queued. In this game, IUD and implant replacement is due after five and three years respectively; those are explicit game rules, not universal device durations. Expired methods no longer count toward the simulated conception odds until renewed/replaced. Mild reported changes can prompt a contraceptive review.

Fertility consultations are limited to once per year and charge once. Prenatal care is a recorded obstetric appointment and cannot be charged repeatedly for the same pregnancy. Existing guards against concurrent pregnancies remain in place, including stale family-planning choices after menopause or outside the game’s age limits.

## Prevention, wellbeing and events

Prevention includes immunization review, dental care, a sleep/stress plan, accessible movement and nutrition consultation, each limited by game year. Therapy supports wellbeing and management/remission rather than guaranteeing a permanent cure; three sessions are available per year.

Development and health decisions are queued behind existing events. They do not overwrite a pending school, work or relationship choice. They can book care, add support, create symptom notes or establish follow-up plans. Booked care still needs attendance unless the action explicitly completes a same-year visit.

## Saving and validation

Health profiles, conditions, cycle history, care plans, appointments, preventive actions, decisions and records are included in normal save slots and JSON backups. Malformed medical profiles/appointments are rejected on import. Legacy conditions and saves are retained and normalized.

**74 Chromium tests pass, with zero failures or skips.** Added health cases cover profile selection, congenital/developed conditions, matching-specialist diagnosis, exactly-once appointment and treatment costs, insurance/family coverage, expiration/cancellation, chronic renewals, procedures, recovery, puberty, periods/menopause, contraception, prenatal/postpartum integration, hidden diagnoses, queues, saves/migration and childhood growth. New health pages also pass automated label, button-name, dialog and contrast checks at 320px in both themes.

The tests do not exhaust every condition combination or random life history. The model has no detailed laboratory values, real medication doses, day-by-day cycles, hospital stay scheduling, real-world insurance adjudication or clinical survival prediction. Manual screen-reader and physical-device validation remain outside the completed checks.
