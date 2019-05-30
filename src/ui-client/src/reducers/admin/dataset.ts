/* Copyright (c) 2019, UW Medicine Research IT, University of Washington
 * Developed by Nic Dobbins and Cliff Spital, CRIO Sean Mooney
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */ 

import AdminState from "../../models/state/AdminState";
import { AdminDatasetAction } from "../../actions/admin/dataset";
import { AdminPanelPatientListColumnTemplate, PatientListColumnType } from "../../models/patientList/Column";
import { AdminDatasetQuery, AdminDemographicsDatasetQuery } from "../../models/admin/Dataset";
import { PatientListDatasetShape } from "../../models/patientList/Dataset";
import { DefTemplates } from "../../models/patientList/DatasetDefinitionTemplate";
import { getSqlColumns } from "../../utils/parseSql";

const personId = 'personId';

export const setAdminPanelDatasetLoadState = (state: AdminState, action: AdminDatasetAction): AdminState => {
    return Object.assign({}, state, { 
        datasets: { 
            ...state.datasets,
            state: action.state
        }
    });
};

export const setAdminPanelCurrentDataset = (state: AdminState, action: AdminDatasetAction): AdminState => {
    const datasets = state.datasets;
    const ds = action.dataset! as AdminDatasetQuery;
    let expectedColumns = datasets.expectedColumns;
    let sqlColumns = datasets.sqlColumns;
    datasets.datasets.set(ds.id, ds);

    if (!action.changed) {
        const cols = getShapeColumns(ds.sql, ds.shape);
        expectedColumns = cols.expectedColumns;
        sqlColumns = cols.sqlColumns;
    }

    return Object.assign({}, state, { 
        datasets: { 
            ...state.datasets,
            changed: action.changed,
            currentDataset: action.dataset,
            datasets: datasets.datasets,
            editingDemographics: false,
            expectedColumns,
            sqlColumns
        }
    });
};

export const setAdminPanelDemographicsDataset = (state: AdminState, action: AdminDatasetAction): AdminState => {
    const sqlColumns = new Set(getSqlColumns((action.dataset! as AdminDemographicsDatasetQuery).sql));

    return Object.assign({}, state, { 
        datasets: { 
            ...state.datasets,
            changed: action.changed,
            demographicsDataset: action.dataset,
            expectedColumns: sqlColumns
        }
    });
};

export const setAdminPanelEditingDemographicsDataset = (state: AdminState, action: AdminDatasetAction): AdminState => {
    return Object.assign({}, state, { 
        datasets: { 
            ...state.datasets,
            editingDemographics: true
        }
    });
};

export const setAdminPanelDatasetShape = (state: AdminState, action: AdminDatasetAction): AdminState => {
    const datasets = state.datasets;
    const ds = Object.assign({}, datasets.currentDataset, { shape: action.shape });
    const { expectedColumns, sqlColumns } = getShapeColumns(ds.sql, action.shape!);
    datasets.datasets.set(ds.id, ds);

    return Object.assign({}, state, { 
        datasets: { 
            ...state.datasets,
            changed: true,
            currentDataset: ds,
            expectedColumns,
            sqlColumns
        }
    });
};

export const setAdminPanelDatasetSql = (state: AdminState, action: AdminDatasetAction): AdminState => {
    const datasets = state.datasets;
    const ds = Object.assign({}, datasets.currentDataset, { sql: action.sql });
    const sqlColumns = new Set(getSqlColumns(action.sql!));
    datasets.datasets.set(ds.id, ds);
    datasets.expectedColumns.forEach((c) => c.present = sqlColumns.has(c.id));

    return Object.assign({}, state, { 
        datasets: { 
            ...state.datasets,
            changed: true,
            currentDataset: ds,
            sqlColumns
        }
    });
};

const getShapeColumns = (sql: string, shape: PatientListDatasetShape) => {
    const template = DefTemplates.get(shape);
    const sqlColumns = new Set(getSqlColumns(sql));
    const expectedColumns: AdminPanelPatientListColumnTemplate[] = [
        { id: personId, type: PatientListColumnType.string, present: sqlColumns.has(personId) }
    ];

    if (shape !== PatientListDatasetShape.Dynamic) {
        template!.columns.forEach((c) => expectedColumns.push({ ...c, present: sqlColumns.has(c.id) }));
    }
    return { expectedColumns, sqlColumns };
} 