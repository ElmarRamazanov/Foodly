You are a senior full-stack developer.

Build a minimal but well-structured nutrition planner web application.

This is a single-user MVP and must NOT include authentication, payments, or SaaS features.
Focus only on the core planning system.

The application is primarily designed for desktop use but must be fully responsive and usable on mobile devices.

---

# 🎯 CORE FEATURES (ONLY THESE)

1. User enters:

   * daily calorie target
   * gluten-free toggle

2. System generates a weekly meal plan automatically:

   * 7 days
   * breakfast, lunch, dinner, snack
   * calories distributed across meals

3. User can edit the plan:

   * change food
   * change grams
   * remove food
   * add food

4. Calories update instantly when editing.

Do NOT add extra features.

---

# 🧱 TECH STACK (STRICT)

Frontend:

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* Responsive layout (desktop-first)

Backend:

* Next.js Route Handlers or API layer
* Clean service structure

Database:

* Supabase PostgreSQL

External API:

* USDA FoodData Central (for nutrition data)

---

# 🗄 DATABASE TABLES

Create normalized tables:

Foods

* id (uuid)
* name
* calories_per_100g
* protein
* carbs
* fat
* gluten_free (boolean)
* created_at

WeeklyPlans

* id
* target_calories
* gluten_free_only
* created_at

PlanDays

* id
* weekly_plan_id
* day_name

PlanMeals

* id
* day_id
* meal_type (breakfast/lunch/dinner/snack)

MealFoods

* id
* meal_id
* food_id
* grams

---

# 🧠 CORE BACKEND LOGIC

### Food Search

1. Search food in database first
2. If not found → fetch from USDA API
3. Normalize data
4. Save to DB
5. Return food

---

### Weekly Plan Generator (IMPORTANT)

Input:

* daily calorie target
* gluten-free option

Process:

1. Filter foods from DB based on gluten option

2. Create 7 days × 4 meals

3. Distribute calories:

   * breakfast 25%
   * lunch 30%
   * dinner 30%
   * snack 15%

4. Select foods randomly but logically:

   * breakfast: lighter foods
   * lunch/dinner: main foods
   * snack: fruits or light items

5. Assign gram amounts so calories are close to target.

6. Save generated plan to database.

---

### Plan Editing

Allow user to:

* replace food
* change grams
* delete food
* add new food

Whenever a change happens:

* recalculate meal calories
* recalculate day total instantly

---

# 🎨 UI REQUIREMENTS

### Home Page

* calorie input field
* gluten toggle
* generate plan button

### Weekly Plan Page

* show all 7 days
* meals grouped by day
* calories shown per meal and per day
* inline editing UI

### Food Search Modal

* search input
* results list
* add to meal button

---

# 📱 RESPONSIVE DESIGN

* Desktop layout first (grid based)
* Mobile stacked layout
* Sticky daily calorie summary on mobile
* Buttons large enough for touch
* Avoid horizontal scrolling

---

# 📦 OUTPUT

Generate the project step-by-step:

1. Folder structure
2. SQL schema
3. Backend services
4. API routes
5. USDA integration example
6. Weekly plan generation logic
7. Frontend pages
8. Setup instructions

Do NOT explain theory.
Generate production-quality code in steps.



