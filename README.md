# Event Check-in Hub

Create a mobile-first Coding Club Event Attendance website for a college coding event.

Students register through a Google Form, and the responses are stored in Google Sheets.

I am a student executive and will use this website on my mobile phone at the lab entrance.

Core flow

Google Form → Google Sheet → Website

Only students who are registered through the Google Form should appear.

Dashboard

Show:

Coding Club Event title

Total Registered

Total Present

Remaining

Attendance percentage

Search

Add a large search bar:

Search team, student name, roll number...

Search by:

Team name

Student name

Roll number

Email

Registration ID

Search results should update instantly.

Team display

Group students by team.

Example:

CODE WARRIORS
3 Members · 2/3 Present

☑ Thousif Shaik — Y24IT157
☑ Rahul Kumar — Y24IT123
☐ Arjun Reddy — Y24IT145

Each student must have a large mobile-friendly attendance checkbox.

Attendance

When the executive checks a student:

Mark them Present

Save attendance

Store attendance timestamp

Prevent duplicate attendance records

Preserve attendance after refreshing

Also add:

Mark Entire Team Present

with a confirmation dialog.

Filters

Add:

All | Present | Not Present

and a team filter.

Google Sheets

Use Google Apps Script as the backend.

Registration data comes from the Google Form response sheet.

Example registration columns:

Timestamp
Team Name
Student Name
Roll Number
Email
Registration ID


Create a separate Attendance sheet containing:

Registration ID
Team Name
Student Name
Roll Number
Status
Attendance Time


The original registration sheet must be read-only.

Do NOT allow the executive to manually add registered students.

The website must show only students who exist in the Google Form response sheet.

Make the Google Apps Script Web App URL configurable so I can connect my own Google Sheet later.

Design

Make it:

Mobile-first

Modern

Clean

Professional

Fast

Easy to use with one hand

Large touch-friendly checkboxes

Large search bar

Rounded cards

Clear Present/Not Present indicators

No horizontal scrolling

The main workflow should be:

Search → Find student/team → Tick checkbox

Do not hardcode real student data.

Build the frontend and structure the project so that I can connect my Google Form/Google Sheet through Google Apps Script after the UI is complete.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://infomat.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/15587fd2-c163-4e51-8196-656d561ac9fe).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
