# Sahaya: Existing Architecture & Workflows

This document outlines the current working architecture of the Sahaya AI application, including the major workflows (Symptom Assessment, Medicine Scanner, Hospital Finder) and the overarching system architecture.

## 1. Symptom Assessment Flow

This flowchart describes how users interact with the AI to assess their symptoms, resulting in a risk level and recommendations.

```mermaid
flowchart TD
    A["User initiates Symptom Check"] --> B["Select Profile (Self or Family Member)"]
    B --> C["Chat UI opens"]
    C --> D{"Input Method"}
    D -->|"Text"| E["Type symptoms"]
    D -->|"Voice"| F["Speak symptoms (STT via Capacitor/Web)"]
    E --> G["Send to Supabase Edge Function<br/>(sahaya-chat)"]
    F --> G
    G --> H["AI Model evaluates symptoms"]
    H --> I{"Is Assessment Complete?"}
    I -->|"No"| J["AI asks follow-up questions"]
    J --> C
    I -->|"Yes"| K["Return Final Result<br/>(Risk Level, Summary, Dos/Donts)"]
    K --> L["Save to Firestore (Assessments)"]
    L --> M["Popup: Find Nearby Hospitals?"]
    M -->|"Find Hospitals"| N["Go to Hospital Finder"]
    M -->|"Skip"| O["Go to Results Page"]
```

## 2. Medicine Scanner Flow

This flowchart describes how users can scan a medicine label to get AI-generated information about the drug.

```mermaid
flowchart TD
    A["User opens Medicine Scanner"] --> B["Camera Viewfinder (Capacitor)"]
    B --> C["Capture Image"]
    C --> D["Compress & convert to Base64"]
    D --> E["Send to Supabase Edge Function<br/>(analyze-medicine)"]
    E --> F["AI Vision Model analyzes label"]
    F --> G["Return JSON: Name, Uses, Dosage, Side Effects"]
    G --> H["Display details on screen"]
    H --> I["User saves to history"]
    I --> J["Save to Firestore (Profiles -> Medicines)"]
```

## 3. Hospital Finder & Appointment Flow

This flowchart describes the 100% free hospital finding module that uses government data and client-side calculations.

```mermaid
flowchart TD
    A["User opens Nearby Hospitals"] --> B["Request GPS Location"]
    B -->|"Granted"| C["Detect User State via Bounding Boxes"]
    B -->|"Denied"| D["Show Error / Manual State Select"]
    C --> E["Fetch Hospitals for State<br/>(Government Dataset API)"]
    D --> E
    E --> F["Calculate Haversine Distance locally<br/>for all returned hospitals"]
    F --> G["Sort by Distance (Top 15)"]
    G --> H["Display Hospital List"]
    H -->|"Tap Hospital"| I["Open Detail Modal"]
    I --> J["Auto-fill Patient Info (from profile)"]
    J --> K["Auto-fill Symptoms (from assessment)"]
    K --> L["Select Date/Time"]
    L --> M["Submit Appointment to Firestore"]
    I --> N["Get Directions (Google Maps Deep Link)"]
    I --> O["Call Hospital (Phone Dialer)"]
```

## 4. Final Existing Architecture

This diagram represents the complete, current architecture of Sahaya as it stands today. It uses a Capacitor front-end, Firebase for Identity and Database, and Supabase Edge Functions for secure AI interactions.

```mermaid
flowchart LR
    subgraph Client ["Client Apps"]
        Web["Web App (Vanilla JS)"]
        Android["Android App (Capacitor)"]
    end

    subgraph Firebase ["Firebase Services"]
        Auth["Firebase Auth<br/>(Identity)"]
        Firestore["Firestore Database<br/>(Profiles, Assessments, Appointments)"]
    end

    subgraph Supabase ["Supabase Edge Functions (BFF)"]
        ChatAPI["/sahaya-chat<br/>(Symptom AI)"]
        MedAPI["/analyze-medicine<br/>(Vision AI)"]
    end
    
    subgraph ThirdParty ["External APIs"]
        GovAPI["Data.gov.in<br/>(Hospital Directory API)"]
    end

    %% Connections
    Web --> Auth
    Android --> Auth
    
    Web --> Firestore
    Android --> Firestore
    
    %% AI interactions pass auth tokens
    Web -- "JWT Token" --> ChatAPI
    Web -- "JWT Token" --> MedAPI
    Android -- "JWT Token" --> ChatAPI
    Android -- "JWT Token" --> MedAPI
    
    %% Direct client fetch for free government API
    Web --> GovAPI
    Android --> GovAPI
```
