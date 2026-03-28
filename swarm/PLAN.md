# themedrops.com - Theme sharing site

This project is to build a website that is a gallery of "themes".

If you've run out of ideas, create some new ones.

This is a design-oriented project, it should look excellent from a design perspective.

# Features

## User login

Users can signup and create their own themes.
Themes should be fork-able, so people can make minor adjustments to themes and rename them to make them their own.
Users should have a profile page similar to like a youtube profile.
Themes can be commented on, starred, shared, etc.

## System themes

Seed the site with a system user, and add a bunch of themes under this user so there's a lot of base themes to look at in the gallery.
Create lots of system themes against the system user to seed the system.

## This sites theme switcher

This website itself it should allow you to use and apply any theme, e.g. this site should have a theme switcher that allows you to select any theme from this website.

## Gallery

Themes can be searchable using many criteria to narrow down your preferred theme.
The gallery provides a lot of filters to filter down to the theme you want.

## Feed

The home page should be some sort of feed that includes a mix of popular/new themes, and also people commenting on the themes.

## API

Themes that can be requested through an API to give back the theme as JSON - you can optionally ask for the theme in different ways using query parameters, like HSL instead of RGB etc.
The theme details page should make it clear how to call the API for this theme also.

## VS Code Extension

There should be a VSCode extension built in a sub-folder that allows you to install the extension to vscode, and then to use any theme available on themedrops.com
Think of other extension to build as well.
Maybe also a way to easily use themes inside Tailwind.

# Design

## Themes

All previews (like cards in the gallery) should themselves be previews of the theme itself.

Themes should include fonts as well as colors, and anything else that makes sense, but everytihng is optional.
The schema of the theme should be designed to be used in all applications, for example in VS Code, in Discord, in Jetbrains, in custom websites, etc.

These themes are color/typography/etc.
Themes should include fonts as well as colors, and anything else that makes sense, but everytihng is optional.

# Tech Stack

Tanstack Start on Vercel, Tailwind, Typescript, Convex.dev, Convex Username/Password Auth

# Testing

Make sure to test your work in a browser upon each iteration.
