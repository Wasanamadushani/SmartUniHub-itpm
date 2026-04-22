# Settings Pages - Compilation Issue

## Problem
After implementing the new tabbed settings structure, there's a JavaScript parsing error preventing the frontend from compiling.

## Root Cause
The complex nested structure with multiple conditional renders and template literals in the new settings design is causing parsing issues.

## Solution
Revert to simpler, working settings pages and then gradually enhance them.

## Status
Need to restore working state first before applying improvements.
