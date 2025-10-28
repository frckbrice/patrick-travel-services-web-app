#!/bin/bash

# Immigration Templates Download Script
# This script downloads common immigration document templates

set -e

# Create templates directory if it doesn't exist
mkdir -p public/templates

echo "Starting immigration templates download..."

# Note: This script attempts to download sample templates
# For production use, download official forms from IRCC website

# Student Visa Templates
echo "Downloading Student Visa templates..."
curl -L -o "public/templates/imm-1294-study-permit.pdf" "https://www.canada.ca/content/dam/ircc/migration/ircc/english/pdf/kits/forms/imm1294e.pdf" 2>/dev/null || echo "Could not download IMM 1294"

# Work Permit Templates
echo "Downloading Work Permit templates..."
curl -L -o "public/templates/imm-1294-work-permit.pdf" "https://www.canada.ca/content/dam/ircc/migration/ircc/english/pdf/kits/forms/imm1294b.pdf" 2>/dev/null || echo "Could not download Work Permit form"

# Tourist Visa Templates
echo "Downloading Visitor Visa templates..."
curl -L -o "public/templates/imm-5257-visitor-visa.pdf" "https://www.canada.ca/content/dam/ircc/migration/ircc/english/pdf/kits/forms/imm5257e.pdf" 2>/dev/null || echo "Could not download Visitor Visa form"

# Family Information Form
echo "Downloading Family Information templates..."
curl -L -o "public/templates/imm-5645-family-information.pdf" "https://www.canada.ca/content/dam/ircc/migration/ircc/english/pdf/kits/forms/imm5645e.pdf" 2>/dev/null || echo "Could not download Family Information form"

# Generic Application Form
echo "Downloading Generic Application Form..."
curl -L -o "public/templates/imm-0008-generic-application.pdf" "https://www.canada.ca/content/dam/ircc/migration/ircc/english/pdf/kits/forms/imm0008e.pdf" 2>/dev/null || echo "Could not download Generic Application form"

echo ""
echo "Download complete!"
echo "Note: Some downloads may have failed. Please manually download official forms from:"
echo "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/application-forms-guides.html"
echo ""
echo "Files downloaded to: public/templates/"
ls -lh public/templates/

