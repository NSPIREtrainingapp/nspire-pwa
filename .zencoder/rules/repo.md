---
description: Repository Information Overview
alwaysApply: true
---

# NSPIRE Training App Information

## Summary
The NSPIRE Training App is a Progressive Web Application (PWA) that provides quick and easy search functionality for HUD NSPIRE Standards and Deficiency Criteria. It allows users to search through housing inspection standards and view detailed information about deficiencies, including severity levels and correction timeframes.

## Structure
- **Root Directory**: Contains the main HTML, JavaScript, and configuration files
- **Images Directory**: Stores images used in the application
- **.zencoder**: Contains rules and configuration for the Zencoder system

## Language & Runtime
**Language**: HTML, CSS, JavaScript
**Type**: Progressive Web Application (PWA)
**Build System**: None (Static web files)
**Package Manager**: None

## Main Files
**Entry Point**: index.html
**Data Source**: nspire-data.json
**PWA Configuration**: 
- manifest.json: Defines the application metadata and icons
- sw.js: Service worker for offline functionality and caching

## Application Features
**Core Functionality**:
- User authentication system with login and account creation
- Search interface for NSPIRE standards and deficiencies
- Detailed view of deficiency criteria with severity information
- Image gallery for deficiency documentation
- Responsive design for mobile and desktop use

**PWA Capabilities**:
- Offline functionality through service worker caching
- Installable on devices through the manifest configuration
- Mobile-friendly interface with portrait orientation
- Custom theme color (#FF6B35) and icons

## Data Structure
**Main Data Format**: JSON
**Key Data Elements**:
- Standards: Housing inspection standards with unique identifiers
- Areas: Unit, Inside, Outside classifications
- Deficiencies: Specific issues with criteria and severity levels
- Severity Ratings: Life-threatening, Severe, Moderate, Low
- HCV Status: Pass/Fail indicators for Housing Choice Voucher program

## User Interface
**Main Components**:
- Login Page: Authentication interface with email/password fields
- Search Page: Filterable list of standards and deficiencies
- Details Page: Comprehensive view of deficiency information
- Image Modal: Enlarged view of deficiency images

**Styling**:
- Custom CSS with responsive design
- Color scheme based on orange (#FF6B35) primary color
- Mobile-first approach with container width optimization

## Deployment
**Hosting Requirements**:
- Static web server or CDN
- HTTPS support for PWA functionality
- No backend requirements (client-side application)

**Installation Process**:
- Deploy static files to web server
- Ensure proper MIME types for manifest.json
- Configure service worker scope appropriately