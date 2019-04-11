﻿// Copyright (c) 2019, UW Medicine Research IT, University of Washington
// Developed by Nic Dobbins and Cliff Spital, CRIO Sean Mooney
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Model.Compiler;
using Model.Cohort;

// TODO(cspital) this cannot be moved until we eliminate the dependency on the DTO project.

namespace Services.Compiler
{
    public interface IPanelValidator
    {
        PatientCountQuery Validate(PanelValidationContext ctx);

    }
}
