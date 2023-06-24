# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Fixed

- Race condition for loading setting on display turning on.
  If the user was too fast to hit the button after waking
  up the device, the event to load the settings from disk
  would fire after the in-memory settings have changed.
  In practice this meant that an increment would be lost.

## [1.1.0] - 2023-03-11

### Changed

- Removed background from icon.

### Added

- This changelog.
- Ability to reset counter to any value (rather than just 0).

### Fixed

- Error due to NPE after resetting counters to zero.
  The settings would reset the 'projectOperation' setting to undefined,
  which was sent to the device and not handled properly.

## [1.0.0] - 2023-03-04
