# Overview

## What the App Does

MyFoodHabits is a mobile calorie tracking app built around the idea that logging food should feel effortless. Most calorie apps treat food tracking as data entry. This app treats it as behavior support — predicting what the user will eat before they even open the keyboard.

The app learns from user habits and builds an increasingly accurate model of their typical day, allowing entire meals or even full days to be logged with a single tap.

## Target Users

- People who already know roughly what they eat and want to track consistency
- Users frustrated by the friction of existing apps (MyFitnessPal, Cronometer, etc.)
- Anyone who eats the same things regularly and wants a fast way to log them
- Initial focus: Swedish/Nordic market

## Core Features

### Must have (MVP)

- Food search with recent and popular items surfaced first
- Log food to a meal slot (breakfast, lunch, dinner, snack)
- View today's calories and macros (especially protein)
- Save and reuse meals
- Log body weight

### High value (post-MVP)

- Barcode scanning (Open Food Facts API)
- Habit detection — detect repeated patterns and suggest one-tap logging
- Remaining macros view — "you still need 77g protein, here are some options"
- Meal scaling (0.5x, 1x, 2x)
- Quick add command input (`+2 eggs +coffee`)

### Deferred (build after real users exist)

- AI photo food detection
- Natural language parsing
- Community voting / verified food moderation
- Grocery list generation
- Advanced coaching and analytics

## Philosophy

- **SLC**: Simple, Loveable, Complete. Do the core well, not everything poorly.
- **Everything that can be predicted should be predicted.** Pre-load data, surface recent foods, suggest habits.
- **Minimize typing and tapping.** Target: log a food in under 5 seconds.
- **Always keep the app runnable.** Never let the codebase sit broken for more than a day.
- **Show only what matters.** Calories and protein are king. Hide fat, fiber, sodium unless the user asks.

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | Expo (React Native)               |
| Backend  | Express (Node.js)                 |
| Database | PostgreSQL                        |
| Food API | Open Food Facts (barcode lookups) |
| Hosting  | Single VPS (initially)            |
