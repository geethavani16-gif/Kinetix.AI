// Automated Intellectual Property & Patent Licensing Factory

interface LicensePackage {
  fileName: string;
  content: string;
}

/**
 * Dynamically generates software legal frameworks based on the user's Google Pay checkout tier
 */
export function generateLegalLicense(projectName: string, clientName: string, tierName: string): LicensePackage {
  const currentYear = new Date().getFullYear();
  
  // Tier 1: Standard Base Tier - Restrictive Commercial Usage
  if (tierName === 'SaaS Base') {
    return {
      fileName: 'LICENSE.md',
      content: `# Proprietary Software Evaluation License
Copyright (c) ${currentYear} ${clientName}. All Rights Reserved.

This software architecture was generated via the VIBE_DEV_ENGINE Sandbox under a Base Tier Protocol.
Permission is hereby granted for personal prototyping, educational study, and internal testing ONLY.
Commercial redistribution, public hosting, or monetized deployment of this source code container is strictly prohibited without upgrading to an enterprise production tier.`
    };
  }
  
  // Tier 2: Nebula Pro Tier - Full Open-Source Commercial MIT Clearance
  if (tierName === 'Nebula Pro') {
    return {
      fileName: 'LICENSE.md',
      content: `# MIT License
Copyright (c) ${currentYear} ${clientName} (${projectName})

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.`
    };
  }

  // Tier 3: Supernova AI Tier - Advanced Enterprise Apache 2.0 with Active Patent Protections
  return {
    fileName: 'LICENSE.md',
    content: `# Apache License, Version 2.0
Copyright (c) ${currentYear} ${clientName}

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
You may obtain a copy of the License at: http://www.apache.org/licenses/LICENSE-2.0

### Grant of Patent License:
Subject to the terms and conditions of this License, each Contributor hereby grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable patent license to make, have made, use, offer to sell, sell, import, and otherwise transfer the Work.`
  };
}